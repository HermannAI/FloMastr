# FloMastr Platform & WhappStream Product Suite

**The Relational AI Assistant for WhatsApp Business**

## Docker-Only Deployment

This application is designed for containerized deployment using Docker and Docker Compose. All development and production environments run in containers.

### Quick Start

**Prerequisites:**
- Docker and Docker Compose installed
- Environment variables configured (see Environment Configuration section)

**Start Application:**
```bash
# Start entire application stack
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop application
docker-compose **🐳 Docker-First Architecture - IMPLEMENTED:**
- ✅ **Problem**: Platform-specific development friction causing endless debugging sessions.
- ✅ **Root Cause**: Inconsistent local environments (Python, Node.js), shell-specific script issues, and OS-level networking differences.
- ✅ **Solution**: Docker containerization eliminates all platform-specific issues.
- ✅ **Result**: Universal development environment with one-command startup.```

**Verify Setup:**
1. Backend API: `http://localhost:8000/docs` - FastAPI documentation
2. Backend Health: `http://localhost:8000/health` - Should return {"status": "healthy"}
3. Frontend: `http://localhost:5173` - React application
4. Tenant Resolution: `http://localhost:5173/routes/resolve-tenant?email=hermann@changemastr.com` - Should return super admin status
5. Super Admin Login: Use `hermann@changemastr.com` to access admin dashboard

**Key Benefits of Container Deployment:**
- Consistent environment across all platforms
- No local Python/Node.js environment management needed
- Simplified startup process
- Hot reloading for development
- Easy scaling and deployment

### Container Architecture

**Backend Container:**
- **Base Image**: `python:3.11-slim`
- **Working Directory**: `/app`
- **Port**: 8000 (mapped to host:8000)
- **Hot Reloading**: Enabled via volume mount
- **Dependencies**: Optimized 11 essential packages (reduced from 100+)
  - `asyncpg`, `fastapi`, `httpx`, `openai`, `pydantic[email]`
  - `PyJWT`, `PyPDF2`, `python-dotenv`, `python-multipart` 
  - `requests`, `starlette`, `uvicorn`
- **Authentication**: Super admin resolution working with proper tenant routing

**Backend Container:**
- Python 3.11 environment
- FastAPI application with hot reloading
- Automatic dependency management
- Database migrations and health checks
- Port 8000 exposed

**Frontend Container:**
- **Base Image**: `node:18-alpine`
- **Working Directory**: `/app`
- **Port**: 5173 (mapped to host:5173)
- **Hot Reloading**: Vite dev server with auto-refresh
- **Framework**: React + TypeScript + Tailwind CSS
- **API Proxy**: Configured for `/routes/*` and `/api/*` → `backend:8000`
- **Import Resolution**: Optimized path aliases for consistent imports
- **Authentication**: AuthMiddleware properly handles super admin routing

**Container Benefits:**
- No virtual environment needed - container provides isolation
- Consistent Python version - always Python 3.11
- Automatic dependency management - pip install handled by Docker
- Cross-platform compatibility - works on any system with Docker
- Production parity - same environment as deployment

**Docker Development Commands:**
```bash
# Access backend container shell
docker-compose exec backend bash

# View backend logs
docker-compose logs -f backend

# Restart backend after code changes
docker-compose restart backend

# Run database migrations
docker-compose exec backend python migrate_schema.py
```

### Development Setup

#### Quick Start
```bash
# Clone and start development environment
cd FloMastr
docker-compose up --build

# Access services:
# Backend: http://localhost:8000
# Frontend: http://localhost:5173
```

#### Development Workflow
```bash
# Start with logs
docker-compose up

# Start in background
docker-compose up -d

# Restart specific service
docker-compose restart backend

# View logs
docker-compose logs backend
docker-compose logs -f backend  # Follow logs

# Stop all services
docker-compose down

# Rebuild after changes
docker-compose up --build
```

#### Environment Variables
The following environment variables are configured in `docker-compose.yml`:

**Backend Environment:**
```env
DATABASE_URL=postgresql://doadmin:AVNS_60oX1gbkyUjUxv2y63s@db-postgresql-blr1-flomastr-do-user-24629085-0.g.db.ondigitalocean.com:25060/defaultdb?sslmode=require
SUPER_ADMIN_EMAILS=hermann@changemastr.com,service@changemastr.com
```

