# Workflow Gallery & Installation System

**Version**: 3.0  
**Last Updated**: September 10, 2025  
**Status**: Frontend Complete - Backend Integration Needed  

## 🎯 Overview & Purpose

The **Workflow Gallery** is FloMastr's white-label marketplace and automation hub that connects tenants with a curated library of pre-built n8n automation workflows. It enables rapid deployment of powerful automations through a professional, branded interface.

### **Core Value Proposition**
- **🚀 Rapid Implementation** - Deploy complex automations in minutes, not days
- **🎨 White-Label Experience** - Fully branded tenant interface
- **🔧 Technical Abstraction** - Hide n8n complexity behind intuitive UI
- **📚 Curated Library** - Professional, tested workflow templates

## 🏗️ System Architecture

### **Three-Layer Architecture**

#### **1. Workflow Gallery (`/workflows`)**
**Purpose**: Curated marketplace interface
- **Search & Discovery** - Tag-based filtering and categorization
- **Template Library** - Pre-built automation workflows
- **Examples**: "Patient Triage Bot", "Lead Qualification Assistant", "Order Processing Pipeline"

#### **2. Workflow Installation (`/workflows/{workflow_id}`)**
**Purpose**: Seamless setup and configuration
- **Credential Management** - Secure API key and service configuration
- **Embedded Setup** - iframe integration with n8n's native wizard
- **No External Redirects** - Keeps users within branded experience

#### **3. Per-Tenant n8n Integration**
**Purpose**: Multi-tenant isolation and branding
- **Isolated Clusters** - Each tenant has dedicated n8n instance
- **Inherited Branding** - Tenant logos, colors, and styling
- **Custom URLs** - Tenant-specific n8n endpoints

## 🎨 Frontend Implementation (✅ COMPLETED)

### **Current Frontend Status**
- ✅ **UI Components** - Gallery cards, installation wizards, progress indicators
- ✅ **Page Architecture** - `/workflows` and `/workflows/{workflow_id}` routes
- ✅ **Search & Filtering** - Tag-based discovery system
- ✅ **Responsive Design** - Mobile and desktop optimized
- ✅ **Branding Integration** - Tenant-specific styling support

### **Frontend Components Structure**
```
src/pages/workflows/
├── WorkflowGallery.tsx     # Main gallery interface
├── WorkflowInstall.tsx     # Installation wizard
├── WorkflowCard.tsx        # Individual workflow cards
└── WorkflowFilters.tsx     # Search and filtering

src/components/
├── WorkflowIframe.tsx      # n8n setup iframe integration
├── InstallProgress.tsx     # Installation progress tracking
└── WorkflowBranding.tsx    # Tenant branding application
```

## 🔌 Backend Integration (🔄 IN PROGRESS)

### **Current Implementation Status**

#### **✅ COMPLETED - Core API Endpoints**
```
GET  /routes/workflow-templates - Get workflow templates from master n8n
POST /routes/install-workflow - Install workflow to tenant n8n instance  
```

#### **✅ COMPLETED - Frontend Integration** 
- **Gallery Interface** - `/workflows` route with filtering and search
- **Installation Flow** - `/workflow-install/{id}` route ready
- **API Integration** - `brain.get_workflow_templates()` client method
- **Responsive Cards** - WorkflowCard component with icons and tags

#### **❌ TODO - Missing Integration Points**
```
GET  /routes/workflows/{workflow_id} - Get specific workflow details  
GET  /routes/n8n/{tenant_slug}/workflows - Proxy to tenant's n8n instance
POST /routes/n8n/{tenant_slug}/workflows/install - Install workflow via n8n API
GET  /routes/n8n/{tenant_slug}/credentials - Manage n8n credentials
GET  /routes/tenants/{tenant_slug}/n8n-config - Get n8n cluster info
PUT  /routes/tenants/{tenant_slug}/n8n-config - Update n8n configuration
```

### **Current Master n8n Integration**

The system currently connects to a **master n8n repository** at:
- **Master Repository**: `https://test.n8n.flomastr.com/api/v1/workflows`
- **Authentication**: `N8N_MASTER_API_KEY` environment variable
- **Smart Workflow Analysis**: Automatically generates tags, requirements, and descriptions from n8n workflow JSON

