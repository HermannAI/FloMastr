


from fastapi import APIRouter, HTTPException, Header, UploadFile, File, status, Depends, Request
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from enum import Enum
import json
import hashlib
import asyncpg
from app.auth import AuthorizedUser
from app.auth.super_admin_bypass import get_admin_user_or_bypass, AdminUserOrBypass
from app.libs.models import Tenant, TenantUpdate, TenantCreate, TenantPolicies, WebChatSession, WebChatSessionCreate
from app.libs.auth_utils import is_super_admin, get_normalized_user_context
from app.libs.db_connection import get_db_connection

router = APIRouter()

def generate_session_key(tenant_id: str, workflow_id: str, user_id: str) -> str:
    """Generate a unique session key for webchat"""
    combined = f"{tenant_id}_{workflow_id}_{user_id}"
    return hashlib.sha256(combined.encode()).hexdigest()

def normalize_slug(slug: str) -> str:
    """Normalize slug by making it lowercase and replacing spaces with hyphens"""
    return slug.lower().replace(" ", "-").replace("_", "-")

def row_to_tenant(row) -> Tenant:
    """Convert database row to Tenant model"""
    # Parse branding_settings from JSON string if it's a string
    branding_settings = row.get('branding_settings')
    if isinstance(branding_settings, str):
        try:
            branding_settings = json.loads(branding_settings) if branding_settings else {}
        except json.JSONDecodeError:
            branding_settings = {}
    elif branding_settings is None:
        branding_settings = {}
    
    return Tenant(
        id=row['id'],
        slug=row['slug'],
        name=row['name'],
        n8n_url=row.get('n8n_url'),
        status=row['status'],
        created_at=row['created_at'],
        updated_at=row['updated_at'],
        branding_settings=branding_settings,
        confidence_threshold=row.get('confidence_threshold'),
        hot_ttl_days=row.get('hot_ttl_days'),
        inbox_scope=row.get('inbox_scope'),
        catalog_enabled=row.get('catalog_enabled'),
        cold_db_ref=row.get('cold_db_ref'),
        deleted_at=row.get('deleted_at'),
        company_name=row.get('company_name'),
        industry=row.get('industry'),
        company_address=row.get('company_address'),
        website_url=row.get('website_url'),
        company_size=row.get('company_size'),
        time_zone=row.get('time_zone'),
        primary_contact_name=row.get('primary_contact_name'),
        primary_contact_title=row.get('primary_contact_title'),
        primary_contact_email=row.get('primary_contact_email'),
        primary_contact_phone=row.get('primary_contact_phone'),
        primary_contact_whatsapp=row.get('primary_contact_whatsapp'),
        billing_contact_name=row.get('billing_contact_name'),
        billing_contact_email=row.get('billing_contact_email'),
        technical_contact_name=row.get('technical_contact_name'),
        technical_contact_email=row.get('technical_contact_email'),
        custom_domain=row.get('custom_domain')
    )

class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"

class TenantResolutionResponse(BaseModel):
    tenant_slug: Optional[str] = None
    tenant_name: Optional[str] = None
    found: bool = False

@router.get("/tenants-test")
async def test_tenants_auth(request: Request):
    """Test endpoint to verify super admin authentication"""
    
    email = (request.query_params.get('email') or 
            request.query_params.get('user_email') or
            request.headers.get('X-User-Email') or 
            request.headers.get('x-user-email') or
            request.headers.get('user-email') or 
            request.headers.get('email'))
    
    print(f"🔍 TEST: Checking email: {email}")
    
    if email:
        from app.libs.auth_utils import is_super_admin_email_simple
        is_admin = is_super_admin_email_simple(email.strip())
        print(f"🔍 TEST: Super admin check result: {is_admin}")
        return {"email": email, "is_super_admin": is_admin, "status": "test_success"}
    else:
        return {"email": None, "is_super_admin": False, "status": "no_email_found"}

