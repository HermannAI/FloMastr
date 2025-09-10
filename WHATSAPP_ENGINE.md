# WhatsApp Engine API Documentation

**Version**: 1.0  
**Last Updated**: September 10, 2025  
**Status**: Production Ready - Integrated with FastAPI Backend  

## 🔗 Integration Notice

The **WhatsApp Engine is fully integrated** within the main FastAPI backend at `engine.flomastr.com`. All WhatsApp functionality is accessible through the unified API surface.

## 📱 WhatsApp Engine Overview

### **Architecture**
The WhatsApp Engine provides centralized WhatsApp message processing for all FloMastr tenants through:

1. **Webhook Ingestion** - Fast message receipt and queuing
2. **Persistent Job Queue** - PostgreSQL-backed reliability  
3. **Asynchronous Processing** - n8n workers handle business logic
4. **Message Dispatch** - Reliable outbound message delivery

### **Data Flow**
```
InfoBip/WABA → engine.flomastr.com/webhook/inbound → PostgreSQL jobs table
                                                           ↓
InfoBip/WABA ← engine.flomastr.com/messages/send ← n8n worker processes job
```

## 🛠️ API Endpoints

### **1. Health Check**
```http
GET https://engine.flomastr.com/
```

**Response:**
```json
{
  "status": "healthy",
  "service": "whatsapp-engine", 
  "queue_size": 0,
  "uptime": "2h 15m",
  "version": "1.0.0"
}
```

### **2. Inbound Message Webhook**
```http
POST https://engine.flomastr.com/webhook/inbound
Content-Type: application/json
Authorization: Bearer {BACKEND_API_SECRET_TOKEN}
```

**Request Payload:**
```json
{
  "from": "+1234567890",
  "to": "+1987654321", 
  "message": {
    "text": "Hello, I need help with my order"
  },
  "timestamp": "2025-09-10T10:30:00Z",
  "message_id": "wamid.xxxxx",
  "tenant_id": "whappstream",
  "contact_name": "John Doe"
}
```

**Response:**
```json
{
  "status": "accepted",
  "job_id": "123e4567-e89b-12d3-a456-426614174000",
  "queue_position": 1,
  "estimated_processing_time": "2-5 seconds"
}
```

### **3. Job Queue Polling** 
```http
GET https://engine.flomastr.com/queue/next-job
Authorization: Bearer {BACKEND_API_SECRET_TOKEN}
```

**Response (Job Available):**
```json
{
  "job_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "processing",
  "payload": {
    "from": "+1234567890",
    "message": "Hello, I need help with my order",
    "tenant_id": "whappstream", 
    "contact_name": "John Doe",
    "timestamp": "2025-09-10T10:30:00Z"
  },
  "created_at": "2025-09-10T10:30:00Z",
  "processing_started_at": "2025-09-10T10:30:02Z"
}
```

**Response (No Jobs):**
```json
{
  "status": "no_jobs",
  "queue_size": 0,
  "next_poll_recommended": "5s"
}
```

### **4. Send Outbound Message**
```http
POST https://engine.flomastr.com/messages/send
Content-Type: application/json
Authorization: Bearer {BACKEND_API_SECRET_TOKEN}
```

**Request Payload:**
```json
{
  "to": "+1234567890",
  "message": {
    "text": "Thank you for your inquiry! Your order #12345 is being processed."
  },
  "tenant_id": "whappstream",
  "reply_to_message_id": "wamid.xxxxx"
}
```

**Response:**
```json
{
  "status": "sent",
  "message_id": "wamid.yyyyy",
  "delivery_status": "dispatched",
  "sent_at": "2025-09-10T10:30:05Z",
  "provider": "infobip"
}
```

### **5. Job Status Check**
```http
GET https://engine.flomastr.com/queue/job/{job_id}
Authorization: Bearer {BACKEND_API_SECRET_TOKEN}
```

**Response:**
```json
{
  "job_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "completed",
  "created_at": "2025-09-10T10:30:00Z",
  "processing_started_at": "2025-09-10T10:30:02Z", 
  "completed_at": "2025-09-10T10:30:05Z",
  "processing_duration_ms": 3000,
  "result": {
    "message_sent": true,
    "response_message_id": "wamid.yyyyy"
  }
}
```

