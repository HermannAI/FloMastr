
from fastapi import APIRouter, HTTPException, Request, Query, Depends
from pydantic import BaseModel
from typing import Optional, List
import asyncpg
import uuid
from datetime import datetime
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
        
        # Query knowledge bases for this tenant with chunk counts
        query = """
            SELECT 
                kb.id, 
                kb.name, 
                kb.description, 
                kb.source_type,
                kb.source_metadata, 
                kb.document_count,
                kb.total_chunks,
                kb.created_at, 
                kb.updated_at
            FROM knowledge_bases kb
            WHERE kb.tenant_id = $1
            ORDER BY kb.updated_at DESC
        """
        
        rows = await conn.fetch(query, tenant_user.tenant_id)
        
        entries = []
        for row in rows:
            entries.append({
                "id": str(row["id"]),
                "title": row["name"],
                "content": row["description"] or "",
                "metadata": {
                    "source_type": row["source_type"],
                    "source_metadata": row["source_metadata"] or {},
                    "document_count": row["document_count"] or 0,
                    "total_chunks": row["total_chunks"] or 0
                },
                "created_at": row["created_at"].isoformat() if row["created_at"] else None,
                "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None
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
    """Upsert knowledge base for a tenant"""
    conn = None
    try:
        conn = await get_db_connection()
        
        entry_id = uuid.uuid4()
        now = datetime.utcnow()
        
        # Insert or update knowledge base
        query = """
            INSERT INTO knowledge_bases (id, tenant_id, name, description, source_metadata, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (tenant_id, name) 
            DO UPDATE SET 
                description = EXCLUDED.description,
                source_metadata = EXCLUDED.source_metadata,
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