@router.get("/tenants")
async def list_tenants(request: Request, skip: int = 0, limit: int = 100) -> List[Tenant]:
    """List all tenants (admin only in production)"""
    
    # SIMPLIFIED SUPER ADMIN CHECK
    email = (request.query_params.get('email') or 
            request.query_params.get('user_email') or
            request.headers.get('X-User-Email') or 
            request.headers.get('x-user-email') or
            request.headers.get('user-email') or 
            request.headers.get('email'))
    
    print(f"🔍 TENANTS: Checking email: {email}")
    
    if email:
        from app.libs.auth_utils import is_super_admin_email_simple
        if is_super_admin_email_simple(email.strip()):
            print(f"✅ TENANTS: Super admin access granted for {email}")
        else:
            print(f"❌ TENANTS: Email {email} is not a super admin")
            raise HTTPException(status_code=403, detail="Super admin access required")
    else:
        # Fall back to original dependency for regular users
        print("🔍 TENANTS: No email found, checking regular auth")
        user = await get_admin_user_or_bypass(request)
    
    conn = await get_db_connection()
    try:
        rows = await conn.fetch(
            """
            SELECT id, slug, name, n8n_url, status, created_at, updated_at,
                   branding_settings, confidence_threshold, hot_ttl_days,
                   inbox_scope, catalog_enabled, cold_db_ref, deleted_at,
                   company_name, industry, company_address, website_url, company_size, time_zone,
                   primary_contact_name, primary_contact_title, primary_contact_email,
                   primary_contact_phone, primary_contact_whatsapp,
                   billing_contact_name, billing_contact_email,
                   technical_contact_name, technical_contact_email,
                   custom_domain
            FROM tenants
            ORDER BY created_at DESC LIMIT $1 OFFSET $2
            """,
            limit, skip
        )
        
        return [row_to_tenant(row) for row in rows]
    finally:
        await conn.close()

@router.get("/tenants/{tenant_slug}")
async def get_tenant_by_slug(tenant_slug: str, user: AdminUserOrBypass = Depends(get_admin_user_or_bypass)) -> Tenant:
    """Get tenant by slug"""
    
    conn = await get_db_connection()
    try:
        row = await conn.fetchrow(
            """
            SELECT id, slug, name, n8n_url, status, created_at, updated_at,
                   branding_settings, confidence_threshold, hot_ttl_days,
                   inbox_scope, catalog_enabled, cold_db_ref, deleted_at,
                   company_name, industry, company_address, website_url, company_size, time_zone,
                   primary_contact_name, primary_contact_title, primary_contact_email,
                   primary_contact_phone, primary_contact_whatsapp,
                   billing_contact_name, billing_contact_email,
                   technical_contact_name, technical_contact_email,
                   custom_domain
            FROM tenants WHERE slug = $1
            """,
            tenant_slug
        )
        
        if not row:
            raise HTTPException(status_code=404, detail="Tenant not found")
        
        return row_to_tenant(row)
    finally:
        await conn.close()

@router.post("/tenants")
async def create_tenant(tenant_data: TenantCreate, user: AdminUserOrBypass = Depends(get_admin_user_or_bypass)) -> Tenant:
    """Create a new tenant"""
    
    conn = await get_db_connection()
    slug = normalize_slug(tenant_data.slug)

    try:
        # Check if slug already exists
        existing = await conn.fetchrow(
            "SELECT id FROM tenants WHERE slug = $1",
            slug
        )
        
        if existing:
            raise HTTPException(status_code=400, detail=f"Tenant slug '{slug}' already exists")
        
        # Create new tenant
        row = await conn.fetchrow(
            """
            INSERT INTO tenants (
                slug, name, n8n_url, status, cold_db_ref,
                company_name, industry, company_address, website_url, company_size, time_zone,
                primary_contact_name, primary_contact_title, primary_contact_email, 
                primary_contact_phone, primary_contact_whatsapp,
                billing_contact_name, billing_contact_email,
                technical_contact_name, technical_contact_email,
                custom_domain
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
            RETURNING id, slug, name, n8n_url, status, created_at, updated_at,
                      branding_settings, confidence_threshold, hot_ttl_days,
                      inbox_scope, catalog_enabled, cold_db_ref,
                      company_name, industry, company_address, website_url, company_size, time_zone,
                      primary_contact_name, primary_contact_title, primary_contact_email,
                      primary_contact_phone, primary_contact_whatsapp,
                      billing_contact_name, billing_contact_email,
                      technical_contact_name, technical_contact_email,
                      custom_domain
            """,
            slug,
            tenant_data.name,
            tenant_data.n8n_url,
            tenant_data.status.value,
            tenant_data.cold_db_ref,
            tenant_data.company_name,
            tenant_data.industry,
            tenant_data.company_address,
            tenant_data.website_url,
            tenant_data.company_size,
            tenant_data.time_zone,
            tenant_data.primary_contact_name,
            tenant_data.primary_contact_title,
            tenant_data.primary_contact_email,
            tenant_data.primary_contact_phone,
            tenant_data.primary_contact_whatsapp,
            tenant_data.billing_contact_name,
            tenant_data.billing_contact_email,
            tenant_data.technical_contact_name,
            tenant_data.technical_contact_email,
            tenant_data.custom_domain
        )
        
        return row_to_tenant(row)
    finally:
        await conn.close()

