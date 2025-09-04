
from fastapi import APIRouter, HTTPException, Request, Query, Depends
from pydantic import BaseModel
from typing import Optional, List
import asyncpg
import uuid
from datetime import datetime
import databutton as db
from app.auth import AuthorizedUser
from app.libs.backend_auth import require_backend_token
from app.libs.tenant_auth import TenantAuthorizedUser, TenantUserDep
from app.libs.db_connection import get_db_connection

router = APIRouter()

class KnowledgeItem(BaseModel):
    id: str
    title: str
    content: str
    metadata: Optional[dict] = None

class KnowledgeIndexItem(BaseModel):
    id: str
    title: str
    type: str
    intent: str
    tags: List[str]
    source: str
    status: str
    created_at: str

class KnowledgeIndexResponse(BaseModel):
    entries: List[dict]
    total_count: int

class UpsertKnowledgeRequest(BaseModel):
    title: str
    content: str
    metadata: Optional[dict] = None

class UpsertKnowledgeResponse(BaseModel):
    id: str
    status: str

class IndexUpsertRequest(BaseModel):
    id: str
    tenant_slug: str
    title: str
    type: str
    intent: str
    tags: List[str]
    source: str
    status: str
    content_hash: str

@router.get("/health")
async def knowledge_health():
    """Health check for knowledge service"""
    return {"status": "healthy", "service": "knowledge"}

@router.get("/{tenant_slug}/index")
async def get_knowledge_index(
    tenant_user: TenantAuthorizedUser = TenantUserDep
) -> KnowledgeIndexResponse:
    """Get knowledge index for a tenant"""
    conn = None
    try:
        conn = await get_db_connection()
        
        # Query knowledge entries for this tenant
        query = """
            SELECT id, title, content, metadata, created_at, updated_at
            FROM knowledge_entries 
            WHERE tenant_id = $1
            ORDER BY updated_at DESC
        """
        
        rows = await conn.fetch(query, tenant_user.tenant_id)
        
        entries = []
        for row in rows:
            entries.append({
                "id": str(row["id"]),
                "title": row["title"],
                "content": row["content"],
                "metadata": row["metadata"] or {},
                "created_at": row["created_at"].isoformat(),
                "updated_at": row["updated_at"].isoformat()
            })
        
        return KnowledgeIndexResponse(
            entries=entries,
            total_count=len(entries)
        )
        
    except Exception as e:
        print(f"Error getting knowledge index: {e}")
        raise HTTPException(status_code=500, detail="Failed to get knowledge index")
    finally:
        if conn:
            await conn.close()

@router.post("/{tenant_slug}/index")
async def upsert_knowledge_index(
    request: UpsertKnowledgeRequest,
    tenant_user: TenantAuthorizedUser = TenantUserDep
) -> UpsertKnowledgeResponse:
    """Upsert knowledge entry for a tenant"""
    conn = None
    try:
        conn = await get_db_connection()
        
        entry_id = uuid.uuid4()
        now = datetime.utcnow()
        
        # Insert or update knowledge entry
        query = """
            INSERT INTO knowledge_entries (id, tenant_id, title, content, metadata, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (tenant_id, title) 
            DO UPDATE SET 
                content = EXCLUDED.content,
                metadata = EXCLUDED.metadata,
                updated_at = EXCLUDED.updated_at
            RETURNING id
        """
        
        result = await conn.fetchrow(
            query,
            entry_id,
            tenant_user.tenant_id,
            request.title,
            request.content,
            request.metadata or {},
            now,
            now
        )
        
        return UpsertKnowledgeResponse(
            id=str(result["id"]),
            status="success"
        )
        
    except Exception as e:
        print(f"Error upserting knowledge: {e}")
        raise HTTPException(status_code=500, detail="Failed to upsert knowledge")
    finally:
        if conn:
            await conn.close()