## 🔐 Authentication

All WhatsApp Engine endpoints require the `BACKEND_API_SECRET_TOKEN` for authentication:

```http
Authorization: Bearer {BACKEND_API_SECRET_TOKEN}
```

This token is shared between:
- InfoBip → WhatsApp Engine (inbound webhooks)
- n8n Workers → WhatsApp Engine (job polling & message sending)
- Internal FloMastr services

## 📊 Database Schema

### **Jobs Table**
```sql
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'queued',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
```

### **Job Status Values**
- `queued` - Newly created, awaiting processing
- `processing` - Picked up by n8n worker
- `completed` - Successfully processed
- `failed` - Processing failed (retry possible)
- `expired` - Job expired before processing

## 🔄 Integration with Existing Systems

### **Conversations API Integration**
The WhatsApp Engine integrates with the existing `/api/v1/conversations/ingest` endpoint:

```http
POST https://engine.flomastr.com/routes/api/v1/conversations/ingest
```

This handles:
- Contact management (hot/cold storage)
- Message archival 
- Thread management
- Tenant resolution

### **n8n Worker Integration**
Each tenant's n8n instance acts as a WhatsApp job worker:

1. **Polls for jobs** every 2-5 seconds
2. **Processes business logic** (knowledge retrieval, workflow execution)
3. **Sends response** via message send API
4. **Updates job status** to completed

### **Tenant Settings Integration**
WABA credentials are managed through tenant settings:

```http
GET https://engine.flomastr.com/routes/tenants/{tenant_id}/whatsapp-settings
PUT https://engine.flomastr.com/routes/tenants/{tenant_id}/whatsapp-settings
```

## 🌐 WABA Provider Support

### **Current Provider: InfoBip**
- **Status**: Testing phase
- **Contact**: Stipe (InfoBip representative)
- **Model**: Pay-as-you-go
- **Integration**: Direct API integration

### **Multi-Provider Architecture**
```json
{
  "tenant_id": "whappstream",
  "whatsapp_provider": "infobip",
  "provider_config": {
    "api_key": "encrypted_key",
    "api_secret": "encrypted_secret", 
    "phone_number_id": "1234567890",
    "webhook_verify_token": "verify_token"
  }
}
```

### **Supported Providers (Architecture Ready)**
- ✅ InfoBip (testing)
- 📋 Meta Direct API 
- 📋 Twilio WhatsApp
- 📋 Custom BSP integrations

## 🚀 Performance & Reliability

### **Message Processing SLA**
- **Webhook Response**: < 200ms
- **Job Processing**: 2-5 seconds average
- **Message Delivery**: < 3 seconds end-to-end

### **Reliability Features**
- **Persistent Queue**: PostgreSQL ensures no message loss
- **Job Retry Logic**: Failed jobs can be reprocessed
- **Health Monitoring**: Queue size and processing time metrics
- **Graceful Degradation**: System continues with provider failures

### **Scalability**
- **Horizontal Scaling**: Multiple n8n workers per tenant
- **Queue Sharding**: PostgreSQL partitioning for high volume
- **Provider Load Balancing**: Multiple WABA providers per tenant

---

## 🔧 Development & Testing

### **Local Development**
```bash
# Start WhatsApp Engine (integrated in FastAPI)
cd backend
python main.py

# Test webhook ingestion
curl -X POST https://engine.flomastr.com/webhook/inbound \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${BACKEND_API_SECRET_TOKEN}" \
  -d '{"from":"+1234567890","message":"test","tenant_id":"whappstream"}'

# Poll for jobs (n8n worker simulation)
curl -X GET https://engine.flomastr.com/queue/next-job \
  -H "Authorization: Bearer ${BACKEND_API_SECRET_TOKEN}"
```

### **Monitoring Commands**
```bash
# Check queue status
curl https://engine.flomastr.com/

# Monitor job processing
psql $DATABASE_URL -c "SELECT status, COUNT(*) FROM jobs GROUP BY status;"

# Check recent activity
psql $DATABASE_URL -c "SELECT * FROM jobs ORDER BY created_at DESC LIMIT 10;"
```

The WhatsApp Engine provides a robust, scalable foundation for all WhatsApp messaging within the FloMastr platform! 🚀
