

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from typing import Optional, Union
from enum import Enum
import asyncpg
from app.auth import AuthorizedUser
from app.libs.tenant_auth import TenantAuthorizedUser, TenantUserDep
from app.libs.models import Tenant, TenantUpdate, Industry, CompanySize
# Import centralized database connection
from app.libs.db_connection import get_db_connection

# Try to import file handling dependencies, make them optional
try:
    from fastapi import UploadFile, File
    MULTIPART_AVAILABLE = True
except ImportError:
    MULTIPART_AVAILABLE = False
    UploadFile = None
    File = None

router = APIRouter()

class BrandingSettings(BaseModel):
    tenant_id: str
    logo_svg: Optional[str] = None
    brand_primary: str = Field(default="#0052cc", pattern=r"^#[0-9A-Fa-f]{6}$")
    
    # Validation removed temporarily due to pydantic version compatibility
    # @model_validator(mode='after')
    # def validate_logo_svg(self):
    #     if self.logo_svg is not None:
    #         # Check if it's valid SVG content
    #         if not self.logo_svg.strip().startswith('<svg') or not self.logo_svg.strip().endswith('</svg>'):
    #             raise ValueError('Invalid SVG format')
    #         # Check size limit (200KB)
    #         if len(self.logo_svg.encode('utf-8')) > 200 * 1024:
    #             raise ValueError('SVG file too large (max 200KB)')
    #     return self

class TenantProfileRequest(BaseModel):
    """Request model for updating tenant profile including branding"""
    # Branding fields
    brand_primary: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    logo_svg: Optional[str] = None
    
    # Company Information
    company_name: Optional[str] = Field(None, max_length=255)
    industry: Optional[Union[Industry, str]] = Field(None, max_length=100)  # Allow enum or custom string
    company_address: Optional[str] = None
    website_url: Optional[str] = Field(None, max_length=255)
    company_size: Optional[CompanySize] = None
    time_zone: Optional[str] = Field(None, max_length=100)
    
    # Primary Contact
    primary_contact_name: Optional[str] = Field(None, max_length=255)
    primary_contact_title: Optional[str] = Field(None, max_length=255)
    primary_contact_email: Optional[str] = Field(None, max_length=255)
    primary_contact_phone: Optional[str] = Field(None, max_length=50)
    primary_contact_whatsapp: Optional[str] = Field(None, max_length=50)
    
    # Additional Contacts
    billing_contact_name: Optional[str] = Field(None, max_length=255)
    billing_contact_email: Optional[str] = Field(None, max_length=255)
    technical_contact_name: Optional[str] = Field(None, max_length=255)
    technical_contact_email: Optional[str] = Field(None, max_length=255)
    
    # Platform Configuration
    custom_domain: Optional[str] = Field(None, max_length=255)
    cold_db_ref: Optional[str] = Field(None, max_length=255)
    
    # Validation removed temporarily due to pydantic version compatibility
    # @model_validator(mode='after')
    # def validate_fields(self):
    #     # Validate logo_svg
    #     if self.logo_svg is not None:
    #         if not self.logo_svg.strip().startswith('<svg') or not self.logo_svg.strip().endswith('</svg>'):
    #             raise ValueError('Invalid SVG format')
    #         if len(self.logo_svg.encode('utf-8')) > 200 * 1024:
    #             raise ValueError('SVG file too large (max 200KB)')
    #     
    #     # Validate website_url
    #     if self.website_url is not None and self.website_url.strip():
    #         # Basic URL validation
    #         if not self.website_url.startswith(('http://', 'https://')):
    #             self.website_url = f'https://{self.website_url}'
    #     
    #     return self

