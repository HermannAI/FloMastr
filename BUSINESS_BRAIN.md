# Business Brain: Knowledge Ingestion & Retrieval System

**Version**: 3.0  
**Last Updated**: September 10, 2025  
**Status**: Migrated to FastAPI Environment  

## 🧠 Overview & Purpose

The Business Brain is the core knowledge management system of the FloMastr Relational AI platform. It implements **Retrieval-Augmented Generation (RAG)** to ingest, store, and retrieve contextual knowledge from a tenant's business data.

### **Core Philosophy**
The Business Brain serves as the "Conversational Memory" that remembers, learns, and builds context from every piece of ingested knowledge, making each AI interaction more contextually aware and effective.

## 🏗️ Architecture Overview

### **Data Storage Architecture**

#### **Hot Storage (The Index)**
- **Database**: DigitalOcean PostgreSQL
- **Purpose**: Transient data, UI indexes, real-time operations
- **Tables**: `knowledge_index` (metadata and status tracking)

#### **Cold Storage (The Memory)**
- **Database**: DigitalOcean PostgreSQL + pgvector per tenant  
- **Purpose**: Permanent storage for canonical knowledge and vector embeddings
- **Tables**: 
  - `knowledge_items` (processed content)
  - `knowledge_embeddings` (vector embeddings)

### **Processing Pipeline**
```
Input → Convert to Markdown → Store Content → Generate Embeddings → Update Status
```

## 🔌 API Endpoints (Current FastAPI Implementation)

### **Knowledge Management**
```
GET  /routes/knowledge/health - System health check
GET  /routes/knowledge/{tenant_slug}/index - Get knowledge index
POST /routes/knowledge/{tenant_slug}/index - Upsert knowledge content
```

### **Content Processing Tools**
```
POST /routes/tools/convert/file-to-md - Convert files to Markdown
POST /routes/tools/convert/url-to-md - Convert URLs to Markdown  
POST /routes/tools/embed/knowledge - Generate vector embeddings
POST /routes/tools/synthesis - Retrieve and synthesize knowledge
POST /routes/tools/generate/answer - Generate AI answers using context
POST /routes/context/pulse-content - Get contextual content for Relational Pulse campaigns
```
```
POST /routes/tools/convert/file-to-md - Convert files to Markdown
POST /routes/tools/convert/url-to-md - Convert URLs to Markdown  
POST /routes/tools/embed/knowledge - Generate vector embeddings
POST /routes/tools/synthesis - Retrieve and synthesize knowledge
POST /routes/tools/generate/answer - Generate AI answers using context
POST /routes/tools/prepare/context - Prepare context for workflows
```

### **Context Management**
```
GET  /routes/envelope - Get context envelope
POST /routes/add-paste - Add direct text content (replaces context/add-paste)
```

## 📊 Database Schema

### **Hot Storage Schema**
```sql
-- Knowledge Index (Status Tracking)
CREATE TABLE knowledge_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_slug VARCHAR(63) NOT NULL,
    title VARCHAR(255) NOT NULL,
    source VARCHAR(50) NOT NULL, -- 'file', 'url', 'paste', 'hitl'
    status VARCHAR(20) DEFAULT 'processing', -- 'processing', 'embedded', 'failed'
    tags JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Cold Storage Schema**
```sql
-- Knowledge Items (Processed Content)
CREATE TABLE knowledge_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_slug VARCHAR(63) NOT NULL,
    title VARCHAR(255) NOT NULL,
    source VARCHAR(50) NOT NULL,
    markdown TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Knowledge Embeddings (Vector Storage)
CREATE TABLE knowledge_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES knowledge_items(id),
    chunk_index INTEGER NOT NULL,
    vector_embedding vector(1536), -- pgvector type
    text_chunk TEXT NOT NULL,
    model_version VARCHAR(50) DEFAULT 'text-embedding-ada-002',
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔄 Knowledge Ingestion Workflows

### **1. File Ingestion Workflow**
**Endpoint**: `POST /routes/tools/convert/file-to-md`

**Process**:
1. **Receive File** → Base64 encoded file in JSON payload
2. **Convert** → File to Markdown using AI processing
3. **Store Content** → Save to `knowledge_items` table
4. **Generate Embeddings** → Create vector embeddings via OpenAI
5. **Store Vectors** → Save to `knowledge_embeddings` table
6. **Update Status** → Mark as 'embedded' in `knowledge_index`

**Enhanced Security** (Migrated from n8n concerns):
- ✅ Input sanitization for file data
- ✅ Secure credential handling via environment variables
- ✅ Comprehensive error handling and logging

### **2. URL Ingestion Workflow**  
**Endpoint**: `POST /routes/tools/convert/url-to-md`

**Process**:
1. **Receive URL** → Simple JSON payload with URL
2. **Scrape & Convert** → Website content to Markdown
3. **Store & Embed** → Follow same pipeline as file ingestion

### **3. Direct Text Ingestion**
**Endpoint**: `POST /routes/add-paste`

**Process**:
1. **Receive Text** → Title and content in JSON
2. **Store Content** → Direct to `knowledge_items` (no conversion needed)
3. **Generate Embeddings** → Vector processing
4. **Update Status** → Mark as embedded

### **4. Knowledge Card Publishing**
**Endpoint**: `POST /routes/context/publish-card` (Legacy - needs FastAPI implementation)

**Process**:
1. **Receive Card** → Human-curated knowledge card
2. **Store with HITL Source** → Mark as `source: 'hitl'`
3. **Process Embeddings** → Same vector pipeline

## 🔍 Knowledge Retrieval System