@router.put("/tenants/{tenant_slug}")
async def update_tenant(tenant_slug: str, tenant_data: TenantUpdate, user: AdminUserOrBypass = Depends(get_admin_user_or_bypass)) -> Tenant:
    """Update tenant information"""
    
    conn = await get_db_connection()
    try:
        # Check if tenant exists
        existing = await conn.fetchrow(
            "SELECT id FROM tenants WHERE slug = $1",
            tenant_slug
        )
        
        if not existing:
            raise HTTPException(status_code=404, detail="Tenant not found")
        
        # Build update query dynamically
        update_fields = []
        values = []
        param_count = 1
        
        if tenant_data.slug is not None:
            update_fields.append(f"slug = ${param_count}")
            values.append(normalize_slug(tenant_data.slug))
            param_count += 1
            
        if tenant_data.name is not None:
            update_fields.append(f"name = ${param_count}")
            values.append(tenant_data.name)
            param_count += 1
            
        if tenant_data.n8n_url is not None:
            update_fields.append(f"n8n_url = ${param_count}")
            values.append(tenant_data.n8n_url)
            param_count += 1
            
        if tenant_data.status is not None:
            update_fields.append(f"status = ${param_count}")
            values.append(tenant_data.status.value)
            param_count += 1
            
        if tenant_data.cold_db_ref is not None:
            update_fields.append(f"cold_db_ref = ${param_count}")
            values.append(tenant_data.cold_db_ref)
            param_count += 1
            
        if tenant_data.branding_settings is not None:
            update_fields.append(f"branding_settings = ${param_count}")
            values.append(json.dumps(tenant_data.branding_settings))
            param_count += 1
        
        if not update_fields:
            # No fields to update, just return existing tenant
            return await get_tenant_by_slug(tenant_slug, user)
        
        update_fields.append("updated_at = NOW()")
        values.append(tenant_slug)
        
        query = f"""
        UPDATE tenants SET {', '.join(update_fields)}
        WHERE slug = ${param_count}
        RETURNING id, slug, name, n8n_url, status, created_at, updated_at,
                  branding_settings, confidence_threshold, hot_ttl_days,
                  inbox_scope, catalog_enabled, cold_db_ref
        """
        row = await conn.fetchrow(query, *values)
        
        return row_to_tenant(row)
    finally:
        await conn.close()


