


import os
import json
from fastapi import APIRouter, HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import List, Optional
import asyncpg
from datetime import datetime
from uuid import UUID, uuid4

# Import centralized database connection
from app.libs.db_connection import get_db_connection

router = APIRouter()

# Security scheme
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    # Use the standardized backend API secret token
    backend_api_secret = os.getenv("BACKEND_API_SECRET_TOKEN")
    
    if not credentials or credentials.scheme != "Bearer" or credentials.credentials != backend_api_secret:
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return True

# Request/Response Models
class MessageIngestRequest(BaseModel):
    tenant_id: str = Field(..., description="Tenant identifier")
    contact_number: str = Field(..., description="WhatsApp contact number")
    contact_name: str = Field(..., description="Contact's display name")
    message_content: str = Field(..., description="The message content")

class MessageIngestResponse(BaseModel):
    success: bool
    message: str
    contact_id: Optional[str] = None
    message_id: Optional[str] = None
    thread_id: Optional[str] = None
    created_contact: bool = False
    created_thread: bool = False

@router.post(
    "/api/v1/conversations/ingest",
    response_model=MessageIngestResponse,
    dependencies=[Depends(get_current_user)],
    summary="Ingest WhatsApp Message",
    description="Receives and processes incoming WhatsApp messages from n8n backend"
)
async def ingest_message(request: MessageIngestRequest):
    """
    Ingests a WhatsApp message and manages the complete data pipeline:
    1. Contact management (Hot/Cold storage)
    2. Message storage (Cold storage)
    3. Work queue management (Hot storage)
    """
    conn = await get_db_connection()
    
    try:
        # Start transaction
        async with conn.transaction():
            # Step 1: Check if tenant exists
            tenant_query = "SELECT id FROM tenants WHERE id = $1 AND status = 'active'"
            tenant_record = await conn.fetchrow(tenant_query, int(request.tenant_id))
            
            if not tenant_record:
                raise HTTPException(
                    status_code=400,
                    detail=f"Tenant {request.tenant_id} not found or inactive"
                )
            
            tenant_id = tenant_record['id']
            
            # Step 2: Contact Management - Check if contact exists in Hot storage
            contact_query = """SELECT contact_id FROM contacts_cache 
                             WHERE tenant_id = $1 AND whatsapp_number = $2"""
            contact_record = await conn.fetchrow(contact_query, tenant_id, request.contact_number)
            
            contact_id = None
            created_contact = False
            
            if contact_record:
                contact_id = contact_record['contact_id']
                
                # Update last contact timestamp in Hot storage
                await conn.execute(
                    """UPDATE contacts_cache 
                       SET last_contact_timestamp = CURRENT_TIMESTAMP, full_name = $3
                       WHERE contact_id = $1 AND tenant_id = $2""",
                    contact_id, tenant_id, request.contact_name
                )
                
                # Ensure contact exists in Cold storage
                cold_contact_query = "SELECT contact_id FROM contacts_archive WHERE contact_id = $1"
                cold_contact = await conn.fetchrow(cold_contact_query, contact_id)
                
                if not cold_contact:
                    await conn.execute(
                        """INSERT INTO contacts_archive 
                           (contact_id, tenant_id, whatsapp_number, full_name, last_contact_timestamp)
                           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)""",
                        contact_id, tenant_id, request.contact_number, request.contact_name
                    )
            else:
                # Create new contact in both Hot and Cold storage
                contact_id = uuid4()
                created_contact = True
                
                # Insert into Hot storage
                await conn.execute(
                    """INSERT INTO contacts_cache 
                       (contact_id, tenant_id, whatsapp_number, full_name, last_contact_timestamp)
                       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)""",
                    contact_id, tenant_id, request.contact_number, request.contact_name
                )
                
                # Insert into Cold storage
                await conn.execute(
                    """INSERT INTO contacts_archive 
                       (contact_id, tenant_id, whatsapp_number, full_name, last_contact_timestamp)
                       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)""",
                    contact_id, tenant_id, request.contact_number, request.contact_name
                )
            
            # Step 3: Store message in Cold storage
            message_id = uuid4()
            await conn.execute(
                """INSERT INTO messages_archive 
                   (message_id, tenant_id, contact_id, message_content, direction, message_timestamp)
                   VALUES ($1, $2, $3, $4, 'inbound', CURRENT_TIMESTAMP)""",
                message_id, tenant_id, contact_id, request.message_content
            )
            
            # Step 4: Work Queue Management - Check if thread exists
            thread_query = """SELECT thread_id FROM inbox_threads 
                             WHERE tenant_id = $1 AND contact_id = $2"""
            thread_record = await conn.fetchrow(thread_query, tenant_id, contact_id)
            
            thread_id = None
            created_thread = False
            
            if thread_record:
                thread_id = thread_record['thread_id']
                
                # Update existing thread
                await conn.execute(
                    """UPDATE inbox_threads 
                       SET last_message_summary = $3, 
                           last_message_timestamp = CURRENT_TIMESTAMP,
                           contact_name = $4
                       WHERE thread_id = $1 AND tenant_id = $2""",
                    thread_id, tenant_id, 
                    request.message_content[:200] + "..." if len(request.message_content) > 200 else request.message_content,
                    request.contact_name
                )
            else:
                # Create new thread in work queue
                thread_id = uuid4()
                created_thread = True
                
                await conn.execute(
                    """INSERT INTO inbox_threads 
                       (thread_id, tenant_id, contact_id, contact_name, 
                        last_message_summary, last_message_timestamp, status)
                       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, 'new')""",
                    thread_id, tenant_id, contact_id, request.contact_name,
                    request.message_content[:200] + "..." if len(request.message_content) > 200 else request.message_content
                )
            
            print(f"Successfully ingested message from {request.contact_number} for tenant {tenant_id}")
            
            return MessageIngestResponse(
                success=True,
                message="Message ingested successfully",
                contact_id=str(contact_id),
                message_id=str(message_id),
                thread_id=str(thread_id),
                created_contact=created_contact,
                created_thread=created_thread
            )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error ingesting message: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to ingest message: {str(e)}"
        )
    finally:
        await conn.close()

# Health check endpoint for the conversations API
@router.get("/api/v1/conversations/health")
async def health_check():
    """Simple health check for the conversations API"""
    return {"status": "healthy", "service": "conversations"}