### **RAG Pipeline**
**Endpoint**: `POST /routes/tools/synthesis`

**Process**:
1. **Query Embedding** → Convert search query to vector
2. **Similarity Search** → Find relevant chunks using pgvector
3. **Context Aggregation** → Combine relevant knowledge chunks  
4. **Answer Synthesis** → Generate response using retrieved context

**Supporting Endpoints**:
- `POST /routes/tools/prepare/context` - Prepare context for AI workflows
- `POST /routes/tools/generate/answer` - Generate final AI responses

## 🚀 Migration Status: n8n → FastAPI

### **✅ Completed Migrations**

#### **Core Processing Tools** 
- ✅ File to Markdown conversion
- ✅ URL to Markdown conversion  
- ✅ Knowledge embedding generation
- ✅ Context synthesis and retrieval

#### **Knowledge Management**
- ✅ Health monitoring
- ✅ Index management per tenant
- ✅ Vector storage and retrieval

### **🔄 Architecture Improvements**

#### **From n8n Workarounds to Native FastAPI**
- ✅ **Eliminated Execute Command security risks** → Native Python processing
- ✅ **Improved error handling** → FastAPI exception handling
- ✅ **Better credential management** → Environment variables
- ✅ **Enhanced input validation** → Pydantic models

#### **Enhanced Security**
- ✅ **Input sanitization** built into FastAPI endpoints
- ✅ **Secure credential handling** via `.env` configuration
- ✅ **Comprehensive error handling** with proper HTTP status codes
- ✅ **Database-generated UUIDs** maintained for consistency

### **📋 Missing Components (Future Implementation)**

```
❌ POST /routes/context/add-paste - Direct text ingestion endpoint
❌ POST /routes/context/publish-card - Knowledge card publishing
❌ Enhanced workflow status tracking
❌ Advanced embedding model options
```

## 🎯 Performance & Quality Standards

### **Processing Benchmarks**
- **File Conversion**: < 5 seconds for typical documents
- **Vector Generation**: < 2 seconds per knowledge chunk
- **Similarity Search**: < 500ms average query time
- **End-to-End Ingestion**: < 30 seconds for standard files

### **Quality Metrics**
- **Chunk Relevance**: Vector similarity threshold > 0.8
- **Context Coverage**: Minimum 3 relevant chunks per query
- **Response Accuracy**: AI synthesis using top-k retrieval

## 🔧 Configuration & Environment

### **Required Environment Variables**
```env
# OpenAI for embeddings and synthesis
OPENAI_API_KEY=sk-proj-XoMnOPOEZduPXhZ1EqF...

# Database connections
DATABASE_URL=postgresql://doadmin:AVNS_60oX1gbkyUjUxv2y63s@db-postgresql...

# Tenant configuration
SUPER_ADMIN_EMAILS=hermann@changemastr.com,service@changemastr.com
```

### **Deployment Architecture**
- **Backend**: FastAPI on DigitalOcean
- **Database**: Managed PostgreSQL with pgvector extension
- **File Processing**: Native Python libraries (faster than n8n Execute Commands)
- **Vector Storage**: pgvector for optimal performance

## 🛣️ Future Roadmap

### **Phase 1: Complete Migration** 
- ✅ **DONE**: Core API endpoints migrated
- 🔄 **IN PROGRESS**: Missing endpoint implementation
- 📋 **TODO**: Advanced workflow status tracking

### **Phase 2: Enhanced Features**
- 📋 Knowledge versioning and history
- 📋 Advanced embedding models (beyond OpenAI)
- 📋 Multi-language support
- 📋 Knowledge graph relationships

### **Phase 3: AI Improvements**
- 📋 Dynamic context window sizing
- 📋 Intelligent chunk merging
- 📋 Contextual re-ranking of results
- 📋 Learning from user feedback

## 🤝 Integration with Relational Pulse

The Business Brain provides the **contextual intelligence** that powers **Relational Pulse** weekly personalized communications:

### **Pulse Content Generation**
**Endpoint**: `POST /routes/context/pulse-content`

**Purpose**: Generate personalized content recommendations for weekly Relational Pulse campaigns

**Process**:
1. **User Context Analysis** → Analyze user's conversation history and preferences
2. **Knowledge Retrieval** → Search relevant tips, updates, and insights from knowledge base
3. **Content Ranking** → Score content by relevance to user's recent interactions
4. **Personalization** → Tailor content difficulty and format to user's engagement style

**Integration Flow**:
```
Relational Pulse n8n Workflow → Business Brain Context API → Personalized Content → Message Synthesis
```

**Example Content Types**:
- **Tips & Best Practices**: Based on user's recent questions
- **Product Updates**: Relevant to user's purchase history and interests  
- **Industry Insights**: Matched to user's business sector and role
- **Reminders**: Contextual follow-ups to previous conversations

This integration ensures that every **Relational Pulse** message is highly relevant and valuable to each individual user, building stronger customer relationships through personalized AI communication.

---

## 📋 Developer Notes

### **Key Architectural Decisions**
1. **Hot/Cold Storage Pattern**: Maintained for scalability and performance
2. **UUID Generation**: Database-level for consistency and reliability  
3. **Vector Embeddings**: OpenAI text-embedding-ada-002 for quality
4. **Error Handling**: FastAPI native exceptions vs n8n workarounds

### **Security Enhancements**
- Input validation via Pydantic models
- SQL injection prevention through parameterized queries
- Secure file handling without shell command execution
- Environment-based credential management

The Business Brain is now **production-ready** in the FastAPI environment with enhanced security, performance, and maintainability compared to the original n8n implementation.