class TenantProfileResponse(BaseModel):
    """Response model for tenant profile including branding"""
    tenant_id: str
    slug: str
    name: str
    
    # Branding
    logo_svg: Optional[str]
    brand_primary: str
    
    # Company Information
    company_name: Optional[str]
    industry: Optional[Union[Industry, str]]
    company_address: Optional[str]
    website_url: Optional[str]
    company_size: Optional[CompanySize]
    time_zone: Optional[str]
    
    # Primary Contact
    primary_contact_name: Optional[str]
    primary_contact_title: Optional[str]
    primary_contact_email: Optional[str]
    primary_contact_phone: Optional[str]
    primary_contact_whatsapp: Optional[str]
    
    # Additional Contacts
    billing_contact_name: Optional[str]
    billing_contact_email: Optional[str]
    technical_contact_name: Optional[str]
    technical_contact_email: Optional[str]
    
    # Platform Configuration
    custom_domain: Optional[str]

class BrandingUpdateRequest(BaseModel):
    brand_primary: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    logo_svg: Optional[str] = None
    
    # Validation removed temporarily due to pydantic version compatibility
    # @model_validator(mode='after')
    # def validate_logo_svg(self):
    #     if self.logo_svg is not None:
    #         if not self.logo_svg.strip().startswith('<svg') or not self.logo_svg.strip().endswith('</svg>'):
    #             raise ValueError('Invalid SVG format')
    #         if len(self.logo_svg.encode('utf-8')) > 200 * 1024:
    #             raise ValueError('SVG file too large (max 200KB)')
    #     return self

class BrandingResponse(BaseModel):
    tenant_id: str
    logo_svg: Optional[str]
    brand_primary: str
    
@router.get("/tenant-profile")
async def get_tenant_profile(tenant_user: TenantAuthorizedUser = TenantUserDep) -> TenantProfileResponse:
    """Get complete tenant profile including branding for the authenticated user's tenant"""
    
    conn = await get_db_connection()
    try:
        # Get tenant data for the authenticated user's tenant
        tenant_row = await conn.fetchrow(
            """SELECT t.id, t.slug, t.name, t.company_name, t.industry, t.company_address, 
                      t.website_url, t.company_size, t.time_zone,
                      t.primary_contact_name, t.primary_contact_title, t.primary_contact_email,
                      t.primary_contact_phone, t.primary_contact_whatsapp,
                      t.billing_contact_name, t.billing_contact_email,
                      t.technical_contact_name, t.technical_contact_email,
                      t.custom_domain,
                      COALESCE(b.logo_svg, NULL) as logo_svg,
                      COALESCE(b.brand_primary, '#0052cc') as brand_primary
               FROM tenants t
               LEFT JOIN tenant_branding b ON t.slug = b.tenant_id
               WHERE t.slug = $1""",
            tenant_user.tenant_slug
        )
        
        if not tenant_row:
            raise HTTPException(status_code=404, detail="Tenant not found")
        
        return TenantProfileResponse(
            tenant_id=tenant_row['slug'],
            slug=tenant_row['slug'],
            name=tenant_row['name'],
            logo_svg=tenant_row['logo_svg'],
            brand_primary=tenant_row['brand_primary'],
            company_name=tenant_row['company_name'],
            industry=tenant_row['industry'],
            company_address=tenant_row['company_address'],
            website_url=tenant_row['website_url'],
            company_size=tenant_row['company_size'],
            time_zone=tenant_row['time_zone'],
            primary_contact_name=tenant_row['primary_contact_name'],
            primary_contact_title=tenant_row['primary_contact_title'],
            primary_contact_email=tenant_row['primary_contact_email'],
            primary_contact_phone=tenant_row['primary_contact_phone'],
            primary_contact_whatsapp=tenant_row['primary_contact_whatsapp'],
            billing_contact_name=tenant_row['billing_contact_name'],
            billing_contact_email=tenant_row['billing_contact_email'],
            technical_contact_name=tenant_row['technical_contact_name'],
            technical_contact_email=tenant_row['technical_contact_email'],
            custom_domain=tenant_row['custom_domain']
        )
    finally:
        await conn.close()

