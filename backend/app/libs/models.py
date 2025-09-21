
from pydantic import BaseModel, Field, condecimal
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum
import uuid

class TenantStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"
    SUSPENDED = "suspended"

class Tenant(BaseModel):
    id: Union[int, str, uuid.UUID]  # Support both int and UUID
    slug: str
    name: str
    n8n_url: Optional[str] = None
    status: TenantStatus
    branding_settings: dict = Field(default_factory=dict)
    confidence_threshold: Optional[float] = Field(default=0.75, ge=0, le=1)
    hot_ttl_days: Optional[int] = Field(default=30)
    inbox_scope: Optional[str] = Field(default="databutton")  # Make optional
    catalog_enabled: Optional[bool] = Field(default=False)
    cold_db_ref: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    
    # Company Information
    company_name: Optional[str] = None
    industry: Optional[str] = None
    company_address: Optional[str] = None
    website_url: Optional[str] = None
    company_size: Optional[str] = None
    time_zone: Optional[str] = None
    
    # Primary Contact
    primary_contact_name: Optional[str] = None
    primary_contact_title: Optional[str] = None
    primary_contact_email: Optional[str] = None
    primary_contact_phone: Optional[str] = None
    primary_contact_whatsapp: Optional[str] = None
    
    # Billing Contact
    billing_contact_name: Optional[str] = None
    billing_contact_email: Optional[str] = None
    
    # Technical Contact
    technical_contact_name: Optional[str] = None
    technical_contact_email: Optional[str] = None
    
    # Additional
    custom_domain: Optional[str] = None

    class Config:
        from_attributes = True
        json_encoders = {
            # asyncpg returns Decimal, which is not directly JSON serializable
            condecimal: lambda v: float(v) if v is not None else None,
        }

class TenantCreate(BaseModel):
    slug: str
    name: str
    n8n_url: Optional[str] = None
    status: TenantStatus = TenantStatus.ACTIVE
    cold_db_ref: Optional[str] = None
    
    # Company Information
    company_name: Optional[str] = None
    industry: Optional[str] = None
    company_address: Optional[str] = None
    website_url: Optional[str] = None
    company_size: Optional[str] = None
    time_zone: Optional[str] = None
    
    # Primary Contact
    primary_contact_name: Optional[str] = None
    primary_contact_title: Optional[str] = None
    primary_contact_email: Optional[str] = None
    primary_contact_phone: Optional[str] = None
    primary_contact_whatsapp: Optional[str] = None
    
    # Billing Contact
    billing_contact_name: Optional[str] = None
    billing_contact_email: Optional[str] = None
    
    # Technical Contact
    technical_contact_name: Optional[str] = None
    technical_contact_email: Optional[str] = None
    
    # Additional
    custom_domain: Optional[str] = None

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    status: Optional[TenantStatus] = None
    n8n_url: Optional[str] = None
    n8n_api_key: Optional[str] = None
    database_url: Optional[str] = None
    billing_plan: Optional[str] = None
    billing_status: Optional[str] = None
    trial_ends_at: Optional[datetime] = None
    primary_color: Optional[str] = None
    logo_url: Optional[str] = None
    custom_domain: Optional[str] = None
    admin_user_id: Optional[str] = None
    technical_contact_email: Optional[str] = None

class TenantResolutionRequest(BaseModel):
    identifier: str  # Could be domain, slug, or ID
    type: Optional[str] = "auto"  # auto, domain, slug, id

class TenantPolicies(BaseModel):
    """Tenant-level policy configurations"""
    rate_limit_per_minute: Optional[int] = None
    max_context_length: Optional[int] = None
    allowed_file_types: Optional[List[str]] = None
    max_file_size_mb: Optional[int] = None
    message_retention_days: Optional[int] = None
    hot_ttl_days: Optional[int] = None
    inbox_scope: Optional[str] = None
    catalog_enabled: Optional[bool] = None

