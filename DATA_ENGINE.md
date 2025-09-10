# Data Engine Architecture

**Version**: 1.0  
**Last Updated**: September 10, 2025  
**Status**: Production Ready - Integrated with WhatsApp Engine & n8n Workers  

## 🔗 Architecture Integration

The **Data Engine** is fully integrated within FloMastr's existing infrastructure, leveraging our WhatsApp Engine job queue system and tenant-specific n8n workers for secure, real-time data lookups.

## 🎯 Overview & Purpose

The **Data Engine** is FloMastr's architectural framework for performing real-time, structured data lookups against tenant's internal databases, APIs, and business systems. It enables AI-powered customer service to answer specific, data-driven questions like:

- *"What is the status of my order #12345?"*
- *"When is my next appointment?"*  
- *"What's my account balance?"*
- *"Is product SKU-789 in stock?"*

### **Core Value Proposition**
Transform static knowledge bases into **dynamic, live data connections** that provide real-time business intelligence through conversational AI.

## 🏗️ Architectural Principles

### **1. Secure Abstraction Layer**
- **No Direct Exposure**: Tenant systems never exposed directly to the internet
- **n8n Proxy Layer**: Workers act as secure, authenticated intermediaries
- **Credential Isolation**: Each tenant's credentials stored securely per container

### **2. Real-Time Query Processing**
- **WhatsApp Engine Integration**: Leverages existing job queue infrastructure
- **Asynchronous Processing**: Non-blocking data lookups with response reliability
- **Multi-Source Support**: Connect to any database, API, or data source

### **3. Tenant Data Sovereignty**
- **Isolated Workers**: Each tenant's n8n container handles only their data
- **Credential Security**: Database/API credentials never leave tenant environment
- **Audit Trail**: All data access logged per tenant for compliance

## 🔄 Data Engine Flow Architecture

### **Complete Data Lookup Flow**
```
1. Customer Query → 2. WhatsApp Engine → 3. Job Queue (PostgreSQL)
                                              ↓
6. Customer Response ← 5. WhatsApp Engine ← 4. n8n Data Worker
                                              ↓
                                        7. Tenant's Internal Systems
                                           (Database/API/Google Sheets)
```

### **Detailed Flow Process**

#### **Step 1: Customer Query Ingestion**
```
Customer: "What is the status of order #12345?"
↓
WhatsApp → InfoBip → engine.flomastr.com/webhook/inbound
```

#### **Step 2: Data Engine Job Classification**
```python
# WhatsApp Engine job creation
{
  "job_type": "data_lookup",
  "tenant_id": "whappstream", 
  "query": "order status",
  "parameters": {
    "order_id": "12345",
    "customer_phone": "+1234567890"
  },
  "data_source": "crm_api"
}
```

#### **Step 3: n8n Worker Processing**
```
whappstream.n8n.flomastr.com worker:
1. Polls engine.flomastr.com/queue/next-job
2. Identifies data_lookup job type
3. Executes tenant-specific data workflow
```

#### **Step 4: Secure Data Retrieval**
```
n8n Worker → Tenant's CRM API:
GET https://tenant-crm.com/api/orders/12345
Authorization: Bearer {tenant_api_key}

Response:
{
  "order_id": "12345",
  "status": "shipped",
  "tracking": "UPS123456",
  "estimated_delivery": "2025-09-12"
}
```

#### **Step 5: Natural Language Response**
```
n8n Worker formats response:
"Your order #12345 has been shipped! 📦 
Tracking: UPS123456
Expected delivery: September 12th"
```

#### **Step 6: Customer Delivery**
```
n8n Worker → engine.flomastr.com/messages/send
→ InfoBip → WhatsApp → Customer
```

## 🛠️ Technical Components

### **1. WhatsApp Engine (Job Orchestration)**
- **Endpoint**: `https://engine.flomastr.com`
- **Role**: Job queue management and message routing
- **Integration**: Existing PostgreSQL jobs table with enhanced job types

#### **Data Engine Job Types**
```sql
-- Enhanced jobs table supports data lookup classification
INSERT INTO jobs (payload) VALUES ('{
  "job_type": "data_lookup",
  "tenant_id": "whappstream",
  "query_type": "order_status", 
  "customer_context": {...},
  "data_source_config": {...}
}');
```