@router.put("/tenant-profile")
async def update_tenant_profile(request: TenantProfileRequest, tenant_user: TenantAuthorizedUser = TenantUserDep) -> TenantProfileResponse:
    """Update complete tenant profile including branding for the authenticated user's tenant"""
    
    conn = await get_db_connection()
    try:
        # Update tenant table for the authenticated user's tenant
        tenant_update_fields = []
        tenant_values = []
        param_count = 1
        
        # Map profile fields to update
        profile_fields = {
            'company_name': request.company_name,
            'industry': request.industry.value if isinstance(request.industry, Industry) else request.industry,
            'company_address': request.company_address,
            'website_url': request.website_url,
            'company_size': request.company_size.value if request.company_size else None,
            'time_zone': request.time_zone,
            'primary_contact_name': request.primary_contact_name,
            'primary_contact_title': request.primary_contact_title,
            'primary_contact_email': request.primary_contact_email,
            'primary_contact_phone': request.primary_contact_phone,
            'primary_contact_whatsapp': request.primary_contact_whatsapp,
            'billing_contact_name': request.billing_contact_name,
            'billing_contact_email': request.billing_contact_email,
            'technical_contact_name': request.technical_contact_name,
            'technical_contact_email': request.technical_contact_email,
            'custom_domain': request.custom_domain
        }
        
        # Add fields that have values
        for field, value in profile_fields.items():
            if value is not None:
                tenant_update_fields.append(f"{field} = ${param_count}")
                tenant_values.append(value)
                param_count += 1
        
        # Update tenant if there are fields to update
        if tenant_update_fields:
            tenant_update_fields.append("updated_at = NOW()")
            tenant_values.append(tenant_user.tenant_slug)
            
            tenant_query = f"UPDATE tenants SET {', '.join(tenant_update_fields)} WHERE slug = ${param_count}"
            await conn.execute(tenant_query, *tenant_values)
        
        # Update branding if provided
        if request.brand_primary is not None or request.logo_svg is not None:
            # Check if branding exists
            existing_branding = await conn.fetchrow(
                "SELECT id FROM tenant_branding WHERE tenant_id = $1",
                tenant_user.tenant_slug
            )
            
            if existing_branding:
                # Update existing branding
                branding_fields = []
                branding_values = []
                param_count = 1
                
                if request.brand_primary is not None:
                    branding_fields.append(f"brand_primary = ${param_count}")
                    branding_values.append(request.brand_primary)
                    param_count += 1
                    
                if request.logo_svg is not None:
                    branding_fields.append(f"logo_svg = ${param_count}")
                    branding_values.append(request.logo_svg)
                    param_count += 1
                
                if branding_fields:
                    branding_fields.append("updated_at = NOW()")
                    branding_values.append(tenant_user.tenant_slug)
                    
                    branding_query = f"UPDATE tenant_branding SET {', '.join(branding_fields)} WHERE tenant_id = ${param_count}"
                    await conn.execute(branding_query, *branding_values)
            else:
                # Insert new branding
                await conn.execute(
                    "INSERT INTO tenant_branding (tenant_id, logo_svg, brand_primary) VALUES ($1, $2, $3)",
                    tenant_user.tenant_slug,
                    request.logo_svg,
                    request.brand_primary or "#0052cc"
                )
        
        # Return updated profile
        return await get_tenant_profile(tenant_user)
    finally:
        await conn.close()

@router.get("/branding")
async def get_branding_settings(tenant_user: TenantAuthorizedUser = TenantUserDep) -> BrandingResponse:
    """Get branding settings for the authenticated user's tenant"""
    
    conn = await get_db_connection()
    try:
        # Get existing branding settings for the authenticated user's tenant
        row = await conn.fetchrow(
            "SELECT tenant_id, logo_svg, brand_primary FROM tenant_branding WHERE tenant_id = $1",
            tenant_user.tenant_slug
        )
        
        if row:
            return BrandingResponse(
                tenant_id=row['tenant_id'],
                logo_svg=row['logo_svg'],
                brand_primary=row['brand_primary']
            )
        else:
            # Return default settings
            return BrandingResponse(
                tenant_id=tenant_user.tenant_slug,
                logo_svg=None,
                brand_primary="#0052cc"
            )
    finally:
        await conn.close()