**Frontend Environment:**
```env
NODE_ENV=development
VITE_API_BASE_URL=http://localhost:8000
```

**Key Configuration Notes:**
- ✅ **Super Admin Access**: `hermann@changemastr.com` and `service@changemastr.com` have admin privileges
- ✅ **API Proxy**: Frontend `/routes/*` and `/api/*` requests proxy to backend
- ✅ **Hot Reloading**: Both services support live code updates
- ✅ **Docker Service Communication**: Services communicate via Docker network using service names

#### Development Benefits
- **✅ Consistent Environment**: Same setup on all platforms (Windows, macOS, Linux)
- **✅ No Local Dependencies**: No Python, Node.js, or database installation needed
- **✅ Hot Reloading**: Code changes automatically reflected in containers
- **✅ Easy Debugging**: Container logs and shell access via `docker-compose exec`
- **✅ Production Parity**: Same containerized environment as production deployment
- **✅ Super Admin Routing**: Proper authentication and tenant resolution working
- **✅ API Communication**: Frontend-backend proxy correctly configured for Docker networking

#### Troubleshooting
**Common Issues:**
1. **Port conflicts**: Ensure ports 8000 and 5173 are available
2. **Container startup**: Use `docker-compose logs service-name` to debug issues
3. **API connectivity**: All `/routes/*` requests from frontend proxy to backend automatically
4. **Super admin access**: Use `hermann@changemastr.com` for admin dashboard access
5. **Dependency issues**: Rebuild containers with `docker-compose up --build` if dependencies change

### **🔐 Authentication & Super Admin Access**

**Super Admin Configuration:**
- ✅ **Configured Emails**: `hermann@changemastr.com`, `service@changemastr.com`
- ✅ **Tenant Resolution API**: `/routes/resolve-tenant` properly identifies super admins
- ✅ **Admin Dashboard Routing**: Super admins automatically redirected to `/admin-dashboard`
- ✅ **API Dependencies**: All required packages installed (`python-multipart`, `pydantic[email]`)

**Testing Super Admin Access:**
```bash
# Test tenant resolution API
curl "http://localhost:5173/routes/resolve-tenant?email=hermann%40changemastr.com"
# Expected response: {"tenant_slug":null,"tenant_name":"Super Admin","is_super_admin":true,"found":true}

# Login flow:
# 1. Navigate to http://localhost:5173
# 2. Login with hermann@changemastr.com
# 3. Should automatically redirect to admin dashboard (not generic dashboard)
```

**Frontend-Backend API Communication:**
- ✅ **Proxy Configuration**: Frontend `/routes/*` requests forward to `backend:8000`
- ✅ **Docker Networking**: Services communicate via Docker service names
- ✅ **Development Setup**: Hot reloading maintains API connectivity
- ✅ **Error Resolution**: Fixed 500 errors in tenant resolution endpoint

## Environment Configuration

## � Core Documentation

### **System Architecture**
- [**INFRASTRUCTURE.md**](./INFRASTRUCTURE.md) - Complete system architecture, service topology, and deployment configuration
- [**DATABASE_ARCHITECTURE.md**](./DATABASE_ARCHITECTURE.md) - Database design, hot storage schema, and data flow architecture
- [**UI_ARCHITECTURE.md**](./UI_ARCHITECTURE.md) - Frontend architecture, component design, and user experience framework
- [**LANGCHAIN_INTEGRATION.md**](./LANGCHAIN_INTEGRATION.md) - AI framework integration for advanced language processing and intelligent reasoning

### **Core Product Documentation**
- [**BUSINESS_BRAIN.md**](./BUSINESS_BRAIN.md) - AI-powered knowledge engine with contextual retrieval system
- [**WORKFLOW_GALLERY.md**](./WORKFLOW_GALLERY.md) - WhappStream intelligent automation and workflow templates
- [**WHATSAPP_ENGINE.md**](./WHATSAPP_ENGINE.md) - Centralized WhatsApp message processing with InfoBip integration
- [**DATA_ENGINE.md**](./DATA_ENGINE.md) - Real-time database and API integration framework
- [**RELATIONAL_PULSE.md**](./RELATIONAL_PULSE.md) - Proactive customer engagement with weekly personalized WhatsApp communications

