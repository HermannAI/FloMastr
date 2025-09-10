# Infrastructure & Network Configuration

**Version**: 4.0  
**Last Updated**: September 10, 2025  
**Status**: Production Ready - FastAPI/n8n Hybrid Architecture  

## 🏗️ Overview

FloMastr operates on a **hybrid infrastructure** combining our FastAPI backend with **LangChain AI framework**, n8n automation instances, legacy Databutton frontend, **WhatsApp Engine microservice**, and **Data Engine framework**, all orchestrated through Caddy reverse proxy on DigitalOcean.

The architecture includes:
- **LangChain-powered AI Intelligence** for advanced reasoning and conversation management
- **Centralized WhatsApp Engine** for real-time messaging across all tenants
- **Data Engine framework** for live database/API integration via n8n workers
- **Multi-tenant isolation** with dedicated n8n containers per tenant

## 🖥️ Server Configuration

### **Primary Infrastructure**
- **Provider**: DigitalOcean
- **Server**: Ubuntu 22.04 with Docker
- **IP Address**: `143.110.252.87`
- **Architecture**: Multi-tenant with isolated n8n containers + WhatsApp Engine

### **Service Architecture**
```
┌─────────────────────────────────────────────────────┐
│                 Caddy Reverse Proxy                 │
│                (143.110.252.87)                     │
└─────────────────────────────────────────────────────┘
       │              │              │              │
 ┌─────────┐    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
 │Frontend │    │FastAPI      │ │n8n Tenants  │ │WhatsApp     │
 │Databutton│    │Backend +    │ │Docker       │ │Engine +     │
 │         │    │LangChain AI │ │Containers   │ │Data Engine  │
 └─────────┘    └─────────────┘ └─────────────┘ └─────────────┘
                       │                │
                ┌─────────────┐    ┌─────────────┐
                │AI Models    │    │Tenant Data  │
                │OpenAI GPT   │    │Sources      │
                │Embeddings   │    │(DB/APIs)    │
                └─────────────┘    └─────────────┘
```

## 📱 WhatsApp Engine Architecture

### **Overview & Purpose**
The **WhatsApp Engine** is a centralized, independent FastAPI microservice responsible for handling all real-time WhatsApp message traffic for the entire FloMastr platform. It provides the messaging backbone for the **WhappStream** product.

#### **Key Design Principles**
1. **Centralization**: All WhatsApp traffic routes through this single, dedicated service
2. **Decoupling**: Real-time webhook ingestion separated from business logic via persistent job queue
3. **Reliability**: PostgreSQL-backed job queue ensures no message loss
4. **Scalability**: Asynchronous processing handles high message volumes

### **WhatsApp Engine Components**

#### **1. WhatsApp Engine Service** (FastAPI Container)
- **Location**: Containerized on `143.110.252.87`
- **URL**: `https://engine.flomastr.com`
- **Purpose**: High-performance webhook processing and message dispatch

#### **2. Job Queue System** (PostgreSQL Table)
- **Storage**: DigitalOcean PostgreSQL `defaultdb.jobs` table
- **Schema**: 
  ```sql
  CREATE TABLE jobs (
      id UUID PRIMARY KEY,
      payload JSONB NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'queued',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ```

#### **3. n8n Workflow Workers** (Tenant Containers)
- **Processing**: Asynchronous job polling and business logic execution
- **Integration**: Server-to-server communication with WhatsApp Engine
- **Isolation**: Tenant-specific containers prevent cross-contamination

### **WhatsApp Message Flow**
```
1. Inbound Message → 2. Engine Webhook → 3. Job Queue (PostgreSQL)
                                                    ↓
6. Outbound Message ← 5. Engine Send API ← 4. n8n Worker Poll
```

#### **Detailed Flow Process**
1. **Webhook Ingestion**: `POST /webhook/inbound` receives WhatsApp message
2. **Queue Creation**: Message immediately persisted as job in PostgreSQL
3. **Worker Polling**: n8n instances poll `GET /queue/next-job`
4. **Business Logic**: n8n executes tenant-specific workflow (knowledge retrieval, etc.)
5. **Response Dispatch**: n8n calls `POST /messages/send` to reply
6. **Message Delivery**: Engine forwards response to WhatsApp/InfoBip

### **WhatsApp Engine API Specification**

