


"""
Tenant Lifecycle Management API

Provides endpoints for super admins to manage tenant lifecycles:
- Suspend/reactivate tenants
- Soft delete tenants (reversible)
- Hard delete tenants (irreversible with cascade)
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import asyncpg
import os
from app.auth import AuthorizedUser

# Import centralized database connection
from app.libs.db_connection import get_db_connection

router = APIRouter()

class TenantLifecycleRequest(BaseModel):
    tenant_id: int
    action: str
    reason: Optional[str] = None

class TenantLifecycleResponse(BaseModel):
    tenant_id: int
    action: str
    status: str
    message: str
    timestamp: datetime

class TenantStatus(BaseModel):
    tenant_id: int
    slug: str
    name: str
    status: str
    deleted_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

def check_super_admin_access(user: AuthorizedUser):
    """Check if user has super admin access"""
    super_admin_ids_str = os.getenv("SUPER_ADMIN_IDS")
    if not super_admin_ids_str:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required for tenant lifecycle operations"
        )
    
    super_admin_ids = [id.strip() for id in super_admin_ids_str.split(',') if id.strip()]
    
    if user.sub not in super_admin_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required for tenant lifecycle operations"
        )
    return user


@router.post("/suspend", response_model=TenantLifecycleResponse)
async def suspend_tenant(
    request: TenantLifecycleRequest,
    user: AuthorizedUser
):
    """
    Suspend a tenant - changes status to 'suspended' but preserves all data.
    This is a reversible operation.
    """
    check_super_admin_access(user)
    
    if request.action != "suspend":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid action for suspend endpoint"
        )
    
    conn = await get_db_connection()
    try:
        # Check if tenant exists and is not already suspended
        tenant = await conn.fetchrow(
            "SELECT id, slug, name, status FROM tenants WHERE id = $1",
            request.tenant_id
        )
        
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tenant with ID {request.tenant_id} not found"
            )
        
        if tenant['status'] == 'suspended':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tenant '{tenant['name']}' is already suspended"
            )
        
        # Update tenant status to suspended
        await conn.execute(
            "UPDATE tenants SET status = 'suspended', updated_at = NOW() WHERE id = $1",
            request.tenant_id
        )
        
        return TenantLifecycleResponse(
            success=True,
            message=f"Tenant '{tenant['name']}' has been suspended successfully",
            tenant_id=request.tenant_id,
            action="suspend",
            timestamp=datetime.utcnow()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to suspend tenant: {str(e)}"
        ) from e
    finally:
        await conn.close()


@router.post("/reactivate", response_model=TenantLifecycleResponse)
async def reactivate_tenant(
    request: TenantLifecycleRequest,
    user: AuthorizedUser
):
    """
    Reactivate a suspended tenant - changes status back to 'active'.
    """
    check_super_admin_access(user)
    
    if request.action != "reactivate":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid action for reactivate endpoint"
        )
    
    conn = await get_db_connection()
    try:
        # Check if tenant exists and is suspended
        tenant = await conn.fetchrow(
            "SELECT id, slug, name, status FROM tenants WHERE id = $1",
            request.tenant_id
        )
        
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tenant with ID {request.tenant_id} not found"
            )
        
        if tenant['status'] != 'suspended':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tenant '{tenant['name']}' is not suspended (current status: {tenant['status']})"
            )
        
        # Update tenant status to active
        await conn.execute(
            "UPDATE tenants SET status = 'active', updated_at = NOW() WHERE id = $1",
            request.tenant_id
        )
        
        return TenantLifecycleResponse(
            success=True,
            message=f"Tenant '{tenant['name']}' has been reactivated successfully",
            tenant_id=request.tenant_id,
            action="reactivate",
            timestamp=datetime.utcnow()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reactivate tenant: {str(e)}"
        ) from e
    finally:
        await conn.close()


@router.post("/soft-delete", response_model=TenantLifecycleResponse)
async def soft_delete_tenant(
    request: TenantLifecycleRequest,
    user: AuthorizedUser
):
    """
    Soft delete a tenant - sets deleted_at timestamp but preserves all data.
    This is a reversible operation that hides the tenant from normal listings.
    """
    check_super_admin_access(user)
    
    print(f"DEBUG: Received soft delete request: tenant_id={request.tenant_id}, action={request.action}, reason={request.reason}")
    
    if request.action != "soft_delete":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid action. Expected 'soft_delete', got '{request.action}'"
        )
    
    conn = await get_db_connection()
    try:
        # Check if tenant exists and is not already deleted
        tenant = await conn.fetchrow(
            "SELECT id, slug, name, status, deleted_at FROM tenants WHERE id = $1",
            request.tenant_id
        )
        
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tenant with ID {request.tenant_id} not found"
            )
        
        if tenant['deleted_at'] is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tenant '{tenant['name']}' is already soft deleted"
            )
        
        # Soft delete the tenant
        await conn.execute(
            "UPDATE tenants SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1",
            request.tenant_id
        )
        
        return TenantLifecycleResponse(
            success=True,
            message=f"Tenant '{tenant['name']}' has been soft deleted successfully. This action is reversible.",
            tenant_id=request.tenant_id,
            action="soft_delete",
            timestamp=datetime.utcnow()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to soft delete tenant: {str(e)}"
        ) from e
    finally:
        await conn.close()


@router.post("/restore", response_model=TenantLifecycleResponse)
async def restore_tenant(
    request: TenantLifecycleRequest,
    user: AuthorizedUser
):
    """
    Restore a soft-deleted tenant - clears deleted_at timestamp.
    """
    check_super_admin_access(user)
    
    if request.action != "restore":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid action for restore endpoint"
        )
    
    conn = await get_db_connection()
    try:
        # Check if tenant exists and is soft deleted
        tenant = await conn.fetchrow(
            "SELECT id, slug, name, status, deleted_at FROM tenants WHERE id = $1",
            request.tenant_id
        )
        
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tenant with ID {request.tenant_id} not found"
            )
        
        if tenant['deleted_at'] is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tenant '{tenant['name']}' is not soft deleted"
            )
        
        # Restore the tenant
        await conn.execute(
            "UPDATE tenants SET deleted_at = NULL, updated_at = NOW() WHERE id = $1",
            request.tenant_id
        )
        
        return TenantLifecycleResponse(
            success=True,
            message=f"Tenant '{tenant['name']}' has been restored successfully",
            tenant_id=request.tenant_id,
            action="restore",
            timestamp=datetime.utcnow()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to restore tenant: {str(e)}"
        ) from e
    finally:
        await conn.close()


@router.post("/hard-delete", response_model=TenantLifecycleResponse)
async def hard_delete_tenant(
    request: TenantLifecycleRequest,
    user: AuthorizedUser
):
    """
    Hard delete a tenant - permanently removes tenant and ALL related data.
    This is an IRREVERSIBLE operation that cascades to all related tables.
    """
    check_super_admin_access(user)
    
    if request.action != "hard_delete":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid action for hard delete endpoint"
        )
    
    if not request.reason:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reason is required for hard delete operations"
        )
    
    conn = await get_db_connection()
    try:
        # Check if tenant exists
        tenant = await conn.fetchrow(
            "SELECT id, slug, name, status FROM tenants WHERE id = $1",
            request.tenant_id
        )
        
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tenant with ID {request.tenant_id} not found"
            )
        
        # Start transaction for cascade deletion
        async with conn.transaction():
            # Delete related data in correct order (respecting foreign key constraints)
            
            # 1. Delete messages_archive (depends on contacts_archive)
            messages_count = await conn.fetchval(
                "SELECT COUNT(*) FROM messages_archive WHERE tenant_id = $1",
                request.tenant_id
            )
            await conn.execute(
                "DELETE FROM messages_archive WHERE tenant_id = $1",
                request.tenant_id
            )
            
            # 2. Delete contacts_archive and contacts_cache
            contacts_archive_count = await conn.fetchval(
                "SELECT COUNT(*) FROM contacts_archive WHERE tenant_id = $1",
                request.tenant_id
            )
            await conn.execute(
                "DELETE FROM contacts_archive WHERE tenant_id = $1",
                request.tenant_id
            )
            
            contacts_cache_count = await conn.fetchval(
                "SELECT COUNT(*) FROM contacts_cache WHERE tenant_id = $1",
                request.tenant_id
            )
            await conn.execute(
                "DELETE FROM contacts_cache WHERE tenant_id = $1",
                request.tenant_id
            )
            
            # 3. Delete inbox_threads
            threads_count = await conn.fetchval(
                "SELECT COUNT(*) FROM inbox_threads WHERE tenant_id = $1",
                request.tenant_id
            )
            await conn.execute(
                "DELETE FROM inbox_threads WHERE tenant_id = $1",
                request.tenant_id
            )
            
            # 4. Delete active_hitl_tasks (tenant_id is varchar)
            hitl_tasks_count = await conn.fetchval(
                "SELECT COUNT(*) FROM active_hitl_tasks WHERE tenant_id = $1",
                str(request.tenant_id)
            )
            await conn.execute(
                "DELETE FROM active_hitl_tasks WHERE tenant_id = $1",
                str(request.tenant_id)
            )
            
            # 5. Delete from knowledge_index (uses tenant_slug)
            knowledge_count = await conn.fetchval(
                "SELECT COUNT(*) FROM knowledge_index WHERE tenant_slug = $1",
                tenant['slug']
            )
            await conn.execute(
                "DELETE FROM knowledge_index WHERE tenant_slug = $1",
                tenant['slug']
            )
            
            # 6. Delete from ctx_cache_envelopes (uses tenant_slug)
            ctx_cache_count = await conn.fetchval(
                "SELECT COUNT(*) FROM ctx_cache_envelopes WHERE tenant_slug = $1",
                tenant['slug']
            )
            await conn.execute(
                "DELETE FROM ctx_cache_envelopes WHERE tenant_slug = $1",
                tenant['slug']
            )
            
            # 7. Delete from tenant_profiles (uses tenant_id)
            profiles_count = await conn.fetchval(
                "SELECT COUNT(*) FROM tenant_profiles WHERE tenant_id = $1",
                request.tenant_id
            )
            await conn.execute(
                "DELETE FROM tenant_profiles WHERE tenant_id = $1",
                request.tenant_id
            )
            
            # 8. Finally delete the tenant (CASCADE will handle tenant_branding and webchat_sessions)
            await conn.execute(
                "DELETE FROM tenants WHERE id = $1",
                request.tenant_id
            )
        
        return TenantLifecycleResponse(
            success=True,
            message=f"Tenant '{tenant['name']}' and all related data have been permanently deleted. "
                   f"Removed: {messages_count} messages, {contacts_archive_count} archived contacts, "
                   f"{contacts_cache_count} cached contacts, {threads_count} threads, "
                   f"{hitl_tasks_count} HITL tasks, {knowledge_count} knowledge items, "
                   f"{ctx_cache_count} context cache entries.",
            tenant_id=request.tenant_id,
            action="hard_delete",
            timestamp=datetime.utcnow()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to hard delete tenant: {str(e)}"
        ) from e
    finally:
        await conn.close()


@router.get("/status/{tenant_id}")
async def get_tenant_lifecycle_status(
    tenant_id: int,
    user: AuthorizedUser
):
    """
    Get the current lifecycle status of a tenant.
    """
    check_super_admin_access(user)
    
    conn = await get_db_connection()
    try:
        tenant = await conn.fetchrow(
            "SELECT id, slug, name, status, deleted_at, created_at, updated_at FROM tenants WHERE id = $1",
            tenant_id
        )
        
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tenant with ID {tenant_id} not found"
            )
        
        return {
            "tenant_id": tenant['id'],
            "slug": tenant['slug'],
            "name": tenant['name'],
            "status": tenant['status'],
            "deleted_at": tenant['deleted_at'],
            "created_at": tenant['created_at'],
            "updated_at": tenant['updated_at'],
            "is_suspended": tenant['status'] == 'suspended',
            "is_soft_deleted": tenant['deleted_at'] is not None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get tenant status: {str(e)}"
        ) from e
    finally:
        await conn.close()