class WebChatMessage(BaseModel):
    role: str
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class WebChatSession(BaseModel):
    id: Optional[int] = None
    session_key: str = Field(..., max_length=255)
    tenant_id: int
    workflow_id: str = Field(..., max_length=255)
    user_id: str = Field(..., max_length=255)
    messages: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class WebChatSessionCreate(BaseModel):
    tenant_id: str
    workflow_id: str
    user_id: str

class Industry(str, Enum):
    TECHNOLOGY = "technology"
    HEALTHCARE = "healthcare" 
    FINANCE = "finance"
    EDUCATION = "education"
    RETAIL = "retail"
    MANUFACTURING = "manufacturing"
    REAL_ESTATE = "real_estate"
    LEGAL = "legal"
    CONSULTING = "consulting"
    NON_PROFIT = "non_profit"
    OTHER = "other"

class CompanySize(str, Enum):
    STARTUP = "1-10"
    SMALL = "11-50"
    MEDIUM = "51-200"
    LARGE = "201-1000"
    ENTERPRISE = "1000+"

# Hot Storage Models

class Workflow(BaseModel):
    id: Optional[str] = None
    tenant_id: str
    name: str
    description: Optional[str] = None
    n8n_workflow_id: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list)
    is_active: bool = Field(default=True)
    is_public: bool = Field(default=False)
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class WorkflowCreate(BaseModel):
    tenant_id: str
    name: str
    description: Optional[str] = None
    n8n_workflow_id: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list)
    is_public: bool = Field(default=False)
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

class WorkflowExecution(BaseModel):
    id: Optional[str] = None
    workflow_id: str
    tenant_id: str
    n8n_execution_id: Optional[str] = None
    status: str = Field(default="running")
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    execution_data: Optional[Dict[str, Any]] = Field(default_factory=dict)
    error_message: Optional[str] = None
    created_at: Optional[datetime] = None

class KnowledgeBase(BaseModel):
    id: Optional[str] = None
    tenant_id: str
    name: str
    description: Optional[str] = None
    source_type: Optional[str] = None  # 'upload', 'url', 'api', etc.
    source_metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    document_count: int = Field(default=0)
    total_chunks: int = Field(default=0)
    last_updated: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class KnowledgeBaseCreate(BaseModel):
    tenant_id: str
    name: str
    description: Optional[str] = None
    source_type: Optional[str] = None
    source_metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

class Embedding(BaseModel):
    id: Optional[str] = None
    knowledge_base_id: str
    tenant_id: str
    chunk_text: str
    chunk_metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    embedding_vector: Optional[List[float]] = None  # 1536 dimensions for OpenAI
    document_name: Optional[str] = None
    chunk_index: Optional[int] = None
    created_at: Optional[datetime] = None

class EmbeddingCreate(BaseModel):
    knowledge_base_id: str
    tenant_id: str
    chunk_text: str
    chunk_metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    embedding_vector: List[float]
    document_name: Optional[str] = None
    chunk_index: Optional[int] = None

class UserPreferences(BaseModel):
    id: Optional[str] = None
    user_id: str
    tenant_id: Optional[str] = None
    preferences: Dict[str, Any] = Field(default_factory=dict)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class UserPreferencesCreate(BaseModel):
    user_id: str
    tenant_id: Optional[str] = None
    preferences: Dict[str, Any] = Field(default_factory=dict)

class UserPreferencesUpdate(BaseModel):
    preferences: Dict[str, Any]

__all__ = [
    "TenantStatus",
    "Tenant",
    "TenantCreate",
    "TenantUpdate",
    "TenantResolutionRequest",
    "TenantPolicies",
    "WebChatMessage",
    "WebChatSession",
    "WebChatSessionCreate",
    "Industry",
    "CompanySize",
    # Hot Storage Models
    "Workflow",
    "WorkflowCreate",
    "WorkflowExecution",
    "KnowledgeBase",
    "KnowledgeBaseCreate",
    "Embedding",
    "EmbeddingCreate",
    "UserPreferences",
    "UserPreferencesCreate",
    "UserPreferencesUpdate"
]