#### **Core Endpoints**
```http
# Health & Status
GET / → Service health check + queue metrics

# Message Ingestion  
POST /webhook/inbound → Accept inbound WhatsApp messages
Content-Type: application/json
{
  "from": "+1234567890",
  "message": "User message content",
  "tenant_id": "whappstream",
  "timestamp": "2025-09-10T10:30:00Z"
}

# Job Processing
GET /queue/next-job → Poll for next queued job
Response: {
  "job_id": "uuid",
  "payload": {...},
  "status": "processing"
}

# Message Sending
POST /messages/send → Send outbound WhatsApp message
Content-Type: application/json
{
  "to": "+1234567890", 
  "message": "Bot response content",
  "tenant_id": "whappstream"
}
```

### **WhatsApp Business API Integration**

#### **Current WABA Provider: InfoBip** 🔄
- **Status**: Testing Phase with Stipe (InfoBip representative)
- **Model**: Pay-as-you-go pricing
- **Integration**: Via InfoBip WhatsApp API
- **Test Account**: Available for Hermann's email

#### **Tenant WABA Onboarding** ✅
- **Self-Service**: Tenants can configure their own WABA credentials
- **Settings Page**: WABA configuration available in tenant settings
- **Credential Storage**: Secure storage of tenant-specific WABA tokens
- **Multi-Provider**: Architecture supports multiple WABA providers per tenant

#### **WABA Provider Support**
```
FloMastr WhatsApp Engine
├── InfoBip Integration (Primary - Testing)
├── Meta Direct API (Future)
├── Twilio WhatsApp (Future) 
└── Custom BSP Integration (Future)
```

## 🌐 DNS Configuration

### **DNS Provider & Management**
- **Authoritative DNS**: DigitalOcean (ns1.digitalocean.com, ns2.digitalocean.com, ns3.digitalocean.com)
- **Domain Registrar**: Name.com (configured to use DigitalOcean nameservers)
- **Domain**: `flomastr.com`

### **DNS Records Structure**
```
# Core Infrastructure
*.flomastr.com          A     143.110.252.87  # Wildcard for all subdomains
@                       A     [SiteGround IP]  # Marketing site
app.flomastr.com        CNAME [Databutton]    # Legacy frontend

# Production Services  
engine.flomastr.com     A     143.110.252.87  # FastAPI backend + WhatsApp Engine
clerk.flomastr.com      A     143.110.252.87  # Clerk auth service

# WhatsApp Engine (Integrated with FastAPI)
# Note: WhatsApp Engine runs within engine.flomastr.com
# Endpoints: /webhook/inbound, /queue/next-job, /messages/send

# n8n Automation Instances (WhatsApp Workers)
test.n8n.flomastr.com      A  143.110.252.87  # Master n8n (port 5678)
whappstream.n8n.flomastr.com A 143.110.252.87  # WhappStream n8n (port 5679)  
mmi-sa.n8n.flomastr.com     A  143.110.252.87  # MMI-SA n8n (port 5681)
```

## 🤖 LangChain AI Intelligence Architecture

### **Overview & Integration**
LangChain provides the AI intelligence layer within our FastAPI backend, enabling sophisticated conversational AI, retrieval-augmented generation (RAG), and intelligent agent capabilities. This framework enhances our "Relational AI Partner" philosophy with production-ready AI orchestration.

### **LangChain Component Architecture**
```
┌─────────────────────────────────────────────────────┐
│           FastAPI Backend + LangChain               │
│           (engine.flomastr.com:8000)                │
└─────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────┐
│                LangChain Framework                  │
├─────────────┬─────────────┬─────────────────────────┤
│RAG Chains   │Conversation │AI Agents               │
│Knowledge    │Memory       │Data Query              │
│Synthesis    │Management   │Decision Making         │
└─────────────┴─────────────┴─────────────────────────┘
                          │
┌─────────────────────────────────────────────────────┐
│              External AI Services                   │
├─────────────┬─────────────┬─────────────────────────┤
│OpenAI GPT   │OpenAI       │LangSmith               │
│Models       │Embeddings   │Monitoring              │
│(gpt-4o-mini)│(ada-002)    │Analytics               │
└─────────────┴─────────────┴─────────────────────────┘
```

### **LangChain-Enhanced Endpoints**

#### **Business Brain Intelligence**
- **Endpoint**: `POST /routes/tools/synthesis`
- **Enhancement**: RAG chains with conversation memory
- **Capabilities**: Context-aware knowledge synthesis, multi-turn conversations

#### **Relational Pulse Personalization**
- **Endpoint**: `POST /routes/context/pulse-content`  
- **Enhancement**: AI agents for intelligent content selection
- **Capabilities**: Dynamic personalization, engagement prediction

