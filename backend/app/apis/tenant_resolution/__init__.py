


from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.libs.models import TenantResolutionRequest
from app.libs.db_connection import get_db_connection
import asyncpg
import os

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
    print(f"DEBUG: Resolving tenant for email: {email}")
    
    if not email:
        print("DEBUG: No email provided")
        raise HTTPException(status_code=400, detail="Email is required")
    
    # Check if the user is a super admin
    super_admin_emails_str = os.getenv("SUPER_ADMIN_EMAILS")
    print(f"DEBUG: Super admin emails from env: {super_admin_emails_str}")
    
    if super_admin_emails_str:
        super_admin_emails = [e.strip() for e in super_admin_emails_str.split(',') if e.strip()]
        print(f"DEBUG: Parsed super admin emails: {super_admin_emails}")

        if email.lower() in [e.lower() for e in super_admin_emails]:
            print(f"DEBUG: User {email} is super admin")
            # For super admins, return a response that bypasses tenant routing
            # The frontend should route directly to admin dashboard without tenant context
            return TenantResolutionResponse(
                tenant_slug=None,  # No tenant slug for super admins
                tenant_name="Super Admin",
                is_super_admin=True,
                found=True
            )
    
    print("DEBUG: User is not super admin, checking database...")
    
    try:
        conn = await get_db_connection()
        print("DEBUG: Database connection established")
        
        # First check if email matches a tenant's primary contact email
        tenant_row = await conn.fetchrow(
            "SELECT slug, name FROM tenants WHERE primary_contact_email = $1 AND deleted_at IS NULL",
            email.lower()
        )
        
        print(f"DEBUG: Primary contact email check result: {tenant_row}")
        
        if tenant_row:
            print(f"DEBUG: Found tenant by primary contact: {tenant_row}")
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
        
        print(f"DEBUG: User role check result: {user_role}")
        
        if user_role:
            print(f"DEBUG: User has role: {user_role}")
            # For users with roles, try to match by email domain to tenant
            email_domain = email.lower().split('@')[1]
            print(f"DEBUG: Email domain: {email_domain}")
            
            # Special handling for whappstream.com domain
            if email_domain == 'whappstream.com':
                print("DEBUG: Checking for whappstream tenant...")
                whapp_tenant = await conn.fetchrow(
                    "SELECT slug, name FROM tenants WHERE slug = 'whappstream' AND deleted_at IS NULL"
                )
                print(f"DEBUG: WhappStream tenant lookup result: {whapp_tenant}")
                
                if whapp_tenant:
                    print(f"DEBUG: Found whappstream tenant: {whapp_tenant}")
                    return TenantResolutionResponse(
                        tenant_slug=whapp_tenant['slug'],
                        tenant_name=whapp_tenant['name'],
                        is_super_admin=False,
                        found=True
                    )
        
        # TEMPORARY FALLBACK: For testing, return whappstream tenant for whappstream.com emails
        if email_domain == 'whappstream.com':
            print("DEBUG: Using fallback for whappstream.com domain")
            return TenantResolutionResponse(
                tenant_slug="whappstream",
                tenant_name="WhappStream",
                is_super_admin=False,
                found=True
            )
        
        print("DEBUG: No tenant found, returning not found")
        return TenantResolutionResponse(found=False)
        
    except Exception as e:
        print(f"DEBUG: Error in resolve_tenant: {e}")
        import traceback
        traceback.print_exc()
        
        # TEMPORARY FALLBACK: If database fails, return whappstream for testing
        if email.lower().endswith('@whappstream.com'):
            print("DEBUG: Database error, using fallback for whappstream.com")
            return TenantResolutionResponse(
                tenant_slug="whappstream",
                tenant_name="WhappStream",
                is_super_admin=False,
                found=True
            )
        
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        if 'conn' in locals():
            await conn.close()
            print("DEBUG: Database connection closed")

@router.post("/resolve-tenant")
async def resolve_tenant_by_email(request: TenantResolutionRequest) -> TenantResolutionResponse:
    """
    Resolve tenant by user email address (POST version).
    This endpoint is unprotected to allow tenant resolution before authentication.
    """
    return await resolve_tenant(request.identifier)
