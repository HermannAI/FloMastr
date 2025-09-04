

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID
import uuid
import json
import asyncpg
import databutton as db
from app.auth import AuthorizedUser
from app.libs.tenant_auth import TenantAuthorizedUser, TenantUserDep
from app.libs.db_connection import get_db_connection

router = APIRouter()

# Helper function to transform old payload format to new format
def transform_payload_components(payload_data: dict) -> dict:
    """Transform old payload format to new standardized format"""
    if not payload_data or 'blocks' not in payload_data:
        return payload_data
    
    transformed_blocks = []
    for block in payload_data.get('blocks', []):
        # Handle old format with component_type -> type
        if 'component_type' in block and 'type' not in block:
            block['type'] = block.pop('component_type')
        
        # Generate missing id field
        if 'id' not in block:
            block['id'] = str(uuid.uuid4())
        
        transformed_blocks.append(block)
    
    return {
        'version': payload_data.get('version', '1.0'),
        'blocks': transformed_blocks
    }

# Updated models for standardized component schema
class ComponentBlock(BaseModel):
    id: str
    type: str  # text_content, image_preview, key_value_pairs, document_link
    data: Dict[str, Any]

class PayloadComponents(BaseModel):
    version: str = "1.0"
    blocks: List[ComponentBlock]

class HitlTask(BaseModel):
    task_id: str
    title: str
    description: str
    status: str
    created_at: datetime
    assigned_to: Optional[str] = None

class HitlTaskDetail(BaseModel):
    task_id: str
    tenant_id: str
    title: str
    description: str
    status: str
    payload_components: Optional[PayloadComponents] = None
    created_at: datetime
    assigned_to: Optional[str] = None

class HitlTasksResponse(BaseModel):
    tasks: List[HitlTask]
    total_count: int

class HitlTaskCreate(BaseModel):
    tenant_id: str
    title: str
    description: Optional[str] = None
    payload_components: Optional[dict] = None

class HitlTaskCreateResponse(BaseModel):
    task_id: str

class ResolveTaskRequest(BaseModel):
    action: str  # 'approved', 'rework_requested', 'rejected'
    feedback: Optional[str] = None

class ResolveTaskResponse(BaseModel):
    success: bool
    message: str
    task_id: str
    new_status: str


@router.get("/tasks")
async def get_hitl_tasks_legacy(tenant_user: TenantAuthorizedUser = TenantUserDep):
    """Legacy endpoint for HITL tasks"""
    conn = await get_db_connection()
    try:
        query = """
            SELECT task_id::text as task_id, title, description, status, created_at
            FROM active_hitl_tasks
            WHERE tenant_id = $1
            ORDER BY created_at DESC;
        """
        records = await conn.fetch(query, tenant_user.tenant_id)
        return [HitlTask(**record) for record in records]
    finally:
        await conn.close()


@router.get(
    "/api/v1/tasks",
    response_model=List[HitlTask],
    summary="Get Active HITL Tasks",
    description="Retrieves active HITL tasks for the authenticated tenant, sorted by creation date.",
)
async def get_hitl_tasks(tenant_user: TenantAuthorizedUser = TenantUserDep):
    conn = await get_db_connection()
    try:
        query = """
            SELECT task_id::text as task_id, title, description, status, created_at
            FROM active_hitl_tasks
            WHERE tenant_id = $1
            ORDER BY created_at DESC;
        """
        records = await conn.fetch(query, tenant_user.tenant_id)
        return [HitlTask(**record) for record in records]
    finally:
        await conn.close()


@router.get(
    "/api/v1/tasks/{task_id}",
    response_model=HitlTaskDetail,
    summary="Get HITL Task Details",
    description="Retrieves detailed information for a specific HITL task by task_id.",
)
async def get_hitl_task_detail(task_id: str, tenant_user: TenantAuthorizedUser = TenantUserDep):
    conn = await get_db_connection()
    try:
        query = """
            SELECT task_id, tenant_id, title, description, status, 
                   payload_components, created_at, assigned_to
            FROM active_hitl_tasks
            WHERE task_id = $1 AND tenant_id = $2;
        """
        
        record = await conn.fetchrow(query, UUID(task_id), tenant_user.tenant_id)
        
        if not record:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Parse payload_components
        payload_components = None
        if record['payload_components']:
            if isinstance(record['payload_components'], str):
                payload_data = json.loads(record['payload_components'])
            else:
                payload_data = record['payload_components']
            
            # Transform old format to new format before validation
            transformed_data = transform_payload_components(payload_data)
            payload_components = PayloadComponents(**transformed_data)
        
        return HitlTaskDetail(
            task_id=str(record['task_id']),
            tenant_id=record['tenant_id'],
            title=record['title'],
            description=record['description'],
            status=record['status'],
            payload_components=payload_components,
            created_at=record['created_at'],
            assigned_to=record['assigned_to']
        )
    finally:
        await conn.close()