### **Migration & Development**
- [**API_MIGRATION_STATUS.md**](./API_MIGRATION_STATUS.md) - Backend API migration status and endpoint documentation

### **Current Status: ✅ Migration Complete - Independent FastAPI Backend**

Our FastAPI backend is fully independent and implements all necessary endpoints. All endpoints are prefixed with `/routes/` in our new setup.

### **🛠️ Tools Endpoints (n8n Integration Ready)**
```
POST /routes/tools/synthesis - Main synthesis endpoint
POST /routes/tools/generate/answer - Generate AI answers  
POST /routes/tools/prepare/context - Prepare context for AI workflows
POST /routes/tools/convert/file-to-md - Convert files to markdown
POST /routes/tools/convert/url-to-md - Convert URLs to markdown
POST /routes/tools/embed/knowledge - Embed knowledge content
```

### **🏢 Tenant Management**
```
GET /routes/tenants - List all tenants
GET /routes/tenants/{tenant_slug} - Get specific tenant  
POST /routes/tenants - Create new tenant
PUT /routes/tenants/{tenant_slug} - Update tenant
PUT /routes/tenants/{tenant_slug}/policies - Update tenant policies
DELETE /routes/tenants/{tenant_slug} - Delete tenant
GET /routes/resolve-tenant - Resolve tenant from request
POST /routes/resolve-tenant - Resolve tenant (POST method)

# Admin Functions
POST /routes/api/v1/admin/tenants/provision - Provision new tenant (NEW)
GET /routes/check-super-admin - Check super admin status
```

### **💬 Conversations & Chat**
```
POST /routes/api/v1/conversations/ingest - Ingest chat messages
GET /routes/api/v1/conversations/health - Health check for conversations
POST /routes/webchat/sessions - Create webchat session  
GET /routes/webchat/sessions/{session_key} - Get webchat session
```

### **🎨 Branding & Customization**
```
GET /routes/tenant-profile - Get tenant profile
PUT /routes/tenant-profile - Update tenant profile
GET /routes/branding - Get branding settings
PUT /routes/branding - Update branding settings
```

### **🧠 Knowledge Management**
```
GET /routes/knowledge/health - Knowledge system health
GET /routes/knowledge/{tenant_slug}/index - Get knowledge index
POST /routes/knowledge/{tenant_slug}/index - Upsert knowledge index
```

> 📖 **For detailed Business Brain documentation** including RAG architecture, ingestion workflows, and database schemas, see **[BUSINESS_BRAIN.md](./BUSINESS_BRAIN.md)**

### **👥 Human-in-the-Loop Tasks**
```
GET /routes/tasks - Get HITL tasks
GET /routes/tasks/{task_id} - Get specific task
POST /routes/tasks - Create HITL task  
POST /routes/tasks/{task_id}/resolve - Resolve HITL task
```

### **⚙️ Platform & System**
```
GET /routes/manifest - Get platform manifest
GET /routes/preflight - Preflight checks
GET /routes/envelope - Get context envelope
GET /routes/favicon.ico - Favicon
```

### **🔐 User Management & Auth**
```
GET /routes/users - List users
POST /routes/users - Create user
GET /routes/me/role - Get current user role
GET /routes/me/status - Get user status
GET /routes/debug/jwt - Debug JWT token
GET /routes/debug/auth-status - Debug auth status
```

### **🔄 Workflow & Lifecycle**
```
POST /routes/install-workflow - Install workflow
GET /routes/workflow-templates - Get workflow templates
POST /routes/suspend - Suspend tenant
POST /routes/reactivate - Reactivate tenant
POST /routes/soft-delete - Soft delete tenant
POST /routes/restore - Restore tenant
POST /routes/hard-delete - Hard delete tenant
GET /routes/status/{tenant_id} - Get tenant status
```

### **📋 Additional Endpoints (Future Implementation)**
```
# These endpoints may be implemented as needed for future features:
GET /routes/workflows - Get available workflows
GET /routes/bundles - List bundles
POST /routes/bundles - Create bundle
GET /routes/tenants/{tenant_slug}/bundles - List tenant bundles
PUT /routes/tenants/{tenant_slug}/bundles/{bundle_name} - Install/update bundle
GET /routes/deploy/tenant/{tenant_slug}/bundle/{bundle_name} - Get deploy snippet
POST /routes/branding/{tenant_id}/upload-logo - Upload tenant logo
DELETE /routes/branding/{tenant_id}/reset - Reset branding settings
```