@router.put("/tenants/{tenant_slug}/policies")
async def update_tenant_policies(
    tenant_slug: str,
    policies: TenantPolicies,
    user: AdminUserOrBypass = Depends(get_admin_user_or_bypass)
) -> Tenant:
    """Update tenant policy flags (Super-Admin only)"""
    if not is_super_admin(user):
        raise HTTPException(status_code=403, detail="Forbidden: Requires Super-Admin access")

    conn = await get_db_connection()
    try:
        update_data = policies.model_dump(exclude_unset=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No policy data provided to update.")

        fields, values = [], []
        for i, (key, value) in enumerate(update_data.items()):
            fields.append(f"{key} = ${i+1}")
            values.append(value)
        
        values.append(tenant_slug)
        
        query = f"""
            UPDATE tenants
            SET {', '.join(fields)}
            WHERE slug = ${len(values)}
            RETURNING id, slug, name, n8n_url, status, created_at, updated_at,
                      branding_settings, confidence_threshold, hot_ttl_days,
                      inbox_scope, catalog_enabled, cold_db_ref
        """
        
        row = await conn.fetchrow(query, *values)
        
        if not row:
            raise HTTPException(status_code=404, detail="Tenant not found")
            
        return row_to_tenant(row)
    except asyncpg.exceptions.UniqueViolationError as e:
        raise HTTPException(status_code=400, detail=f"Database error: {e}")
    finally:
        await conn.close()


@router.delete("/tenants/{tenant_slug}")
async def delete_tenant(tenant_slug: str, user: AdminUserOrBypass = Depends(get_admin_user_or_bypass)) -> dict:
    """
    Delete tenant (super admin only)
    """
    if not is_super_admin(user):
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    conn = await get_db_connection()
    try:
        # Soft delete by setting deleted_at timestamp
        await conn.execute(
            "UPDATE tenants SET deleted_at = $1 WHERE slug = $2",
            datetime.utcnow(), tenant_slug
        )
        return {"message": "Tenant deleted successfully"}
    except Exception as e:
        print(f"Error deleting tenant: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete tenant")
    finally:
        await conn.close()

@router.get("/check-super-admin")
async def check_super_admin(
    user: AdminUserOrBypass = Depends(get_admin_user_or_bypass)
) -> dict:
    """Check if current user is super admin (debugging endpoint)"""
    
    # Get normalized user context for detailed information
    normalized_context = get_normalized_user_context(user)
    
    return {
        "is_super_admin": normalized_context["is_super_admin"],
        "user_email": None,  # Email not available in JWT tokens
        "user_id": normalized_context["original_user_id"],
        "normalized_user_id": normalized_context["user_id"],
        "is_normalized": normalized_context["is_normalized"],
        "auth_mode": normalized_context["auth_mode"]
    }

@router.post("/webchat/sessions")
async def create_webchat_session(
    session_data: WebChatSessionCreate,
    user: AdminUserOrBypass = Depends(get_admin_user_or_bypass),
    host: Optional[str] = Header(None)
) -> WebChatSession:
    """Create a new webchat session"""
    
    # Generate session key
    session_key = generate_session_key(
        session_data.tenant_id,
        session_data.workflow_id,
        session_data.user_id
    )
    
    conn = await get_db_connection()
    try:
        # Check if session already exists
        existing = await conn.fetchrow(
            "SELECT id FROM webchat_sessions WHERE session_key = $1",
            session_key
        )
        
        if existing:
            # Return existing session
            row = await conn.fetchrow(
                "SELECT id, session_key, tenant_id, workflow_id, user_id, messages, created_at, updated_at FROM webchat_sessions WHERE session_key = $1",
                session_key
            )
        else:
            # Create new session
            row = await conn.fetchrow(
                "INSERT INTO webchat_sessions (session_key, tenant_id, workflow_id, user_id, messages) VALUES ($1, $2, $3, $4, $5) RETURNING id, session_key, tenant_id, workflow_id, user_id, messages, created_at, updated_at",
                session_key,
                session_data.tenant_id,
                session_data.workflow_id,
                session_data.user_id,
                session_data.messages
            )
        
        return WebChatSession(
            id=row['id'],
            session_key=row['session_key'],
            tenant_id=row['tenant_id'],
            workflow_id=row['workflow_id'],
            user_id=row['user_id'],
            messages=row['messages'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
    finally:
        await conn.close()

@router.get("/webchat/sessions/{session_key}")
async def get_webchat_session(session_key: str, user: AdminUserOrBypass = Depends(get_admin_user_or_bypass)) -> WebChatSession:
    """Get webchat session by key"""
    
    conn = await get_db_connection()
    try:
        row = await conn.fetchrow(
            "SELECT id, session_key, tenant_id, workflow_id, user_id, messages, created_at, updated_at FROM webchat_sessions WHERE session_key = $1",
            session_key
        )
        
        if not row:
            raise HTTPException(status_code=404, detail="Webchat session not found")
        
        return WebChatSession(
            id=row['id'],
            session_key=row['session_key'],
            tenant_id=row['tenant_id'],
            workflow_id=row['workflow_id'],
            user_id=row['user_id'],
            messages=row['messages'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
    finally:
        await conn.close()
