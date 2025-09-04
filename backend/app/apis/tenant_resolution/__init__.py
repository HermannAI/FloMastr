


from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.libs.models import TenantResolutionRequest
from app.libs.db_connection import get_db_connection
import asyncpg
import databutton as db

router = APIRouter()

class TenantResolutionResponse(BaseModel):
    tenant_slug: Optional[str] = None
    tenant_name: Optional[str] = None
    is_super_admin: bool = False
    found: bool = False

@router.get("/resolve-tenant")
async def resolve_tenant(email: str) -> TenantResolutionResponse:
    """
    Resolve tenant by user email address.
    This endpoint is unprotected to allow tenant resolution before authentication.
    """
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    # Check if the user is a super admin
    super_admin_emails_str = db.secrets.get("SUPER_ADMIN_EMAILS")
    if super_admin_emails_str:
        super_admin_emails = [e.strip() for e in super_admin_emails_str.split(',') if e.strip()]
        
        if email.lower() in [e.lower() for e in super_admin_emails]:
            # For super admins, return a response that bypasses tenant routing
            # The frontend should route directly to admin dashboard without tenant context
            return TenantResolutionResponse(
                tenant_slug=None,  # No tenant slug for super admins
                tenant_name="Super Admin",
                is_super_admin=True,
                found=True
            )
    
    conn = await get_db_connection()
    try:
        # First check if email matches a tenant's primary contact email
        tenant_row = await conn.fetchrow(
            "SELECT slug, name FROM tenants WHERE primary_contact_email = $1 AND deleted_at IS NULL",
            email.lower()
        )
        
        if tenant_row:
            return TenantResolutionResponse(
                tenant_slug=tenant_row['slug'],
                tenant_name=tenant_row['name'],
                found=True
            )
        
        # Check if user has any role assigned (fallback for admin users)
        user_role = await conn.fetchrow(
            "SELECT role FROM user_roles WHERE email = $1",
            email.lower()
        )
        
        if user_role:
            # For users with roles, try to match by email domain to tenant
            email_domain = email.lower().split('@')[1]
            
            # Special handling for whappstream.com domain
            if email_domain == 'whappstream.com':
                whapp_tenant = await conn.fetchrow(
                    "SELECT slug, name FROM tenants WHERE slug = 'whappstream' AND deleted_at IS NULL"
                )
                if whapp_tenant:
                    return TenantResolutionResponse(
                        tenant_slug=whapp_tenant['slug'],
                        tenant_name=whapp_tenant['name'],
                        is_super_admin=False,
                        found=True
                    )
        
        return TenantResolutionResponse(found=False)
        
    except Exception as e:
        print(f"Error in resolve_tenant: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        await conn.close()

@router.post("/resolve-tenant")
async def resolve_tenant_by_email(request: TenantResolutionRequest) -> TenantResolutionResponse:
    """
    Resolve tenant by user email address (POST version).
    This endpoint is unprotected to allow tenant resolution before authentication.
    """
    return await resolve_tenant(request.identifier)