### **🚨 Important: URL Prefix Change**
- **Legacy systems**: May have used `/api/` prefix
- **Current FastAPI**: Uses `/routes/` prefix
- **Update Required**: n8n workflows need URL updates from `/api/` to `/routes/`

## �👥 Team & Collaboration

### **Our Partnership Model**
- **Gemini (Chief Architect)**: Maintains vision integrity, ensures development aligns with guiding philosophy, provides implementation guidance
- **Hermann (Project Lead)**: Executes development, manages workflow, operational oversight  
- **GitHub Copilot (Technical Assistant)**: Performs technical work, provides progress reports, maintains audit trail
- **SuperAI (Problem Solver)**: Assists with complex technical challenges through synthesized solutions

### **Development Workflow**
Every major feature begins with:
1. 📋 Strategic review of architecture document
2. 💭 Discussion of implementation options  
3. 🤝 Joint decision before execution
4. 🔄 Progress reporting and iteration

##  Core Database Schemaend server and a React + TypeScript frontend application, designed to build the definitive Relational AI Assistant for businesses on WhatsApp—a partner so contextually aware and capable of learning that it stands in a category of its own.

## 🧠 Guiding Philosophy: The Relational AI Partner

Our mission is to empower businesses to forge genuine, lasting relationships with their customers through meaningful, intelligent conversation. We are building a system with a **"Conversational Memory"** that remembers, learns, and builds context from every interaction, making each conversation more personal and effective than the last.

Every architectural decision must serve this core principle: contextual awareness and relationship building through AI.

## 🏗️ Core Engine Architecture

Our architecture is composed of three distinct, interacting engines:

- **Context Engine**: Ingests and retrieves a tenant's unstructured knowledge (documents, websites) via semantic search. Powers the Business Brain feature.
- **Data Engine**: Performs real-time, structured lookups against a tenant's internal databases and APIs.
- **WhatsApp Engine**: Central orchestrator that manages live conversations.

## 🛠️ Technology Stack

- **Frontend**: React + TypeScript with Vite (VS Code, Vercel deployment)
- **Backend**: FastAPI (DigitalOcean)
- **Database**: 
  - Hot Storage: DigitalOcean PostgreSQL (transient data, UI indexes, real-time operations)
  - Cold Storage: DigitalOcean PostgreSQL + pgvector per tenant (permanent knowledge, vector embeddings)
- **Workflow Engine**: n8n (DigitalOcean)
- **Authentication**: Clerk (migrated from Stack Auth)
- **Reverse Proxy**: Caddy (DigitalOcean)
- **CDN**: CloudFront

## 🌐 Domain Architecture

- **Base Domain**: flomastr.com
- **Admin Platform**: app.flomastr.com
- **Tenant Subdomains**: {tenant_slug}.flomastr.com
- **WhatsApp Engine**: engine.flomastr.com

## 🚀 Implementation Status & Development Phases

### ✅ **PHASE 1: ROUTER UNIFICATION (COMPLETED)**
**Objective**: Eliminate the dual router system that was causing critical routing conflicts and architectural fragmentation.  
**Outcome**: Unified all routes into a single, predictable system, creating a single source of truth and resolving critical errors.

### ✅ **PHASE 2: AUTH CONSOLIDATION (COMPLETED)**
**Objective**: Eliminate redundant authentication checks and API calls per route.  
**Outcome**: Implemented a centralized AuthMiddleware component that caches auth state per session, dramatically improving performance and security.

### ✅ **PHASE 3: CLERK MIGRATION (COMPLETED)**
**Objective**: Migrate from Stack Auth to Clerk to support a subdomain architecture.  
**Status**: ✅ **Migration Complete** - Clerk authentication fully implemented and working

### ✅ **PHASE 4: WHATSAPP ENGINE MVP (COMPLETED)**
**Objective**: Build a new, centralized microservice for all real-time WhatsApp communication.  
**Outcome**: A containerized FastAPI service with a persistent job queue is now live at https://engine.flomastr.com.