#### **Intelligent Workflow Metadata Generation**
```python
# Auto-generated tags based on workflow content
tags = []
if 'chat' in name.lower() or 'bot' in name.lower():
    tags.append('chatbot')
if 'health' in name.lower() or 'patient' in name.lower():
    tags.append('healthcare')
if 'crm' in name.lower() or 'lead' in name.lower():
    tags.append('crm')

# Auto-detected requirements from node types  
requires = []
if 'n8n-nodes-base.openAi' in node_types:
    requires.append('OpenAI')
if 'n8n-nodes-base.webhook' in node_types:
    requires.append('Webhook')
```

#### **Dynamic Icon Assignment**
```python
# Context-aware icon selection
if 'chat' in name.lower() or 'bot' in name.lower():
    icon_url = "https://cdn.flomastr.com/icons/chat.svg"
elif 'health' in name.lower() or 'patient' in name.lower():
    icon_url = "https://cdn.flomastr.com/icons/health.svg"
elif 'crm' in name.lower() or 'lead' in name.lower():
    icon_url = "https://cdn.flomastr.com/icons/crm.svg"
```

#### **Workflow Templates Table**
```sql
CREATE TABLE workflow_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- 'healthcare', 'sales', 'ecommerce', etc.
    tags JSONB, -- ['patient-triage', 'whatsapp', 'ai']
    n8n_workflow_id VARCHAR(255), -- Reference to n8n workflow
    icon_url VARCHAR(500),
    preview_images JSONB, -- Array of screenshot URLs
    configuration_schema JSONB, -- Required setup fields
    requirements JSONB, -- Required integrations/APIs
    difficulty_level VARCHAR(20) DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced'
    estimated_setup_time INTEGER, -- Minutes
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **Tenant Workflows Table**
```sql
CREATE TABLE tenant_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_slug VARCHAR(63) NOT NULL,
    workflow_template_id UUID REFERENCES workflow_templates(id),
    n8n_workflow_id VARCHAR(255), -- Installed workflow ID in tenant's n8n
    installation_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'installing', 'active', 'failed'
    configuration_data JSONB, -- Tenant-specific configuration
    installed_at TIMESTAMP,
    last_updated TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_slug, workflow_template_id)
);
```

#### **n8n Cluster Configuration**
```sql
CREATE TABLE tenant_n8n_clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_slug VARCHAR(63) UNIQUE NOT NULL,
    n8n_base_url VARCHAR(500) NOT NULL, -- https://n8n-tenant1.flomastr.com
    api_key_encrypted TEXT, -- Encrypted n8n API key
    webhook_base_url VARCHAR(500), -- For webhook endpoints
    cluster_status VARCHAR(50) DEFAULT 'active', -- 'active', 'suspended', 'maintenance'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔄 Integration Workflow

### **1. Gallery Discovery Flow**
```
User visits /workflows
→ Frontend calls GET /routes/workflows
→ Backend proxies to tenant's n8n instance GET /api/workflows
→ Enriches with template metadata
→ Returns formatted gallery data
→ Frontend renders workflow cards
```

### **2. Workflow Installation Flow**
```
User clicks "Install Workflow"
→ Frontend navigates to /workflows/{workflow_id}
→ Backend creates installation record (status: 'pending')
→ Frontend embeds n8n setup iframe
→ User configures credentials in n8n wizard
→ n8n webhook notifies backend of completion
→ Backend updates status to 'active'
→ Frontend shows success confirmation
```

### **3. Multi-Tenant Isolation**
```
Request includes tenant context
→ Backend resolves tenant's n8n cluster URL
→ All n8n API calls use tenant-specific endpoint
→ Branding applied from tenant configuration
→ Workflows isolated per tenant
```

## 🛠️ Implementation Priority

### **Phase 1: Core Integration (HIGH PRIORITY)**
```
❌ n8n API proxy endpoints
❌ Workflow template data population
❌ Basic installation workflow
❌ Tenant n8n cluster configuration
```

### **Phase 2: Enhanced Features (MEDIUM PRIORITY)**
```
❌ Advanced filtering and search
❌ Workflow preview and screenshots
❌ Installation progress tracking
❌ Credential management UI
```

### **Phase 3: Advanced Features (LOW PRIORITY)**
```
❌ Custom workflow submission
❌ Usage analytics and metrics
❌ Workflow versioning
❌ Community features (ratings, reviews)
```