@router.put("/branding")
async def update_branding_settings(request: BrandingUpdateRequest, tenant_user: TenantAuthorizedUser = TenantUserDep) -> BrandingResponse:
    """Update branding settings for the authenticated user's tenant"""
    
    conn = await get_db_connection()
    try:
        # Check if branding settings exist for the authenticated user's tenant
        existing = await conn.fetchrow(
            "SELECT id FROM tenant_branding WHERE tenant_id = $1",
            tenant_user.tenant_slug
        )
        
        if existing:
            # Update existing settings
            update_fields = []
            values = []
            param_count = 1
            
            if request.brand_primary is not None:
                update_fields.append(f"brand_primary = ${param_count}")
                values.append(request.brand_primary)
                param_count += 1
                
            if request.logo_svg is not None:
                update_fields.append(f"logo_svg = ${param_count}")
                values.append(request.logo_svg)
                param_count += 1
            
            if update_fields:
                update_fields.append("updated_at = NOW()")
                values.append(tenant_user.tenant_slug)
                
                query = f"UPDATE tenant_branding SET {', '.join(update_fields)} WHERE tenant_id = ${param_count} RETURNING tenant_id, logo_svg, brand_primary"
                row = await conn.fetchrow(query, *values)
            else:
                # No fields to update, just return existing
                row = await conn.fetchrow(
                    "SELECT tenant_id, logo_svg, brand_primary FROM tenant_branding WHERE tenant_id = $1",
                    tenant_user.tenant_slug
                )
        else:
            # Insert new settings
            row = await conn.fetchrow(
                "INSERT INTO tenant_branding (tenant_id, logo_svg, brand_primary) VALUES ($1, $2, $3) RETURNING tenant_id, logo_svg, brand_primary",
                tenant_user.tenant_slug,
                request.logo_svg,
                request.brand_primary or "#0052cc"
            )
        
        return BrandingResponse(
            tenant_id=row['tenant_id'],
            logo_svg=row['logo_svg'],
            brand_primary=row['brand_primary']
        )
    finally:
        await conn.close()

@router.post("/branding/upload-logo")
async def upload_logo(tenant_user: TenantAuthorizedUser = TenantUserDep, file: UploadFile = File(...)) -> dict:
    """Upload SVG logo for the authenticated user's tenant"""
    
    if not MULTIPART_AVAILABLE:
        raise HTTPException(
            status_code=503, 
            detail="File upload functionality is currently unavailable. Please install python-multipart."
        )
    
    # Validate file type
    if not file.content_type == "image/svg+xml":
        raise HTTPException(status_code=400, detail="Only SVG files are allowed")
    
    # Read file content
    content = await file.read()
    
    # Validate file size (200KB limit)
    if len(content) > 200 * 1024:
        raise HTTPException(status_code=400, detail="SVG file too large (max 200KB)")
    
    # Decode content
    try:
        svg_content = content.decode('utf-8')
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Invalid file encoding")
    
    # Basic SVG validation
    if not svg_content.strip().startswith('<svg') or not svg_content.strip().endswith('</svg>'):
        raise HTTPException(status_code=400, detail="Invalid SVG format")
    
    # Update branding with new logo
    update_request = BrandingUpdateRequest(logo_svg=svg_content)
    result = await update_branding_settings(update_request, tenant_user)
    
    return {"message": "Logo uploaded successfully", "branding": result}

@router.delete("/branding/reset")
async def reset_branding_settings(tenant_user: TenantAuthorizedUser = TenantUserDep) -> BrandingResponse:
    """Reset branding settings to defaults for the authenticated user's tenant"""
    
    conn = await get_db_connection()
    try:
        # Reset to defaults for the authenticated user's tenant
        row = await conn.fetchrow(
            "INSERT INTO tenant_branding (tenant_id, logo_svg, brand_primary) VALUES ($1, NULL, '#0052cc') ON CONFLICT (tenant_id) DO UPDATE SET logo_svg = NULL, brand_primary = '#0052cc', updated_at = NOW() RETURNING tenant_id, logo_svg, brand_primary",
            tenant_user.tenant_slug
        )
        
        return BrandingResponse(
            tenant_id=row['tenant_id'],
            logo_svg=row['logo_svg'],
            brand_primary=row['brand_primary']
        )
    finally:
        await conn.close()
