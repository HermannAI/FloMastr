
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
import asyncpg
import json
import re
from uuid import UUID
from app.libs.database import get_db_connection
import requests
import databutton as db
from app.auth import AuthorizedUser
from app.libs.tenant_auth import TenantAuthorizedUser, TenantUserDep

router = APIRouter()

# Constants
MAX_MSG_CHARS = 200
RECENT_MESSAGES_LIMIT = 10
CACHE_TTL_SECONDS = 60
DEFAULT_SLA_SECONDS = 900

class ContactInfo(BaseModel):
    """Contact information model"""
    id: Optional[str] = None  # UUID as string or null for stub contacts
    name: Optional[str] = None
    phone: str
    metadata: Dict[str, Any] = Field(default_factory=dict)

class MessageInfo(BaseModel):
    """Message information model"""
    ts: str  # ISO timestamp
    dir: str  # "in" or "out"
    text: str  # truncated to MAX_MSG_CHARS

class ConversationHistory(BaseModel):
    """Conversation history model"""
    recent_messages: List[MessageInfo] = Field(default_factory=list)
    summary: str = ""  # Empty in MVP

class RoutingInfo(BaseModel):
    """Routing information model"""
    assigned_agent: Optional[str] = None
    sla_seconds: int = DEFAULT_SLA_SECONDS

class ContextEnvelope(BaseModel):
    """Context envelope response model"""
    partial: bool = False
    errors: List[str] = Field(default_factory=list)
    contact: ContactInfo
    conversation_history: ConversationHistory
    routing: RoutingInfo
    custom_data: Dict[str, Any] = Field(default_factory=dict)

def normalize_phone(phone: str) -> str:
    """Normalize phone number to E.164 format"""
    # Remove all non-digit characters
    digits = re.sub(r'\D', '', phone)
    
    # If starts with +, remove it
    if phone.startswith('+'):
        return '+' + digits
    
    # If doesn't start with +, assume it needs +
    if not digits.startswith('+'):
        return '+' + digits
    
    return digits

def truncate_message(content: str, max_chars: int = MAX_MSG_CHARS) -> str:
    """Truncate message content to max_chars"""
    if len(content) <= max_chars:
        return content
    return content[:max_chars - 3] + "..."

@router.get("/envelope")
async def get_context_envelope(
    tenant_id: str = Query(..., description="Tenant identifier"),
    contact_id: Optional[str] = Query(None, description="Contact UUID"),
    whatsapp: Optional[str] = Query(None, description="WhatsApp number in E.164 format")
) -> ContextEnvelope:
    """
    Get conversation context envelope for a contact.
    
    Returns comprehensive context including contact info, conversation history,
    and routing information. Uses caching for performance.
    
    Either contact_id OR whatsapp must be provided.
    """
    
    # Validate input
    if not contact_id and not whatsapp:
        raise HTTPException(
            status_code=400,
            detail="Either contact_id or whatsapp parameter must be provided"
        )
    
    if contact_id and whatsapp:
        raise HTTPException(
            status_code=400,
            detail="Only one of contact_id or whatsapp should be provided"
        )
    
    # Normalize phone if provided
    normalized_phone = normalize_phone(whatsapp) if whatsapp else None
    
    conn = await get_db_connection()
    try:
        # 1. Validate tenant exists
        # Handle both string tenant_slug and potential integer tenant_id
        if tenant_id.isdigit():
            # Legacy integer tenant_id
            tenant_query = """
                SELECT id, slug FROM tenants 
                WHERE id = $1 AND status = 'active'
            """
            tenant_result = await conn.fetchrow(tenant_query, int(tenant_id))
        else:
            # String tenant_slug
            tenant_query = """
                SELECT id, slug FROM tenants 
                WHERE slug = $1 AND status = 'active'
            """
            tenant_result = await conn.fetchrow(tenant_query, tenant_id)
            
        if not tenant_result:
            raise HTTPException(
                status_code=404,
                detail=f"Tenant {tenant_id} not found or inactive"
            )
        
        tenant_slug = tenant_result['slug']
        tenant_int_id = tenant_result['id']
        
        # 2. Try cache first
        cache_key = contact_id if contact_id else normalized_phone
        cache_query = """
            SELECT payload FROM ctx_cache_envelopes 
            WHERE tenant_slug = $1 AND contact_id::text = $2 
            AND expires_at > NOW()
        """
        
        cache_result = await conn.fetchrow(cache_query, tenant_slug, cache_key)
        if cache_result:
            # Cache hit - return cached data
            return ContextEnvelope(**cache_result['payload'])
        
        # 3. Cache miss - build envelope
        envelope = ContextEnvelope(
            contact=ContactInfo(phone=normalized_phone or ""),
            conversation_history=ConversationHistory(),
            routing=RoutingInfo()
        )
        errors = []
        partial = False
        
        try:
            # 4. Contact resolution
            resolved_contact = await resolve_contact(
                conn, tenant_int_id, contact_id, normalized_phone
            )
            
            if resolved_contact:
                envelope.contact = ContactInfo(
                    id=str(resolved_contact['contact_id']) if resolved_contact['contact_id'] else None,
                    name=resolved_contact['full_name'],
                    phone=resolved_contact['whatsapp_number'],
                    metadata=resolved_contact.get('metadata', {})
                )
                actual_contact_id = resolved_contact['contact_id']
            else:
                # Check if tenant allows stub contacts (default true)
                if normalized_phone:
                    envelope.contact = ContactInfo(
                        id=None,
                        name=None,
                        phone=normalized_phone,
                        metadata={}
                    )
                    actual_contact_id = None
                else:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Contact {contact_id} not found"
                    )
        
        except Exception as e:
            errors.append(f"Contact resolution failed: {str(e)}")
            partial = True
        
        # 5. Get conversation history (only if we have a contact_id)
        if actual_contact_id:
            try:
                messages = await get_recent_messages(conn, tenant_int_id, actual_contact_id)
                envelope.conversation_history = ConversationHistory(
                    recent_messages=messages,
                    summary=""  # Empty in MVP
                )
            except Exception as e:
                errors.append(f"Message history failed: {str(e)}")
                partial = True
        
        # 6. Get routing info
        try:
            routing_info = await get_routing_info(conn, tenant_id, actual_contact_id)
            envelope.routing = routing_info
        except Exception as e:
            errors.append(f"Routing info failed: {str(e)}")
            partial = True
        
        # Set error state
        envelope.partial = partial
        envelope.errors = errors
        
        # 7. Cache the result (best effort)
        try:
            await cache_envelope(conn, tenant_slug, cache_key, envelope)
        except Exception:
            # Don't fail the request if caching fails
            pass
        
        return envelope
    
    finally:
        await conn.close()

