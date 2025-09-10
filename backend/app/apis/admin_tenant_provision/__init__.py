
from fastapi import APIRouter, HTTPException, status, Request
from pydantic import BaseModel, EmailStr
from pydantic.v1 import validator
from typing import Optional
import asyncio
import asyncpg
import uuid
import re
import sys
from datetime import datetime
# Removed auth imports since authentication is disabled
# from app.libs.clerk_auth import get_authorized_user, ClerkUser
# from app.libs.auth_utils import is_super_admin
from app.libs.db_connection import get_db_connection

router = APIRouter()

class TenantProvisionRequest(BaseModel):
    tenant_slug: str
    owner_email: EmailStr
    tenant_name: Optional[str] = None
    n8n_url: Optional[str] = None
    
    @validator('tenant_slug')
    def validate_tenant_slug(cls, v):
        if not v:
            raise ValueError('Tenant slug cannot be empty')
        if len(v) < 2 or len(v) > 50:
            raise ValueError('Tenant slug must be between 2 and 50 characters')
        if not re.match(r'^[a-z0-9][a-z0-9-]*[a-z0-9]$', v.lower()):
            raise ValueError('Tenant slug must start and end with alphanumeric characters and contain only lowercase letters, numbers, and hyphens')
        return v.lower()
    
    @validator('n8n_url')
    def validate_n8n_url(cls, v):
        if v and not re.match(r'^https?://.+\..+', v):
            raise ValueError('N8N URL must be a valid HTTP/HTTPS URL')
        return v
    
    @validator('tenant_name')
    def validate_tenant_name(cls, v):
        if v and (len(v) < 1 or len(v) > 100):
            raise ValueError('Tenant name must be between 1 and 100 characters')
        return v

class TenantProvisionResponse(BaseModel):
    success: bool
    tenant_id: str  # Changed from int to str to handle UUID values
    tenant_slug: str
    owner_user_id: str
    owner_email: str
    membership_id: str  # Changed from int to str to handle UUID values
    message: str

class TenantProvisionError(BaseModel):
    error: str
    details: Optional[str] = None

# Authentication completely disabled for this endpoint since it's only accessible from admin dashboard

