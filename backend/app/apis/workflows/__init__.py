from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import asyncpg
from app.auth import AuthorizedUser
from app.libs.models import Workflow, WorkflowCreate, WorkflowExecution
from app.libs.db_connection import get_db_connection

router = APIRouter()

@router.post("/workflows", response_model=Workflow)
async def create_workflow(
    workflow: WorkflowCreate,
    user: AuthorizedUser = Depends()
) -> Workflow:
    """Create a new workflow"""
    conn = await get_db_connection()
    try:
        # Insert workflow
        result = await conn.fetchrow("""
            INSERT INTO workflows (
                tenant_id, name, description, n8n_workflow_id, 
                category, tags, is_public, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, tenant_id, name, description, n8n_workflow_id, 
                     category, tags, is_active, is_public, metadata, 
                     created_at, updated_at
        """, 
        workflow.tenant_id, workflow.name, workflow.description,
        workflow.n8n_workflow_id, workflow.category, workflow.tags,
        workflow.is_public, workflow.metadata
        )
        
        return Workflow(**dict(result))
    except asyncpg.UniqueViolationError:
        raise HTTPException(
            status_code=400, 
            detail="Workflow with this n8n_workflow_id already exists for this tenant"
        )
    finally:
        await conn.close()

@router.get("/workflows", response_model=List[Workflow])
async def list_workflows(
    tenant_id: Optional[str] = None,
    is_active: Optional[bool] = None,
    is_public: Optional[bool] = None,
    category: Optional[str] = None,
    user: AuthorizedUser = Depends()
) -> List[Workflow]:
    """List workflows with optional filters"""
    conn = await get_db_connection()
    try:
        conditions = []
        params = []
        param_count = 1
        
        if tenant_id:
            conditions.append(f"tenant_id = ${param_count}")
            params.append(tenant_id)
            param_count += 1
            
        if is_active is not None:
            conditions.append(f"is_active = ${param_count}")
            params.append(is_active)
            param_count += 1
            
        if is_public is not None:
            conditions.append(f"is_public = ${param_count}")
            params.append(is_public)
            param_count += 1
            
        if category:
            conditions.append(f"category = ${param_count}")
            params.append(category)
            param_count += 1
        
        where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
        
        query = f"""
            SELECT id, tenant_id, name, description, n8n_workflow_id,
                   category, tags, is_active, is_public, metadata,
                   created_at, updated_at
            FROM workflows
            {where_clause}
            ORDER BY created_at DESC
        """
        
        results = await conn.fetch(query, *params)
        return [Workflow(**dict(row)) for row in results]
    finally:
        await conn.close()

@router.get("/workflows/{workflow_id}", response_model=Workflow)
async def get_workflow(
    workflow_id: str,
    user: AuthorizedUser = Depends()
) -> Workflow:
    """Get a specific workflow by ID"""
    conn = await get_db_connection()
    try:
        result = await conn.fetchrow("""
            SELECT id, tenant_id, name, description, n8n_workflow_id,
                   category, tags, is_active, is_public, metadata,
                   created_at, updated_at
            FROM workflows
            WHERE id = $1
        """, workflow_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        return Workflow(**dict(result))
    finally:
        await conn.close()

@router.put("/workflows/{workflow_id}", response_model=Workflow)
async def update_workflow(
    workflow_id: str,
    workflow_update: Dict[str, Any],
    user: AuthorizedUser = Depends()
) -> Workflow:
    """Update a workflow"""
    conn = await get_db_connection()
    try:
        # Build dynamic update query
        update_fields = []
        params = []
        param_count = 1
        
        allowed_fields = {
            'name', 'description', 'category', 'tags', 
            'is_active', 'is_public', 'metadata'
        }
        
        for field, value in workflow_update.items():
            if field in allowed_fields:
                update_fields.append(f"{field} = ${param_count}")
                params.append(value)
                param_count += 1
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No valid fields to update")
        
        update_fields.append(f"updated_at = ${param_count}")
        params.append(datetime.utcnow())
        param_count += 1
        
        params.append(workflow_id)
        
        query = f"""
            UPDATE workflows 
            SET {', '.join(update_fields)}
            WHERE id = ${param_count}
            RETURNING id, tenant_id, name, description, n8n_workflow_id,
                     category, tags, is_active, is_public, metadata,
                     created_at, updated_at
        """
        
        result = await conn.fetchrow(query, *params)
        
        if not result:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        return Workflow(**dict(result))
    finally:
        await conn.close()

@router.delete("/workflows/{workflow_id}")
async def delete_workflow(
    workflow_id: str,
    user: AuthorizedUser = Depends()
):
    """Delete a workflow"""
    conn = await get_db_connection()
    try:
        result = await conn.execute("""
            DELETE FROM workflows WHERE id = $1
        """, workflow_id)
        
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        return {"message": "Workflow deleted successfully"}
    finally:
        await conn.close()

@router.get("/workflows/{workflow_id}/executions", response_model=List[WorkflowExecution])
async def get_workflow_executions(
    workflow_id: str,
    limit: int = 50,
    offset: int = 0,
    user: AuthorizedUser = Depends()
) -> List[WorkflowExecution]:
    """Get executions for a specific workflow"""
    conn = await get_db_connection()
    try:
        results = await conn.fetch("""
            SELECT id, workflow_id, tenant_id, n8n_execution_id, status,
                   started_at, finished_at, execution_data, error_message, created_at
            FROM workflow_executions
            WHERE workflow_id = $1
            ORDER BY started_at DESC
            LIMIT $2 OFFSET $3
        """, workflow_id, limit, offset)
        
        return [WorkflowExecution(**dict(row)) for row in results]
    finally:
        await conn.close()