async def resolve_contact(
    conn: asyncpg.Connection, 
    tenant_id: int, 
    contact_id: Optional[str], 
    whatsapp: Optional[str]
) -> Optional[Dict[str, Any]]:
    """Resolve contact using cache -> archive -> stub policy"""
    
    if contact_id:
        # Look up by contact_id in cache first
        query = """
            SELECT contact_id, whatsapp_number, full_name, metadata
            FROM contacts_cache 
            WHERE tenant_id = $1 AND contact_id = $2
        """
        result = await conn.fetchrow(query, tenant_id, UUID(contact_id))
        if result:
            return dict(result)
        
        # Fallback to archive
        query = """
            SELECT contact_id, whatsapp_number, full_name, metadata
            FROM contacts_archive 
            WHERE tenant_id = $1 AND contact_id = $2
        """
        result = await conn.fetchrow(query, tenant_id, UUID(contact_id))
        if result:
            return dict(result)
    
    elif whatsapp:
        # Look up by whatsapp in cache first
        query = """
            SELECT contact_id, whatsapp_number, full_name, metadata
            FROM contacts_cache 
            WHERE tenant_id = $1 AND whatsapp_number = $2
        """
        result = await conn.fetchrow(query, tenant_id, whatsapp)
        if result:
            return dict(result)
        
        # Fallback to archive
        query = """
            SELECT contact_id, whatsapp_number, full_name, metadata
            FROM contacts_archive 
            WHERE tenant_id = $1 AND whatsapp_number = $2
        """
        result = await conn.fetchrow(query, tenant_id, whatsapp)
        if result:
            return dict(result)
    
    return None

async def get_recent_messages(
    conn: asyncpg.Connection, 
    tenant_id: int, 
    contact_id: UUID
) -> List[MessageInfo]:
    """Get recent messages for contact"""
    
    query = """
        SELECT message_content, direction, message_timestamp
        FROM messages_archive 
        WHERE tenant_id = $1 AND contact_id = $2
        ORDER BY message_timestamp DESC
        LIMIT $3
    """
    
    results = await conn.fetch(query, tenant_id, contact_id, RECENT_MESSAGES_LIMIT)
    
    messages = []
    for row in results:
        messages.append(MessageInfo(
            ts=row['message_timestamp'].isoformat(),
            dir="in" if row['direction'] == 'inbound' else "out",
            text=truncate_message(row['message_content'])
        ))
    
    return messages