#### **Data Engine Natural Language Interface**
- **Endpoint**: `POST /routes/data/nl-query`
- **Enhancement**: SQL/API generation agents
- **Capabilities**: Natural language to structured queries, intelligent data access

### **AI Infrastructure Components**

#### **1. Conversation Memory Management**
```
Per-tenant conversation memory:
├── Conversation Buffer Window (last 10 exchanges)
├── PostgreSQL persistence for long-term memory
├── Context retrieval for relevant conversation history
└── Memory isolation per tenant and user
```

#### **2. RAG (Retrieval-Augmented Generation)**
```
Knowledge retrieval pipeline:
├── Vector embeddings (OpenAI ada-002)
├── PostgreSQL pgvector storage per tenant
├── Semantic similarity search
├── Context window management
└── Source attribution and confidence scoring
```

#### **3. AI Agent Framework**
```
Intelligent decision-making:
├── Tool selection and execution
├── Multi-step reasoning chains
├── Error handling and fallbacks
├── Autonomous workflow optimization
└── Security and permission validation
```

### **Performance & Monitoring**

#### **AI Service Monitoring**
- **Metrics**: Token usage, response times, error rates per endpoint
- **Costs**: OpenAI API usage tracking per tenant
- **Quality**: Response relevance scoring and user feedback integration
- **Caching**: Intelligent caching of embeddings and frequent queries

#### **LangSmith Integration** (Future)
- **Tracing**: End-to-end AI workflow tracing
- **Debugging**: Production AI chain debugging and optimization
- **Analytics**: AI performance analytics and improvement insights

### **Security & Compliance**

#### **AI Data Protection**
- **Tenant Isolation**: All AI operations respect multi-tenant boundaries
- **Data Minimization**: Only necessary context passed to AI models
- **PII Handling**: Automatic detection and protection of sensitive information
- **Audit Trails**: Complete logging of AI decisions and data access

#### **Model Management**
- **Version Control**: Systematic prompt template and model version management
- **Fallback Strategies**: Graceful degradation when AI services unavailable
- **Rate Limiting**: Per-tenant rate limiting for AI service usage
- **Cost Controls**: Automatic limits to prevent excessive AI costs

## 🔧 Caddy Reverse Proxy Configuration

### **Current Caddyfile Analysis**

#### **1. Domain Routing Strategy**
```caddy
# Naked domain redirect
flomastr.com {
    redir https://app.flomastr.com{uri}
}
```
- **Purpose**: Redirect bare domain to legacy Databutton frontend
- **Status**: ✅ Working - maintains legacy marketing flow

#### **2. Wildcard Tenant Routing**
```caddy
*.flomastr.com {
    tls {
        dns digitalocean {env.DO_API_TOKEN}
    }
    
    @not_special not host app.flomastr.com *.n8n.flomastr.com
    handle @not_special {
        reverse_proxy https://app.flomastr.com {
            header_up Host app.flomastr.com
            header_up X-Tenant-Slug "{labels.1}"
            # ... additional headers
        }
    }
}
```
- **Purpose**: Route tenant subdomains to Databutton frontend with tenant context
- **SSL**: Automatic wildcard certificate via DNS-01 challenge
- **Tenant Extraction**: `{labels.1}` extracts tenant slug from subdomain
- **Status**: ✅ Working - supports multi-tenant frontend routing

#### **3. n8n Automation Infrastructure (Enhanced as Data Workers)**
```caddy
test.n8n.flomastr.com {
    reverse_proxy 127.0.0.1:5678
}

whappstream.n8n.flomastr.com {
    reverse_proxy 127.0.0.1:5679  
}

mmi-sa.n8n.flomastr.com {
    reverse_proxy 127.0.0.1:5681
}
```
- **Purpose**: Isolated n8n instances per tenant + **Data Engine workers**
- **Status**: ✅ Working - each tenant has dedicated Docker container
- **Ports**: 5678 (master), 5679 (WhappStream), 5681 (MMI-SA)
- **Data Engine**: ✅ Connects to tenant databases/APIs for real-time lookups

#### **4. FastAPI Backend Service**
```caddy
engine.flomastr.com {
    encode zstd gzip
    reverse_proxy localhost:8000
}
```
- **Purpose**: Routes to our FastAPI backend **including WhatsApp Engine**
- **Status**: ✅ Working - serves all `/routes/*` API endpoints + WhatsApp endpoints
- **Performance**: Gzip compression enabled for optimal transfer
- **WhatsApp Integration**: Handles `/webhook/inbound`, `/queue/next-job`, `/messages/send`