## 🔗 n8n API Integration

### **Required n8n API Endpoints**
```
GET  /api/workflows - List all workflows
GET  /api/workflows/{id} - Get workflow details
POST /api/workflows - Create new workflow
PUT  /api/workflows/{id} - Update workflow
GET  /api/credentials - List credentials
POST /api/credentials - Create credential
```

### **Webhook Integration**
```
n8n Installation Webhook → /routes/n8n/installation-complete
n8n Workflow Status → /routes/n8n/workflow-status-update
n8n Error Notifications → /routes/n8n/error-notification
```

## 🎨 Branding & White-Label

### **Tenant Branding Application**
- **Dynamic Logos** - Tenant logo in workflow cards and installation
- **Color Schemes** - Primary/secondary colors from tenant config
- **Custom Domains** - Tenant-specific URLs for n8n instances
- **Branded Emails** - Installation confirmations and notifications

### **UI Customization Points**
```typescript
interface TenantBranding {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  companyName: string;
  customDomain?: string;
  n8nClusterUrl: string;
}
```

## 📊 Success Metrics

### **Gallery Performance**
- **Discovery Rate** - % of tenants who browse workflows
- **Installation Rate** - % of discoveries that lead to installs
- **Setup Completion** - % of installations successfully configured
- **Time to Value** - Average time from discovery to active workflow

### **Technical Metrics**
- **API Response Time** - < 500ms for gallery loading
- **Installation Success Rate** - > 95% completion rate
- **n8n Proxy Performance** - < 200ms overhead
- **Tenant Isolation** - Zero cross-tenant data leaks

## 🚀 Next Actions

### **Immediate (This Sprint)**
1. **Connect Gallery to n8n API** - Implement `/routes/workflows` with real data
2. **Create n8n Proxy Layer** - Tenant-specific API routing
3. **Database Schema Setup** - Implement workflow and cluster tables

### **Short Term (Next Sprint)**
1. **Installation Flow** - Complete end-to-end workflow installation
2. **Credential Management** - Secure setup wizard integration
3. **Status Tracking** - Real-time installation progress

### **Medium Term (Next Month)**
1. **Advanced Gallery Features** - Search, filtering, categories
2. **Tenant Branding** - Full white-label customization
3. **Analytics Dashboard** - Usage metrics and insights

---

## 🔧 Configuration & Environment

### **Required Environment Variables**
```env
# n8n Integration
N8N_MASTER_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Master repository access
N8N_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...        # Tenant n8n instance access

# Database connections (inherited from main config)
DATABASE_URL=postgresql://doadmin:AVNS_60oX1gbkyUjUxv2y63s@db-postgresql...

# Authentication (inherited from main config)  
CLERK_SECRET_KEY=sk_test_rO2T8TQz9ej...
SUPER_ADMIN_EMAILS=hermann@changemastr.com,service@changemastr.com
```

### **n8n Infrastructure**
```
Master Repository: https://test.n8n.flomastr.com
Tenant Instances:  https://n8n-{tenant_slug}.flomastr.com  
Webhook Base:      https://webhooks.flomastr.com/{tenant_slug}
```

### **Current Environment Setup**
- ✅ **Master n8n Repository** - `https://test.n8n.flomastr.com` (working)
- ✅ **API Authentication** - Master and tenant API keys configured
- 🔄 **Multi-tenant URLs** - Per-tenant n8n instances (in development)
- 📋 **Webhook Infrastructure** - Tenant-specific webhook routing (planned)

---

## 🔧 Developer Notes

### **Key Architectural Decisions**
1. **iframe Embedding** - Maintains n8n native UX while keeping users in branded environment
2. **Proxy Architecture** - Backend proxies n8n API calls for security and tenant isolation
3. **Template Enrichment** - Enhance n8n workflow data with FloMastr-specific metadata
4. **Webhook Integration** - n8n notifies FloMastr of installation status changes

### **Security Considerations**
- **API Key Encryption** - All n8n credentials encrypted at rest
- **Tenant Isolation** - Strict separation of n8n clusters per tenant
- **CORS Configuration** - Secure iframe communication
- **Webhook Validation** - Verify n8n webhook authenticity

The Workflow Gallery represents a **major competitive advantage** - turning complex n8n automation into a user-friendly, branded marketplace experience that drives tenant adoption and value realization.
