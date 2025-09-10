
from fastapi import HTTPException, Depends, Request
from typing import Optional
import asyncpg
from app.auth import AuthorizedUser
import re
# Import centralized database connection
from app.libs.db_connection import get_db_connection

class TenantAuthorizedUser:
    """
    Enhanced AuthorizedUser that includes validated tenant membership.
    This ensures the user has access to the tenant specified in the URL.
    """
    def __init__(self, user: AuthorizedUser, tenant_slug: str, tenant_id: int, membership_role: str):
        # Copy all attributes from AuthorizedUser
        for attr in dir(user):
            if not attr.startswith('_'):
                setattr(self, attr, getattr(user, attr))
        
        # Add tenant-specific attributes
        self.tenant_slug = tenant_slug
        self.tenant_id = tenant_id
        self.membership_role = membership_role
        self.is_tenant_owner = membership_role == 'owner'
        self.is_tenant_admin = membership_role in ['owner', 'admin']

async def extract_tenant_slug_from_path(request: Request) -> Optional[str]:
    """
    Extract tenant_slug from URL path patterns like:
    - /tenants/{tenant_slug}/...
    - /api/tenants/{tenant_slug}/...
    """
    path = request.url.path
    
    # Pattern 1: /tenants/{tenant_slug}/... or /api/tenants/{tenant_slug}/...
    match = re.search(r'/(?:api/)?tenants/([^/]+)', path)
    if match:
        return match.group(1)
    
    # Pattern 2: Look for tenant_slug in query parameters as fallback
    tenant_slug = request.query_params.get('tenant_slug')
    if tenant_slug:
        return tenant_slug
        
    return None

async def validate_tenant_membership(user_id: str, tenant_slug: str) -> Optional[dict]:
    """
    Validate that a user has active membership in the specified tenant.
    Returns membership info if valid, None if not.
    """
    conn = await get_db_connection()
    try:
        # Query to check if user has active membership in the tenant
        query = """
            SELECT 
                tm.tenant_id,
                tm.tenant_slug,
                tm.role,
                tm.status,
                t.status as tenant_status
            FROM tenant_memberships tm
            JOIN tenants t ON tm.tenant_id = t.id
            WHERE tm.user_id = $1 
            AND tm.tenant_slug = $2 
            AND tm.status = 'active'
            AND t.status = 'active'
        """
        
        row = await conn.fetchrow(query, user_id, tenant_slug)
        
        if row:
            return {
                'tenant_id': row['tenant_id'],
                'tenant_slug': row['tenant_slug'],
                'role': row['role'],
                'status': row['status'],
                'tenant_status': row['tenant_status']
            }
        
        return None
        
    finally:
        await conn.close()

async def require_tenant_membership(
    request: Request,
    user: AuthorizedUser
) -> TenantAuthorizedUser:
    """
    FastAPI dependency that validates tenant membership.
    
    This is the main security dependency that:
    1. Extracts user_id from the authenticated user token
    2. Extracts tenant_slug from the URL path
    3. Validates that the user has active membership in that tenant
    4. Returns 403 Forbidden if validation fails
    
    Usage in API endpoints:
    @router.get("/tenants/{tenant_slug}/some-data")
    async def get_tenant_data(tenant_user: TenantAuthorizedUser = Depends(require_tenant_membership)):
        # tenant_user.tenant_slug is guaranteed to be accessible by this user
        # tenant_user has all AuthorizedUser attributes plus tenant-specific ones
        pass
    """
    
    # Extract tenant_slug from URL path
    tenant_slug = await extract_tenant_slug_from_path(request)
    
    if not tenant_slug:
        raise HTTPException(
            status_code=400, 
            detail="Tenant slug not found in request path"
        )
    
    # Get user ID from AuthorizedUser
    user_id = getattr(user, 'sub', None) or getattr(user, 'id', None)
    
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="User ID not found in authentication token"
        )
    
    # Validate tenant membership
    membership = await validate_tenant_membership(user_id, tenant_slug)
    
    if not membership:
        # AB-1 FIX: Return 403 Forbidden if user is not a member of the tenant
        raise HTTPException(
            status_code=403,
            detail=f"Access denied: User does not have membership in tenant '{tenant_slug}'"
        )
    
    # Return enhanced user object with tenant information
    return TenantAuthorizedUser(
        user=user,
        tenant_slug=membership['tenant_slug'],
        tenant_id=membership['tenant_id'],
        membership_role=membership['role']
    )

# Alias for easier imports
TenantUser = require_tenant_membership

# Create a proper dependency instance to avoid B008 linting error
TenantUserDep = Depends(require_tenant_membership)