### **2. n8n Data Workers (Execution Layer)**
- **Containers**: Tenant-specific isolated environments
- **Credentials**: Secure storage of database/API keys per tenant
- **Workflows**: Pre-configured data lookup templates

#### **Supported Data Sources**
```
n8n Worker Connections:
├── SQL Databases
│   ├── PostgreSQL (native node)
│   ├── MySQL (native node)
│   ├── SQL Server (native node)
│   └── SQLite (native node)
├── NoSQL Databases  
│   ├── MongoDB (native node)
│   ├── Redis (native node)
│   └── Elasticsearch (native node)
├── APIs & Services
│   ├── REST APIs (HTTP Request node)
│   ├── GraphQL (GraphQL node)
│   ├── SOAP APIs (HTTP Request node)
│   └── Custom webhooks
├── Cloud Platforms
│   ├── Google Sheets (Google Sheets node)
│   ├── Airtable (Airtable node)
│   ├── Salesforce (Salesforce node)
│   └── HubSpot (HubSpot node)
└── File Systems
    ├── CSV files (CSV node)
    ├── Excel files (Excel node)
    └── JSON files (JSON node)
```

### **3. Tenant Configuration System**
Integration with existing tenant settings for data source configuration:

```http
PUT https://engine.flomastr.com/routes/tenants/{tenant_id}/data-sources
```

**Configuration Example:**
```json
{
  "data_sources": [
    {
      "id": "primary_crm",
      "name": "Customer Database", 
      "type": "postgresql",
      "connection": {
        "host": "tenant-db.company.com",
        "database": "crm_prod",
        "username": "flomastr_readonly",
        "password": "encrypted_password"
      },
      "queries": {
        "order_status": "SELECT status, tracking_number FROM orders WHERE order_id = $1",
        "customer_orders": "SELECT * FROM orders WHERE customer_phone = $1"
      }
    },
    {
      "id": "inventory_api",
      "name": "Inventory System",
      "type": "rest_api", 
      "connection": {
        "base_url": "https://inventory.company.com/api",
        "api_key": "encrypted_api_key",
        "headers": {"Authorization": "Bearer {api_key}"}
      },
      "endpoints": {
        "check_stock": "/products/{sku}/stock",
        "product_details": "/products/{sku}"
      }
    }
  ]
}
```

## 🔐 Security & Compliance

### **Credential Management**
- **Encryption at Rest**: All tenant credentials encrypted in database
- **Container Isolation**: Credentials only accessible within tenant's n8n container
- **Rotation Support**: API keys and database passwords rotatable via tenant settings

### **Data Access Controls**
- **Read-Only Access**: Recommended for all data source connections
- **IP Whitelisting**: Tenant systems can whitelist FloMastr server IP
- **VPN Support**: n8n workers can connect through tenant VPNs

### **Audit & Compliance**
```sql
-- Data access logging
CREATE TABLE data_access_logs (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    data_source_id VARCHAR(255),
    query_type VARCHAR(100),
    customer_identifier VARCHAR(255),
    accessed_at TIMESTAMPTZ DEFAULT NOW(),
    response_time_ms INTEGER
);
```

## 📊 Data Engine Workflow Templates

### **1. Order Status Lookup**
```json
{
  "name": "Order Status Lookup",
  "trigger": "webhook",
  "nodes": [
    {
      "type": "webhook",
      "parameters": {"path": "/data/order-status"}
    },
    {
      "type": "postgresql", 
      "parameters": {
        "query": "SELECT status, tracking FROM orders WHERE order_id = $1",
        "values": ["{{$json.order_id}}"]
      }
    },
    {
      "type": "function",
      "parameters": {
        "code": "return formatOrderStatus(items[0].json);"
      }
    },
    {
      "type": "http_request",
      "parameters": {
        "url": "https://engine.flomastr.com/messages/send",
        "method": "POST"
      }
    }
  ]
}
```