async def get_routing_info(
    conn: asyncpg.Connection, 
    tenant_id: str,
    contact_id: Optional[UUID]
) -> RoutingInfo:
    """Get routing information from inbox threads and tasks"""
    
    assigned_agent = None
    
    if contact_id:
        # Check for active HITL tasks
        task_query = """
            SELECT assigned_to FROM active_hitl_tasks 
            WHERE tenant_id = $1::text AND status NOT IN ('completed', 'resolved')
            ORDER BY created_at DESC
            LIMIT 1
        """
        task_result = await conn.fetchrow(task_query, str(tenant_id))
        if task_result and task_result['assigned_to']:
            assigned_agent = task_result['assigned_to']
    
    return RoutingInfo(
        assigned_agent=assigned_agent,
        sla_seconds=DEFAULT_SLA_SECONDS
    )

async def cache_envelope(
    conn: asyncpg.Connection, 
    tenant_slug: str, 
    cache_key: str, 
    envelope: ContextEnvelope
) -> None:
    """Cache envelope with TTL"""
    
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=CACHE_TTL_SECONDS)
    
    query = """
        INSERT INTO ctx_cache_envelopes (tenant_slug, contact_id, payload, expires_at)
        VALUES ($1, $2::uuid, $3, $4)
        ON CONFLICT (tenant_slug, contact_id) 
        DO UPDATE SET 
            payload = $3,
            expires_at = $4
    """
    
    # Convert contact_id to UUID if it's a string, otherwise use cache_key as is
    try:
        if cache_key and '-' in cache_key:  # Looks like a UUID
            cache_contact_id = UUID(cache_key)
        else:
            # For phone numbers, we'll use a deterministic UUID based on the phone
            import hashlib
            phone_hash = hashlib.md5(cache_key.encode()).hexdigest()
            cache_contact_id = UUID(phone_hash[:8] + '-' + phone_hash[8:12] + '-' + phone_hash[12:16] + '-' + phone_hash[16:20] + '-' + phone_hash[20:32])
    except (ValueError, TypeError):
        # If we can't create a valid UUID, skip caching
        return
    
    await conn.execute(
        query, 
        tenant_slug, 
        cache_contact_id, 
        json.dumps(envelope.dict()), 
        expires_at
    )

# New models for add-paste endpoint
class AddPasteRequest(BaseModel):
    """Add paste request model"""
    title: str = Field(..., description="Title for the pasted content")
    content: str = Field(..., description="Content to be pasted and ingested")

class AddPasteResponse(BaseModel):
    """Add paste response model"""
    status: str
    message: str
    tenant_slug: Optional[str] = None

@router.post("/add-paste")
async def add_paste(
    request: AddPasteRequest, 
    tenant_user: TenantAuthorizedUser = TenantUserDep
) -> AddPasteResponse:
    """
    Add paste content and forward to tenant's n8n webhook for ingestion.
    
    This endpoint:
    1. Receives title and content from the frontend
    2. Uses the authenticated user's tenant context
    3. Forwards the data to the tenant's n8n webhook using server-to-server authentication
    4. Returns success/error response
    """
    
    try:
        # Get the API secret token for n8n authentication
        api_secret = db.secrets.get("BACKEND_API_SECRET_TOKEN")
        if not api_secret:
            raise HTTPException(status_code=500, detail="API secret token not configured")
        
        # Use the authenticated user's tenant slug
        tenant_slug = tenant_user.tenant_slug
        
        # Construct the n8n webhook URL
        webhook_url = f"https://{tenant_slug}.n8n.flomastr.com/webhook/context/add-paste"
        
        # Prepare the payload to send to n8n
        payload = {
            "title": request.title,
            "content": request.content,
            "user_id": tenant_user.user_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Set up headers for the request to n8n
        headers = {
            "Content-Type": "application/json",
            "X-Flomastr-API-Key": api_secret
        }
        
        print(f"Sending paste data to n8n webhook: {webhook_url}")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        # Make the request to n8n webhook
        response = requests.post(
            webhook_url,
            json=payload,
            headers=headers,
            timeout=30  # 30 second timeout
        )
        
        # Check if the request was successful
        if response.status_code in [200, 201, 202]:  # Accept various success codes
            print(f"Successfully sent to n8n: {response.status_code} - {response.text}")
            return AddPasteResponse(
                status="success",
                message="Content successfully added and sent for processing",
                tenant_slug=tenant_slug
            )
        else:
            print(f"n8n webhook failed: {response.status_code} - {response.text}")
            raise HTTPException(
                status_code=502,
                detail=f"Failed to send content to processing service: {response.status_code}"
            )
            
    except requests.exceptions.RequestException as e:
        print(f"Network error calling n8n webhook: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Network error calling n8n webhook: {str(e)}"
        )
    except Exception as e:
        print(f"Unexpected error in add_paste: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
