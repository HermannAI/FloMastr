from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import asyncpg
from app.auth import AuthorizedUser
from app.libs.models import WorkflowExecution
from app.libs.db_connection import get_db_connection

router = APIRouter()

class WorkflowExecutionCreate(BaseModel):
    workflow_id: str
    tenant_id: str
    n8n_execution_id: Optional[str] = None
    status: str = "running"
    execution_data: Optional[Dict[str, Any]] = None

class WorkflowExecutionUpdate(BaseModel):
    status: Optional[str] = None
    finished_at: Optional[datetime] = None
    execution_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None

@router.post("/workflow-executions", response_model=WorkflowExecution)
async def create_workflow_execution(
    execution: WorkflowExecutionCreate,
    user: AuthorizedUser = Depends()
) -> WorkflowExecution:
    """Create a new workflow execution record"""
    conn = await get_db_connection()
    try:
        # Verify workflow exists
        workflow_exists = await conn.fetchval("""
            SELECT EXISTS(SELECT 1 FROM workflows WHERE id = $1)
        """, execution.workflow_id)
        
        if not workflow_exists:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        result = await conn.fetchrow("""
            INSERT INTO workflow_executions (
                workflow_id, tenant_id, n8n_execution_id, status, 
                execution_data, started_at
            ) VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING id, workflow_id, tenant_id, n8n_execution_id, status,
                     started_at, finished_at, execution_data, error_message, created_at
        """, 
        execution.workflow_id, execution.tenant_id, execution.n8n_execution_id,
        execution.status, execution.execution_data
        )
        
        return WorkflowExecution(**dict(result))
    finally:
        await conn.close()

@router.get("/workflow-executions", response_model=List[WorkflowExecution])
async def list_workflow_executions(
    workflow_id: Optional[str] = None,
    tenant_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    user: AuthorizedUser = Depends()
) -> List[WorkflowExecution]:
    """List workflow executions with optional filters"""
    conn = await get_db_connection()
    try:
        conditions = []
        params = []
        param_count = 1
        
        if workflow_id:
            conditions.append(f"workflow_id = ${param_count}")
            params.append(workflow_id)
            param_count += 1
            
        if tenant_id:
            conditions.append(f"tenant_id = ${param_count}")
            params.append(tenant_id)
            param_count += 1
            
        if status:
            conditions.append(f"status = ${param_count}")
            params.append(status)
            param_count += 1
        
        where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
        
        # Add limit and offset parameters
        params.extend([limit, offset])
        limit_param = param_count
        offset_param = param_count + 1
        
        query = f"""
            SELECT id, workflow_id, tenant_id, n8n_execution_id, status,
                   started_at, finished_at, execution_data, error_message, created_at
            FROM workflow_executions
            {where_clause}
            ORDER BY started_at DESC
            LIMIT ${limit_param} OFFSET ${offset_param}
        """
        
        results = await conn.fetch(query, *params)
        return [WorkflowExecution(**dict(row)) for row in results]
    finally:
        await conn.close()

@router.get("/workflow-executions/{execution_id}", response_model=WorkflowExecution)
async def get_workflow_execution(
    execution_id: str,
    user: AuthorizedUser = Depends()
) -> WorkflowExecution:
    """Get a specific workflow execution"""
    conn = await get_db_connection()
    try:
        result = await conn.fetchrow("""
            SELECT id, workflow_id, tenant_id, n8n_execution_id, status,
                   started_at, finished_at, execution_data, error_message, created_at
            FROM workflow_executions
            WHERE id = $1
        """, execution_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="Workflow execution not found")
        
        return WorkflowExecution(**dict(result))
    finally:
        await conn.close()

@router.put("/workflow-executions/{execution_id}", response_model=WorkflowExecution)
async def update_workflow_execution(
    execution_id: str,
    execution_update: WorkflowExecutionUpdate,
    user: AuthorizedUser = Depends()
) -> WorkflowExecution:
    """Update a workflow execution"""
    conn = await get_db_connection()
    try:
        # Build dynamic update query
        update_fields = []
        params = []
        param_count = 1
        
        if execution_update.status is not None:
            update_fields.append(f"status = ${param_count}")
            params.append(execution_update.status)
            param_count += 1
            
        if execution_update.finished_at is not None:
            update_fields.append(f"finished_at = ${param_count}")
            params.append(execution_update.finished_at)
            param_count += 1
            
        if execution_update.execution_data is not None:
            update_fields.append(f"execution_data = ${param_count}")
            params.append(execution_update.execution_data)
            param_count += 1
            
        if execution_update.error_message is not None:
            update_fields.append(f"error_message = ${param_count}")
            params.append(execution_update.error_message)
            param_count += 1
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No valid fields to update")
        
        params.append(execution_id)
        
        query = f"""
            UPDATE workflow_executions 
            SET {', '.join(update_fields)}
            WHERE id = ${param_count}
            RETURNING id, workflow_id, tenant_id, n8n_execution_id, status,
                     started_at, finished_at, execution_data, error_message, created_at
        """
        
        result = await conn.fetchrow(query, *params)
        
        if not result:
            raise HTTPException(status_code=404, detail="Workflow execution not found")
        
        return WorkflowExecution(**dict(result))
    finally:
        await conn.close()

@router.get("/workflow-executions/stats/summary")
async def get_execution_stats(
    tenant_id: Optional[str] = None,
    workflow_id: Optional[str] = None,
    days: int = 30,
    user: AuthorizedUser = Depends()
) -> Dict[str, Any]:
    """Get execution statistics"""
    conn = await get_db_connection()
    try:
        conditions = ["started_at >= NOW() - INTERVAL '%s days'" % days]
        params = []
        param_count = 1
        
        if tenant_id:
            conditions.append(f"tenant_id = ${param_count}")
            params.append(tenant_id)
            param_count += 1
            
        if workflow_id:
            conditions.append(f"workflow_id = ${param_count}")
            params.append(workflow_id)
            param_count += 1
        
        where_clause = "WHERE " + " AND ".join(conditions)
        
        # Get overall stats
        stats_query = f"""
            SELECT 
                COUNT(*) as total_executions,
                COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
                COUNT(CASE WHEN status = 'error' THEN 1 END) as failed,
                COUNT(CASE WHEN status = 'running' THEN 1 END) as running,
                AVG(EXTRACT(EPOCH FROM (finished_at - started_at))) as avg_duration_seconds
            FROM workflow_executions
            {where_clause}
        """
        
        result = await conn.fetchrow(stats_query, *params)
        
        return {
            "total_executions": result["total_executions"],
            "successful": result["successful"],
            "failed": result["failed"],
            "running": result["running"],
            "success_rate": round((result["successful"] / result["total_executions"]) * 100, 2) if result["total_executions"] > 0 else 0,
            "avg_duration_seconds": round(result["avg_duration_seconds"] or 0, 2),
            "period_days": days
        }
    finally:
        await conn.close()

@router.delete("/workflow-executions/{execution_id}")
async def delete_workflow_execution(
    execution_id: str,
    user: AuthorizedUser = Depends()
):
    """Delete a workflow execution"""
    conn = await get_db_connection()
    try:
        result = await conn.execute("""
            DELETE FROM workflow_executions WHERE id = $1
        """, execution_id)
        
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="Workflow execution not found")
        
        return {"message": "Workflow execution deleted successfully"}
    finally:
        await conn.close()