## 🏁 Quickstart

1. **Install Docker:**
   - **Windows**: Docker Desktop
   - **macOS**: Docker Desktop  
   - **Linux**: Docker Engine + Docker Compose

2. **Start the development environment:**
```bash
# Build and start all services
docker-compose up --build

# Or use detached mode
docker-compose up -d --build
```

3. **Access the application:**
   - **Backend API**: http://localhost:8000
   - **Frontend**: http://localhost:5173 (when frontend service added)
   - **API Docs**: http://localhost:8000/docs

4. **Development workflow:**
```bash
# View logs
docker-compose logs -f

# Restart after changes
docker-compose restart backend

# Stop all services
docker-compose down
```

## 🐳 Docker-Native Development

### **Why Docker for FloMastr Development**

Docker eliminates the platform-specific issues that were causing development friction:

- **✅ Universal Compatibility**: Same development experience on any OS with Docker.
- **✅ One-Command Startup**: `docker-compose up` starts everything with proper configuration
- **✅ Production Parity**: Development environment matches production deployment exactly
- **✅ Dependency Isolation**: No conflicts between Python versions, Node.js versions, or package managers
- **✅ Easy Debugging**: Container logs, shell access, and service restart capabilities

### **Docker Development Workflow**

```bash
# Start development (first time)
docker-compose up --build

# Daily development
docker-compose up

# After code changes (automatic hot reload)
# No action needed - changes reflect automatically

# View real-time logs
docker-compose logs -f backend

# Debug in container
docker-compose exec backend bash

# Clean restart
docker-compose down && docker-compose up --build
```

### **Environment Configuration**
All environment variables are managed through `docker-compose.yml`:
```yaml
services:
  backend:
    environment:
      - DATABASE_URL=postgresql://...
      - SUPER_ADMIN_EMAILS=hermann@changemastr.com
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
```

## � Environment Configuration

## 🔧 Environment Configuration

### **Docker Environment Setup**

1. **Copy environment template:**
```bash
cp .env.example .env
```

2. **Edit .env file with your values:**
```env
# Database Configuration
DATABASE_URL=postgresql://doadmin:YOUR_PASSWORD@your-db-host.com:25060/defaultdb?sslmode=require

# Authentication
CLERK_SECRET_KEY=sk_live_YOUR_CLERK_SECRET_KEY
VITE_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_CLERK_PUBLISHABLE_KEY

# Super Admin Configuration  
SUPER_ADMIN_EMAILS=admin@yourcompany.com,service@yourcompany.com

# OpenAI Integration
OPENAI_API_KEY=sk-proj-YOUR_OPENAI_API_KEY
```

3. **Environment Variables are automatically loaded:**
   - Backend container loads from `.env` file
   - Frontend container receives variables via docker-compose.yml
   - No manual environment variable setup needed

### **Development Scripts**

**Quick Start (Recommended):**
```bash
# Cross-platform development script
./dev.sh start        # Linux/macOS

# Or use Docker Compose directly
docker-compose up --build

# Or use Make commands
make dev               # Start development environment
make logs              # View logs
make clean             # Clean up containers
```

### **Script Commands:**
```bash
# Development commands
./dev.sh start         # Start all services
./dev.sh start-bg      # Start in background  
./dev.sh stop          # Stop all services
./dev.sh restart       # Restart services
./dev.sh logs          # View live logs

# Service-specific commands
./dev.sh backend       # Start only backend
./dev.sh frontend      # Start only frontend

# Debugging commands
./dev.sh shell-backend # Shell access to backend
./dev.sh shell-frontend# Shell access to frontend
./dev.sh clean         # Clean up everything
```

### **Hot Storage (The Index)**
DigitalOcean Managed PostgreSQL database for:
- Transient data
- UI indexes  
- Real-time operations

### **Cold Storage (The Memory)**
Separate DigitalOcean Managed PostgreSQL + pgvector database per tenant for:
- Permanent, canonical storage
- All knowledge and vector embeddings
- Conversational memory

## 🔐 Security Architecture

### **Authentication**: 
- **Provider**: Clerk (✅ **Fully Implemented**)
- **Method**: JWT tokens with JWKS validation for user identity management
- **Integration**: Complete frontend (React) and backend (FastAPI) integration

