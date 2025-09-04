

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, validator
from typing import Optional
import asyncpg
import databutton as db
from app.auth import AuthorizedUser
from app.libs.auth_utils import is_super_admin
from datetime import datetime
import uuid
import re
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
    tenant_id: int
    tenant_slug: str
    owner_user_id: str
    owner_email: str
    membership_id: str  # Changed from int to str to handle UUID values
    message: str

class TenantProvisionError(BaseModel):
    error: str
    details: Optional[str] = None

def check_super_admin_access(user: AuthorizedUser):
    """Check if user has super admin access"""
    if not user.sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    if not is_super_admin(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required for tenant provisioning"
        )
    return user

@router.post("/api/v1/admin/tenants/provision", response_model=TenantProvisionResponse)
async def provision_tenant(
    request: TenantProvisionRequest,
    user: AuthorizedUser
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
    check_super_admin_access(user)
    
    # Use tenant_slug as tenant_name if not provided
    tenant_name = request.tenant_name or request.tenant_slug.replace('-', ' ').replace('_', ' ').title()
    
    conn = None
    try:
        conn = await get_db_connection()
        if not conn:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to connect to database"
            )
        
        # Start transaction
        async with conn.transaction():
            # 1. Check if tenant slug already exists
            try:
                existing_tenant = await conn.fetchrow(
                    "SELECT id, slug FROM tenants WHERE slug = $1",
                    request.tenant_slug
                )
            except Exception as e:
                print(f"Database error checking existing tenant: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Database error during tenant validation"
                )
            
            if existing_tenant:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Tenant with slug '{request.tenant_slug}' already exists"
                )
            
            # 2. Check if user email already exists
            try:
                existing_user = await conn.fetchrow(
                    "SELECT id, email FROM user_roles WHERE email = $1",
                    request.owner_email
                )
            except Exception as e:
                print(f"Database error checking existing user: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Database error during user validation"
                )
            
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"User with email '{request.owner_email}' already exists"
                )
            
            # 3. Create the tenant
            try:
                tenant_row = await conn.fetchrow(
                    """
                    INSERT INTO tenants (
                        slug, name, status, n8n_url, branding_settings, 
                        confidence_threshold, hot_ttl_days, inbox_scope, catalog_enabled,
                        created_at, updated_at
                    ) VALUES (
                        $1, $2, 'active', $3, '{}',
                        0.75, 30, 'databutton', false,
                        NOW(), NOW()
                    ) RETURNING id, slug, name, created_at
                    """,
                    request.tenant_slug,
                    tenant_name,
                    request.n8n_url
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
            
            tenant_id = tenant_row['id']
            
            # 4. Generate a unique user ID
            user_id = str(uuid.uuid4())
            
            # 5. Create the user with 'user' role (owner role will be in tenant_memberships)
            try:
                user_row = await conn.fetchrow(
                    """
                    INSERT INTO user_roles (
                        id, email, role, assigned_by, assigned_at, created_at, updated_at
                    ) VALUES (
                        $1, $2, 'user', $3, NOW(), NOW(), NOW()
                    ) RETURNING id, email, role, created_at
                    """,
                    user_id,
                    request.owner_email,
                    user.sub  # The super admin who is creating this user
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
                    user_id,
                    request.tenant_slug
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
            
            membership_id = membership_row['id']
            
            print(f"SUCCESS: Provisioned tenant '{request.tenant_slug}' (ID: {tenant_id}) with owner '{request.owner_email}' (ID: {user_id})")
            
            # Ensure all values are properly converted to expected types
            return TenantProvisionResponse(
                success=True,
                tenant_id=int(tenant_id),  # Ensure it's an integer
                tenant_slug=str(request.tenant_slug),  # Ensure it's a string
                owner_user_id=str(user_id),  # Ensure it's a string
                owner_email=str(request.owner_email),  # Ensure it's a string
                membership_id=str(membership_id),  # Convert UUID to string
                message=f"Successfully provisioned tenant '{request.tenant_slug}' with owner '{request.owner_email}'"
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
        print(f"ERROR: Failed to provision tenant '{request.tenant_slug}': {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to provision tenant: {str(e)}"
        ) from e
    finally:
        if conn:
            await conn.close()