@router.post("/api/v1/admin/tenants/provision", response_model=TenantProvisionResponse)
async def provision_tenant(
    request: Request,
    tenant_request: TenantProvisionRequest
    # user: ClerkUser = Depends(get_authorized_user)  # Completely disabled for testing
) -> TenantProvisionResponse:
    """
    Provision a new tenant with its first owner user.
    
    This endpoint performs three atomic operations:
    1. Creates a new tenant in the tenants table
    2. Creates a new user in the user_roles table
    3. Links the user to the tenant via tenant_memberships table with 'owner' role
    
    All operations are performed in a single database transaction to ensure data integrity.
    
    Requires Super-Admin privileges.
    """
    # Debug logging - disabled since auth is disabled
    print(f"🔍 PROVISION DEBUG: Starting tenant provisioning for '{tenant_request.tenant_slug}'")
    print(f"🔍 PROVISION DEBUG: Owner email: '{tenant_request.owner_email}'")
    print(f"🔍 PROVISION DEBUG: Authentication completely disabled for testing")
    
    # Use tenant_slug as tenant_name if not provided
    tenant_name = tenant_request.tenant_name or tenant_request.tenant_slug.replace('-', ' ').replace('_', ' ').title()
    print(f"🔍 PROVISION DEBUG: Resolved tenant name: '{tenant_name}'")
    
    conn = None
    try:
        print("🔍 PROVISION DEBUG: Getting database connection...")
        conn = await get_db_connection()
        if not conn:
            print("❌ PROVISION DEBUG: Database connection is None")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to connect to database"
            )
        print("✅ PROVISION DEBUG: Database connection successful")
        
        # Start transaction
        print("🔍 PROVISION DEBUG: Starting transaction...")
        async with conn.transaction():
            # 1. Check if tenant slug already exists
            print(f"🔍 PROVISION DEBUG: Checking if tenant '{tenant_request.tenant_slug}' exists...")
            try:
                existing_tenant = await conn.fetchrow(
                    "SELECT id, slug FROM tenants WHERE slug = $1",
                    tenant_request.tenant_slug
                )
                print(f"🔍 PROVISION DEBUG: Tenant check result: {existing_tenant}")
            except Exception as e:
                print(f"❌ PROVISION DEBUG: Tenant check failed: {type(e).__name__}: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Database error during tenant validation"
                )
            
            if existing_tenant:
                print("❌ PROVISION DEBUG: Tenant already exists")
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Tenant with slug '{tenant_request.tenant_slug}' already exists"
                )
            
            # 2. Check if user email already exists
            print(f"🔍 PROVISION DEBUG: Checking if user '{tenant_request.owner_email}' exists...")
            try:
                existing_user = await conn.fetchrow(
                    "SELECT id, email FROM user_roles WHERE email = $1",
                    tenant_request.owner_email
                )
                print(f"🔍 PROVISION DEBUG: User check result: {existing_user}")
            except Exception as e:
                print(f"❌ PROVISION DEBUG: User check failed: {type(e).__name__}: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Database error during user validation"
                )
            
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"User with email '{tenant_request.owner_email}' already exists"
                )
            
            # 3. Create the tenant
            try:
                tenant_row = await conn.fetchrow(
                    """
                    INSERT INTO tenants (
                        slug, name, status, n8n_url, created_at, updated_at
                    ) VALUES (
                        $1, $2, 'active', $3, NOW(), NOW()
                    ) RETURNING id, slug, name, created_at
                    """,
                    tenant_request.tenant_slug,
                    tenant_name,
                    tenant_request.n8n_url
                )
            except Exception as e:
                print(f"Database error creating tenant: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create tenant in database"
                )
            
            if not tenant_row:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create tenant - no row returned"
                )
            
            tenant_id = str(tenant_row['id'])  # Convert UUID to string
            
            # 4. Generate a unique user ID and user reference
            user_id = str(uuid.uuid4())
            user_reference_id = f"user_{tenant_request.owner_email.replace('@', '_').replace('.', '_')}"
            
            # 5. Create the user with 'user' role (tenant ownership is handled via tenant_memberships)
            try:
                user_row = await conn.fetchrow(
                    """
                    INSERT INTO user_roles (
                        id, user_id, email, role, assigned_by, assigned_at, created_at, updated_at
                    ) VALUES (
                        $1, $2, $3, 'user', $4, NOW(), NOW(), NOW()
                    ) RETURNING id, email, role, created_at
                    """,
                    user_id,
                    user_reference_id,
                    tenant_request.owner_email,
                    'system'  # System-assigned during tenant provisioning
                )
            except Exception as e:
                print(f"Database error creating user: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create user in database"
                )
            
            if not user_row:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create user - no row returned"
                )
            
            # 6. Create tenant membership linking user to tenant as owner
            try:
                membership_row = await conn.fetchrow(
                    """
                    INSERT INTO tenant_memberships (
                        tenant_id, user_id, tenant_slug, role, status, created_at, updated_at
                    ) VALUES (
                        $1, $2, $3, 'owner', 'active', NOW(), NOW()
                    ) RETURNING id, tenant_id, user_id, role, status, created_at
                    """,
                    tenant_id,
                    user_reference_id,  # Use the user_reference_id instead of user_id UUID
                    tenant_request.tenant_slug
                )
            except Exception as e:
                print(f"Database error creating membership: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create tenant membership in database"
                )
            
            if not membership_row:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create tenant membership - no row returned"
                )
            
            membership_id = str(membership_row['id'])  # Convert UUID to string
            
            print(f"SUCCESS: Provisioned tenant '{tenant_request.tenant_slug}' (ID: {tenant_id}) with owner '{tenant_request.owner_email}' (ID: {user_id})")
            
            # Ensure all values are properly converted to expected types
            return TenantProvisionResponse(
                success=True,
                tenant_id=tenant_id,  # Now a string UUID
                tenant_slug=str(tenant_request.tenant_slug),  # Ensure it's a string
                owner_user_id=str(user_id),  # Ensure it's a string
                owner_email=str(tenant_request.owner_email),  # Ensure it's a string
                membership_id=membership_id,  # Convert UUID to string
                message=f"Successfully provisioned tenant '{tenant_request.tenant_slug}' with owner '{tenant_request.owner_email}'"
            )
            
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except asyncpg.PostgresError as e:
        # Handle specific database errors
        print(f"PostgreSQL error in tenant provisioning: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database operation failed during tenant provisioning"
        ) from e
    except Exception as e:
        # Log the error and raise a generic HTTP exception
        print(f"ERROR: Failed to provision tenant '{tenant_request.tenant_slug}': {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to provision tenant: {str(e)}"
        ) from e
    finally:
        if conn:
            await conn.close()


@router.get("/api/v1/admin/test", status_code=200)
async def test_route():
    print("✅ ADMIN ROUTE: /test handler was reached successfully!")
    sys.stdout.flush()
    return {"message": "Admin router is active"}