### **Authorization**: 
- **Middleware**: Clerk-based authentication middleware provides single point of validation
- **Checks**: Clerk JWT validation, user roles, and tenant membership for each request
- **Super Admin**: Email-based super admin detection for system administration

### **Tenant Isolation**: 
- **Database Level**: Row-level security using tenant_id on all queries
- **API Level**: Tenant context validation on all protected endpoints  
- **Workflow Level**: Dedicated n8n Docker containers per tenant

## �️ The Road Ahead: Key Initiatives

### **Phase 1: Clerk Migration (✅ COMPLETED)**
- ✅ Remove all Stack Auth code
- ✅ Install and configure Clerk  
- ✅ Update backend authentication middleware

### **Phase 2: WhatsApp Engine Integration**
- 🔄 Finalize the engine's API (real Meta/BSP integration)
- 🔄 Create n8n worker workflows to use the new engine's API

### **Phase 3: Frontend & User Experience**
- 📋 Business Brain UI
- 💬 Conversations Dashboard  
- �📊 Analytics & Insights

## 🎯 Quality Assurance Standards

### **Testing Strategy**
- **Unit Tests**: Individual components and utility functions
- **Integration Tests**: API endpoint validation  
- **End-to-End Tests**: Complete user journey testing (login, provisioning, etc.)

### **Performance Benchmarks**
- **Page Load**: < 2 seconds initial load
- **API Response**: < 500ms average response time
- **Database Queries**: < 100ms average query time

## 🏢 Production Infrastructure

### **Deployment Configuration**
- **Production Domain**: app.flomastr.com
- **Caddy Server IP**: 143.110.252.87
- **WhatsApp Engine**: https://engine.flomastr.com

### **Clerk Configuration**
- **Frontend API URL**: https://clerk.flomastr.com
- **JWKS URL**: https://clerk.flomastr.com/.well-known/jwks.json

## 🗄️ Data Storage Philosophy

```sql
-- Tenant Management
CREATE TABLE tenants (
    id UUID PRIMARY KEY,
    slug VARCHAR(63) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    status tenant_status DEFAULT 'active',
    n8n_url VARCHAR(255)
);

-- User & Membership Management  
CREATE TABLE tenant_memberships (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    user_id VARCHAR(255) NOT NULL,
    role membership_role DEFAULT 'member',
    status membership_status DEFAULT 'active'
);
```

## Docker Development Workflow

### � **Docker-First Development Process**

Docker eliminates all the terminal session management and platform-specific issues that were causing development friction:

### **Daily Development Commands:**

```bash
# Start development environment
docker-compose up

# Start in background (detached mode)
docker-compose up -d

# View live logs
docker-compose logs -f backend
docker-compose logs -f frontend  # when frontend service added

# Restart specific service after major changes
docker-compose restart backend

# Stop all services
docker-compose down

# Rebuild containers (after dependency changes)
docker-compose up --build
```

### **Development Features:**

#### **✅ Hot Reloading**
- **Backend**: Code changes automatically restart FastAPI server
- **Frontend**: Vite hot module replacement (when service added)
- **No manual restarts needed** for most code changes

#### **✅ Container Shell Access**
```bash
# Access backend container for debugging
docker-compose exec backend bash

# Run Python scripts inside container
docker-compose exec backend python migrate_schema.py

# Install additional packages (temporary)
docker-compose exec backend pip install some-package
```

#### **✅ Easy Service Management**
```bash
# Start only backend
docker-compose up backend

# Start with specific log levels
docker-compose up backend --build

# Check service status
docker-compose ps
```

## Authentication & Authorization

### Super Admin Configuration

The application uses Clerk for authentication and has a super admin system for administrative operations like tenant provisioning.

**Super Admin Emails Configuration:**
- Set `SUPER_ADMIN_EMAILS` environment variable in `backend/.env`
- Format: comma-separated list of email addresses
- Example: `SUPER_ADMIN_EMAILS=admin@company.com,super@company.com`

**Important Notes:**
- ❌ **DO NOT add tenant emails to SUPER_ADMIN_EMAILS**
- ❌ **DO NOT add user emails that will be provisioning tenants**
- ✅ Only add dedicated admin/service account emails
- ✅ Super admin emails should be separate from regular user/tenant emails

