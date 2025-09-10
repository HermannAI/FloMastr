


from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Optional
import asyncpg
import os

class TenantIsolationMiddleware(BaseHTTPMiddleware):
    """Middleware to ensure tenant data isolation
    
    This middleware:
    1. Extracts tenant slug from the host header
    2. Validates the tenant exists and is active
    3. Adds tenant context to the request
    4. Ensures API calls are scoped to the correct tenant
    """
    
    def __init__(self, app, excluded_paths: Optional[list] = None):
        super().__init__(app)
        self.excluded_paths = excluded_paths or [
            "/docs",
            "/openapi.json",
            "/check-health",
            "/tenants",  # Admin endpoints for tenant management
            "/resolve-tenant"  # Tenant resolution endpoint
        ]
    
    async def dispatch(self, request: Request, call_next):
        # Skip middleware for excluded paths
        if any(request.url.path.startswith(path) for path in self.excluded_paths):
            return await call_next(request)
        
        # Extract tenant slug - prioritize X-Tenant-Slug header
        tenant_slug = request.headers.get("X-Tenant-Slug")
        if not tenant_slug:
            # Fall back to host-based extraction
            tenant_slug = self.extract_tenant_slug(request.headers.get("host"))
        
        if not tenant_slug:
            # For development, allow requests without tenant resolution
            # In production, this would be more strict
            return await call_next(request)
        
        # Validate tenant and add to request state
        tenant = await self.validate_and_get_tenant(tenant_slug)
        
        if not tenant:
            raise HTTPException(
                status_code=404, 
                detail=f"Tenant '{tenant_slug}' not found or inactive"
            )
        
        # Add tenant context to request
        request.state.tenant = tenant
        request.state.tenant_slug = tenant_slug
        
        return await call_next(request)
    
    def extract_tenant_slug(self, host: Optional[str]) -> Optional[str]:
        """Extract tenant slug from subdomain"""
        if not host:
            return None
        
        # Remove port if present
        host = host.split(':')[0]
        
        # Handle different environments
        if 'flomastr.com' in host:
            # Production: extract subdomain
            parts = host.split('.')
            if len(parts) >= 3 and parts[1] == 'flomastr':
                return parts[0]
        elif 'localhost' in host or 'databutton.com' in host:
            # Development: for now, return a default tenant
            return 'test'
        
        return None
    
    async def validate_and_get_tenant(self, tenant_slug: str) -> Optional[dict]:
        """Validate tenant exists and is active"""
        try:
            database_url = os.getenv("DATABASE_URL_DEV")
            conn = await asyncpg.connect(database_url)
            
            try:
                row = await conn.fetchrow(
                    "SELECT id, slug, name, n8n_url, status FROM tenants WHERE slug = $1 AND status = 'active'",
                    tenant_slug
                )
                
                if row:
                    return {
                        "id": row['id'],
                        "slug": row['slug'],
                        "name": row['name'],
                        "n8n_url": row['n8n_url'],
                        "status": row['status']
                    }
                return None
            finally:
                await conn.close()
        except Exception:
            # Log error in production
            return None

def get_current_tenant(request: Request) -> Optional[dict]:
    """Helper function to get current tenant from request state"""
    return getattr(request.state, 'tenant', None)

def require_tenant(request: Request) -> dict:
    """Helper function that requires a tenant to be present"""
    tenant = get_current_tenant(request)
    if not tenant:
        raise HTTPException(
            status_code=400,
            detail="Tenant context required but not found"
        )
    return tenant