### **2. Inventory Check**
```json
{
  "name": "Inventory Stock Check",
  "trigger": "webhook", 
  "nodes": [
    {
      "type": "webhook",
      "parameters": {"path": "/data/inventory-check"}
    },
    {
      "type": "http_request",
      "parameters": {
        "url": "https://api.tenant.com/inventory/{{$json.sku}}",
        "headers": {"Authorization": "Bearer {{$credentials.api_key}}"}
      }
    },
    {
      "type": "function",
      "parameters": {
        "code": "return formatStockResponse(items[0].json);"
      }
    },
    {
      "type": "http_request", 
      "parameters": {
        "url": "https://engine.flomastr.com/messages/send",
        "method": "POST"
      }
    }
  ]
}
```

### **3. Google Sheets Lookup**
```json
{
  "name": "Customer Data Lookup",
  "trigger": "webhook",
  "nodes": [
    {
      "type": "webhook", 
      "parameters": {"path": "/data/customer-lookup"}
    },
    {
      "type": "google_sheets",
      "parameters": {
        "spreadsheet_id": "{{$credentials.sheet_id}}",
        "range": "Customers!A:E",
        "filter": "phone = {{$json.customer_phone}}"
      }
    },
    {
      "type": "function",
      "parameters": {
        "code": "return formatCustomerData(items[0].json);"
      }
    },
    {
      "type": "http_request",
      "parameters": {
        "url": "https://engine.flomastr.com/messages/send", 
        "method": "POST"
      }
    }
  ]
}
```

## 🚀 Implementation Guide

### **Phase 1: Data Source Configuration**
1. **Tenant Onboarding**: Configure data sources via tenant settings
2. **Credential Setup**: Securely store database/API credentials
3. **Connection Testing**: Validate connectivity from n8n worker

### **Phase 2: Workflow Development**  
1. **Template Creation**: Build n8n workflows for common data queries
2. **Query Mapping**: Map customer questions to specific data lookups
3. **Response Formatting**: Create natural language response templates

### **Phase 3: Integration Testing**
1. **End-to-End Testing**: WhatsApp → Data Engine → Response flow
2. **Performance Validation**: Query response time optimization
3. **Error Handling**: Graceful degradation for data source failures

### **Phase 4: Production Deployment**
1. **Monitoring Setup**: Data access logging and performance metrics
2. **Scaling Configuration**: Multiple n8n workers for high volume
3. **Tenant Training**: Documentation and best practices

## 📈 Performance & Monitoring

### **Performance Targets**
- **Query Response Time**: < 3 seconds average
- **Data Source Availability**: 99.9% uptime SLA
- **Concurrent Queries**: 100+ simultaneous lookups per tenant

### **Monitoring Metrics**
```sql
-- Performance monitoring queries
SELECT 
    data_source_id,
    AVG(response_time_ms) as avg_response_time,
    COUNT(*) as query_count,
    DATE_TRUNC('hour', accessed_at) as hour
FROM data_access_logs 
WHERE accessed_at >= NOW() - INTERVAL '24 hours'
GROUP BY data_source_id, hour;
```

### **Error Handling & Fallbacks**
- **Connection Failures**: Graceful error messages to customers
- **Timeout Handling**: 10-second maximum query timeout
- **Fallback Responses**: Static knowledge base when data unavailable

---

## 🔧 Development & Testing

### **Local Development Setup**
```bash
# Test data source connection from n8n worker
curl -X POST https://whappstream.n8n.flomastr.com/webhook/data/test-connection \
  -H "Content-Type: application/json" \
  -d '{"data_source": "primary_crm", "test_query": "SELECT 1"}'

# Simulate data lookup job
curl -X POST https://engine.flomastr.com/webhook/inbound \
  -H "Authorization: Bearer ${BACKEND_API_SECRET_TOKEN}" \
  -d '{"from":"+1234567890","message":"Order status 12345","tenant_id":"whappstream"}'
```

### **Data Source Testing**
```javascript
// n8n function node for testing connectivity
function testDataSource(credentials, config) {
  try {
    const connection = createConnection(credentials);
    const result = connection.query(config.test_query);
    return {
      status: 'success',
      response_time: Date.now() - startTime,
      data: result
    };
  } catch (error) {
    return {
      status: 'error', 
      error: error.message,
      timestamp: new Date()
    };
  }
}
```

The Data Engine transforms FloMastr from a static knowledge platform into a **dynamic, real-time business intelligence interface** that connects customers directly to live business data through conversational AI! 🚀