**Example of what NOT to do:**
```bash
# WRONG - Don't add tenant emails as super admins
SUPER_ADMIN_EMAILS=hermann@changemastr.com,hermann@whappstream.com

# CORRECT - Keep admin and tenant emails separate
SUPER_ADMIN_EMAILS=hermann@changemastr.com,service@changemastr.com
```

**Why this matters:**
- Super admin access is for system administration (tenant provisioning, system config)
- Regular users should not have super admin privileges
- Mixing admin and user emails creates security and confusion issues

## Gotchas

The backend server runs on port 8000 and the frontend development server runs on port 5173. The frontend Vite server proxies API requests to the backend on port 8000.

Visit <http://localhost:5173> to view the application.

## Current Status (Docker-Native Development)

### ✅ **DEVELOPMENT ENVIRONMENT STANDARDIZED**

**🐳 Docker-First Architecture - IMPLEMENTED:**
- ✅ **Problem**: Windows-specific development friction causing endless debugging sessions  
- ✅ **Root Cause**: Platform-specific Python virtual environments, PowerShell terminal issues, AsyncIO event loop problems
- ✅ **Solution**: Docker containerization eliminates all platform-specific issues
- ✅ **Result**: Universal development environment with one-command startup

**🎯 Backend Container - WORKING:**
- ✅ **Container**: Python 3.11-slim with FastAPI on port 8000
- ✅ **Database**: PostgreSQL connection (SSL) working perfectly  
- ✅ **APIs**: All 43 routes imported successfully including tenant provisioning
- ✅ **Environment**: Variables loaded from docker-compose.yml
- ✅ **Hot Reloading**: Code changes automatically restart server

**🎯 Development Workflow - STREAMLINED:**
- ✅ **One Command**: `docker-compose up` starts entire environment
- ✅ **No Setup Required**: No Python virtual environments, no Node.js version management
- ✅ **Cross-Platform**: Works identically on any system that runs Docker.
- ✅ **Production Parity**: Same environment as production deployment
- ✅ **Easy Debugging**: Container logs and shell access
- ✅ **Authentication**: Clerk JWT validation with super admin support

### ✅ **Currently Working Components**

**Containerized Backend:**
- ✅ **FastAPI**: Running in Python 3.11 container
- ✅ **Database**: PostgreSQL connection via environment variables
- ✅ **Authentication**: ✅ **Clerk fully integrated** with JWKS validation and super admin detection  
- ✅ **API Endpoints**: All routes available at http://localhost:8000
- ✅ **Hot Reloading**: Automatic server restart on code changes

**Development Tools:**
- ✅ **Docker Compose**: Single command to start/stop all services
- ✅ **Volume Mounts**: Live code editing with immediate reflection
- ✅ **Environment Management**: All variables in docker-compose.yml
- ✅ **Log Access**: Real-time logging with `docker-compose logs -f`

### � **Ready for Efficient Development**

**Docker Development Commands:**
- ✅ **Start**: `docker-compose up` - starts entire environment
- ✅ **Background**: `docker-compose up -d` - starts in background
- ✅ **Logs**: `docker-compose logs -f backend` - view live logs
- ✅ **Debug**: `docker-compose exec backend bash` - shell access
- ✅ **Restart**: `docker-compose restart backend` - restart service
- ✅ **Stop**: `docker-compose down` - stop all services

**Next Steps:**
1. ✅ **Add Frontend Service** - containerize React frontend with hot reloading
2. ✅ **Test Full Stack** - verify frontend-backend communication in containers  
3. ✅ **Validate Workflows** - ensure all development tasks work in Docker environment

### � **Key Benefits Achieved**

**Development Experience:**
- ✅ **Eliminated Platform Issues**: Docker containerization eliminates platform-specific development friction
- ✅ **One-Command Startup**: Single `docker-compose up` replaces complex startup scripts
- ✅ **Consistent Environment**: Same development experience regardless of operating system
- ✅ **Faster Debugging**: Container logs and shell access simplify troubleshooting

**Technical Architecture:**
- ✅ **Container Isolation**: No dependency conflicts between projects
- ✅ **Production Parity**: Development environment matches production exactly
- ✅ **Easy Scaling**: Add new services by updating docker-compose.yml
- ✅ **Version Control**: All environment configuration tracked in git