## 🔄 Current Architecture vs Legacy

### **✅ MIGRATED COMPONENTS**

#### **Backend APIs (FastAPI)**
- **From**: Databutton serverless functions  
- **To**: `engine.flomastr.com` → FastAPI on port 8000
- **Status**: ✅ Production ready with 63+ endpoints
- **WhatsApp Engine**: ✅ Integrated within FastAPI backend

#### **WhatsApp Message Processing**
- **From**: Decentralized WhatsApp handling
- **To**: Centralized WhatsApp Engine with job queue
- **Status**: ✅ Operational with PostgreSQL job queue
- **Integration**: ✅ n8n workers poll for jobs and process business logic

#### **Database Layer**
- **From**: Databutton managed database
- **To**: DigitalOcean PostgreSQL with pgvector + jobs table
- **Status**: ✅ Migrated and operational with hot storage

#### **Authentication System**
- **From**: Stack Auth (via Databutton)
- **To**: Clerk (independent service)
- **Status**: ✅ Working with JWT validation

### **🔄 HYBRID COMPONENTS**

#### **Frontend Interface**
- **Current**: Databutton React app (`app.flomastr.com`)
- **Future**: Local React build in this repository
- **Transition**: Frontend calls new FastAPI endpoints via proxy

#### **Workflow Automation & Data Integration**
- **Current**: Dedicated n8n Docker containers per tenant
- **Role**: WhatsApp job workers + **Data Engine processing** + **Relational Pulse campaigns** + general automation  
- **Integration**: ✅ Polls WhatsApp Engine job queue + calls FastAPI endpoints + **connects to tenant data sources** + **weekly pulse workflows**
- **Status**: ✅ Working with master repository at `test.n8n.flomastr.com`
- **Data Engine**: ✅ Real-time database/API lookups for customer queries
- **Relational Pulse**: ✅ Weekly personalized WhatsApp campaigns for proactive customer engagement

#### **WhatsApp Business API**
- **Current**: InfoBip integration (testing phase)
- **Tenant Onboarding**: ✅ Self-service WABA credential configuration
- **Provider Support**: Extensible architecture for multiple WABA providers
- **Status**: 🔄 Testing with InfoBip, production-ready architecture

## 🔐 Security & SSL

### **SSL Certificate Management**
- **Method**: DNS-01 challenge via DigitalOcean API
- **Coverage**: Wildcard certificate for `*.flomastr.com`
- **Automation**: Automatic renewal via Caddy

### **API Security**
- **Environment Variables**: Stored in `/etc/caddy/caddy.env`
- **DigitalOcean API Token**: Secure storage for DNS challenges
- **Header Security**: Proper forwarding for tenant identification

## 🚀 Service Endpoints Summary

### **Public Endpoints**
```
https://flomastr.com               → https://app.flomastr.com (redirect)
https://app.flomastr.com          → Databutton frontend (legacy)
https://{tenant}.flomastr.com     → Databutton frontend with tenant context
https://engine.flomastr.com       → FastAPI backend + WhatsApp Engine (port 8000)
```

### **WhatsApp Engine Endpoints**
```
# Integrated within engine.flomastr.com
https://engine.flomastr.com/          → Health check + queue status
https://engine.flomastr.com/webhook/inbound  → WhatsApp webhook ingestion
https://engine.flomastr.com/queue/next-job   → n8n job polling
https://engine.flomastr.com/messages/send    → Outbound message dispatch
```

### **n8n Automation Endpoints (WhatsApp Workers)**
```
https://test.n8n.flomastr.com        → Master n8n (port 5678)
https://whappstream.n8n.flomastr.com → WhappStream n8n (port 5679) 
https://mmi-sa.n8n.flomastr.com      → MMI-SA n8n (port 5681)
```

### **API Routing Patterns**
```
Frontend API Calls:
https://app.flomastr.com/routes/* → engine.flomastr.com/routes/*

WhatsApp Message Flow:
InfoBip → engine.flomastr.com/webhook/inbound → PostgreSQL jobs table
n8n Workers → engine.flomastr.com/queue/next-job → Business Logic
n8n Workers → engine.flomastr.com/messages/send → InfoBip → WhatsApp

Data Engine Flow:
Customer Query → WhatsApp Engine → n8n Data Worker → Tenant Database/API
Tenant Data → n8n Worker → WhatsApp Engine → Customer Response

n8n Webhook Calls:
https://test.n8n.flomastr.com/webhook/* → Local n8n container

Tenant Resolution:
https://{tenant}.flomastr.com → X-Tenant-Slug header extraction
```