@router.post(
    "/api/v1/tasks",
    status_code=201,
)
async def create_hitl_task(task: HitlTaskCreate, tenant_user: TenantAuthorizedUser = TenantUserDep):
    """
    Creates a new Human-in-the-Loop task.
    Validates that the task tenant_id matches the authenticated user's tenant.
    """
    # Validate that the task tenant_id matches the authenticated user's tenant
    if task.tenant_id != tenant_user.tenant_id:
        raise HTTPException(
            status_code=403, 
            detail="Cannot create task for a different tenant"
        )
    
    conn = await get_db_connection()
    try:
        query = """
            INSERT INTO active_hitl_tasks (tenant_id, title, description, payload_components)
            VALUES ($1, $2, $3, $4)
            RETURNING task_id;
        """
        
        # Pydantic's model_dump is preferred for converting model to dict
        # and we handle json conversion for payload_components explicitly if needed
        payload_str = json.dumps(task.payload_components) if task.payload_components else None

        task_id = await conn.fetchval(
            query,
            task.tenant_id,
            task.title,
            task.description,
            payload_str
        )
        return HitlTaskCreateResponse(task_id=str(task_id))
    except Exception as e:
        # Log the error for debugging
        print(f"Error creating HITL task: {e}")
        raise HTTPException(status_code=500, detail="Failed to create task.") from None
    finally:
        await conn.close()

@router.post(
    "/api/v1/tasks/{task_id}/resolve",
    response_model=ResolveTaskResponse,
    summary="Resolve HITL Task",
    description="Resolve a HITL task with approve, rework, or reject action",
)
async def resolve_hitl_task(
    task_id: str, 
    request: ResolveTaskRequest,
    tenant_user: TenantAuthorizedUser = TenantUserDep
):
    """
    Resolve a HITL task by updating its status and storing feedback.
    Only allows resolving tasks that belong to the authenticated user's tenant.
    """
    conn = await get_db_connection()
    try:
        # Map actions to status
        status_map = {
            'approved': 'approved',
            'rework_requested': 'rework_requested', 
            'rejected': 'rejected'
        }
        
        if request.action not in status_map:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid action: {request.action}. Must be one of: {list(status_map.keys())}"
            )
        
        new_status = status_map[request.action]
        
        # First verify the task exists and belongs to the user's tenant
        task_check = await conn.fetchrow(
            "SELECT task_id, tenant_id FROM active_hitl_tasks WHERE task_id = $1",
            UUID(task_id)
        )
        
        if not task_check:
            raise HTTPException(status_code=404, detail="Task not found")
            
        if task_check['tenant_id'] != tenant_user.tenant_id:
            raise HTTPException(
                status_code=403, 
                detail="Cannot resolve task from a different tenant"
            )
        
        # Update the task status
        update_query = """
            UPDATE active_hitl_tasks 
            SET status = $1, assigned_to = $2
            WHERE task_id = $3 AND tenant_id = $4
            RETURNING task_id;
        """
        
        updated_task_id = await conn.fetchval(
            update_query,
            new_status,
            tenant_user.user_id,  # Set assigned_to to the user resolving the task
            UUID(task_id),
            tenant_user.tenant_id
        )
        
        if not updated_task_id:
            raise HTTPException(
                status_code=404,
                detail="Task not found or cannot be updated"
            )
        
        # Store feedback if provided (could be expanded to a separate feedback table)
        if request.feedback:
            print(f"Task {task_id} resolved with feedback: {request.feedback}")
        
        return ResolveTaskResponse(
            success=True,
            message=f"Task {request.action} successfully",
            task_id=task_id,
            new_status=new_status
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error resolving HITL task: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to resolve task"
        ) from None
    finally:
        await conn.close()