## 📊 Current Status & Issues

### **✅ WORKING SYSTEMS**
- **Wildcard SSL**: Automatic certificate management
- **Tenant Routing**: Multi-tenant subdomain resolution  
- **n8n Isolation**: Per-tenant Docker containers
- **FastAPI Backend**: All 63+ endpoints operational
- **Database**: PostgreSQL with vector extensions + job queue
- **WhatsApp Engine**: ✅ Centralized message processing with job queue
- **WABA Integration**: ✅ InfoBip testing, tenant self-service onboarding
- **Data Engine**: ✅ Real-time database/API integration framework via n8n workers

### **🔄 TRANSITION STATUS**
- **Frontend Migration**: Databutton → Local React (in progress)
- **URL Migration**: `/api/*` → `/routes/*` (completed in backend)
- **n8n Integration**: Enhanced as WhatsApp job workers + general automation
- **WhatsApp Provider**: InfoBip integration testing with Stipe (commercial discussions)

### **📋 KNOWN LIMITATIONS**
- **Legacy Frontend Dependency**: Still using Databutton for UI
- **Mixed Architecture**: Hybrid Databutton/FastAPI during transition
- **URL Prefix Inconsistency**: Some n8n workflows may still use `/api/` prefixes
- **InfoBip Commercial Agreement**: Testing phase, commercial terms pending

## 🛠️ Deployment Architecture

### **Service Dependencies**
```
Caddy (Port 80/443)
├── Databutton Frontend (app.flomastr.com)
├── FastAPI Backend + WhatsApp Engine (localhost:8000)
│   ├── /routes/* API endpoints
│   ├── /routes/tenants/*/pulse/* (Relational Pulse)
│   ├── /webhook/inbound (WhatsApp ingestion)
│   ├── /queue/next-job (n8n polling)
│   └── /messages/send (WhatsApp dispatch)
└── n8n Containers (WhatsApp Workers + Automation + Pulse Campaigns)
    ├── test.n8n.flomastr.com (localhost:5678) - Master
    ├── whappstream.n8n.flomastr.com (localhost:5679) - WhappStream Worker + Pulse
    └── mmi-sa.n8n.flomastr.com (localhost:5681) - MMI-SA Worker + Pulse
```

### **WhatsApp Message Processing Flow**
```
1. InfoBip → 2. engine.flomastr.com/webhook/inbound → 3. PostgreSQL jobs table
                                                              ↓
6. InfoBip ← 5. engine.flomastr.com/messages/send ← 4. n8n worker polls job
```

### **Container Management**
- **Orchestration**: Docker containers for n8n instances
- **Networking**: Internal localhost routing via Caddy
- **Persistence**: Volume mounts for n8n data/configurations
- **Isolation**: Separate containers prevent tenant cross-contamination

## 🔮 Migration Roadmap

### **Phase 1: Complete Backend Migration** ✅
- ✅ FastAPI endpoints operational (63+ routes)
- ✅ Database migration complete with hot storage
- ✅ Authentication system working
- ✅ WhatsApp Engine integrated with job queue system

### **Phase 2: WhatsApp Provider Integration** 🔄
- 🔄 InfoBip commercial agreement (testing with Stipe)
- 📋 Complete WABA provider integration in tenant settings
- 📋 Multi-provider support (InfoBip, Meta Direct, Twilio)
- 📋 Tenant-specific WABA credential management

### **Phase 3: Frontend Migration** �
- 📋 Deploy local React build to replace Databutton frontend
- 📋 Update Caddy configuration for local frontend serving
- 📋 Eliminate Databutton dependency

### **Phase 4: n8n Workflow Optimization** 📋
- 📋 Optimize n8n as dedicated WhatsApp job workers
- 📋 Enhanced workflow templates for WhatsApp automation
- 📋 Performance tuning for high-volume message processing

---

## 🔧 Configuration Files

### **Caddy Environment Variables**
```bash
# /etc/caddy/caddy.env
DO_API_TOKEN=dop_v1_[REDACTED] # DigitalOcean API token for DNS challenges
```

### **Service Status Verification**
```bash
# Check Caddy status
sudo systemctl status caddy

# Verify certificate status  
sudo caddy list-certificates

# Test endpoint connectivity
curl -I https://engine.flomastr.com/routes/health
curl -I https://test.n8n.flomastr.com/
```

The infrastructure is **production-ready and stable** with a clear migration path to eliminate legacy dependencies while maintaining full operational continuity! 🚀
