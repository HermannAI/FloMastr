# Relational Pulse: Proactive Customer Engagement

**Version**: 1.0  
**Last Updated**: September 10, 2025  
**Status**: Production Ready Blueprint - Integrated with FloMastr Architecture  

## 🎯 Product Overview

**Relational Pulse** is FloMastr's proactive customer engagement system that sends weekly, highly-personalized, and contextual updates to every user in a tenant's WhatsApp channel. It transforms traditional one-way communication into continuous, meaningful conversations by leveraging our existing Business Brain, Data Engine, and WhatsApp Engine infrastructure.

### **Core Value Proposition**
Transform your WhatsApp Business from a reactive support channel into a **proactive relationship-building platform** that nurtures customer relationships with personalized, contextual communications.

## 🏗️ Architecture Integration

Relational Pulse is **fully integrated** within FloMastr's existing infrastructure:

- **Business Brain**: Contextual knowledge retrieval per user
- **Data Engine**: Real-time customer data integration
- **WhatsApp Engine**: Reliable message delivery infrastructure
- **n8n Workers**: Automated workflow execution per tenant

### **Service Architecture**
```
┌─────────────────────────────────────────────────────┐
│             Relational Pulse Workflow               │
│              (n8n per tenant)                       │
└─────────────────────────────────────────────────────┘
              │              │              │
        ┌─────────┐    ┌─────────┐    ┌─────────────┐
        │Business │    │Data     │    │WhatsApp     │
        │Brain    │    │Engine   │    │Engine       │
        │Context  │    │Customer │    │Message      │
        │API      │    │Data API │    │Delivery     │
        └─────────┘    └─────────┘    └─────────────┘
```

## 🔄 Relational Pulse Workflow Architecture

### **Complete Workflow Process**
```
1. Cron Trigger → 2. Get Users → 3. Get Context → 4. Synthesize → 5. Send Messages
    (Weekly)      (Data Engine)   (Business Brain)   (AI Synthesis)  (WhatsApp Engine)
```

### **Detailed Node-by-Node Implementation**

#### **Node 1: Relational Pulse Trigger (Cron)**
```json
{
  "name": "Relational Pulse Trigger",
  "type": "cron",
  "parameters": {
    "rule": {
      "type": "time",
      "hour": 9,
      "minute": 0,
      "dayOfWeek": 1,
      "timezone": "{{$tenant.timezone}}"
    }
  },
  "notes": "Triggers weekly pulse every Monday at 9 AM tenant time"
}
```

**Configuration Options:**
- **Frequency**: Weekly (configurable day/time per tenant)
- **Timezone**: Tenant-specific timezone support
- **Scheduling**: Respects tenant business hours and preferences

#### **Node 2: Get All Active Users (HTTP Request)**
```json
{
  "name": "Get All Users",
  "type": "http_request",
  "parameters": {
    "method": "GET",
    "url": "https://engine.flomastr.com/routes/tenants/{{$tenant.id}}/pulse/users",
    "headers": {
      "Authorization": "Bearer {{$credentials.backend_token}}",
      "Content-Type": "application/json"
    }
  }
}
```

**API Response:**
```json
{
  "users": [
    {
      "user_id": "contact_123",
      "whatsapp_number": "+1234567890",
      "name": "John Doe",
      "last_interaction": "2025-09-03T14:30:00Z",
      "pulse_preferences": {
        "enabled": true,
        "frequency": "weekly",
        "topics": ["product_updates", "tips", "industry_news"]
      },
      "customer_context": {
        "segment": "premium",
        "purchase_history": ["product_a", "service_b"],
        "interests": ["automation", "productivity"]
      }
    }
  ],
  "total_count": 150,
  "active_count": 142
}
```

#### **Node 3: Get Contextual Updates (HTTP Request - Loop)**
```json
{
  "name": "Get Contextual Update",
  "type": "http_request",
  "parameters": {
    "method": "POST",
    "url": "https://engine.flomastr.com/routes/context/pulse-content",
    "headers": {
      "Authorization": "Bearer {{$credentials.backend_token}}",
      "Content-Type": "application/json"
    },
    "body": {
      "tenant_id": "{{$tenant.id}}",
      "user_id": "{{$json.user_id}}",
      "user_context": "{{$json.customer_context}}",
      "preferences": "{{$json.pulse_preferences}}",
      "content_types": ["tips", "updates", "reminders", "industry_insights"],
      "max_items": 3
    }
  }
}
```

**API Response:**
```json
{
  "contextual_content": [
    {
      "type": "tip",
      "title": "Automation Tip for Your Workflow",
      "content": "Based on your recent questions about order tracking, here's how to set up automated status updates...",
      "relevance_score": 0.95,
      "source": "knowledge_base"
    },
    {
      "type": "update", 
      "title": "New Feature: Real-time Inventory Checks",
      "content": "You can now ask about product availability in real-time...",
      "relevance_score": 0.88,
      "source": "product_updates"
    }
  ],
  "user_insights": {
    "recent_topics": ["order_tracking", "inventory_management"],
    "engagement_level": "high",
    "preferred_content_style": "concise_with_examples"
  }
}
```

#### **Node 4: Synthesize Personalized Message (HTTP Request)**
```json
{
  "name": "Synthesize Message",
  "type": "http_request", 
  "parameters": {
    "method": "POST",
    "url": "https://engine.flomastr.com/routes/tools/synthesis",
    "headers": {
      "Authorization": "Bearer {{$credentials.backend_token}}",
      "Content-Type": "application/json"
    },
    "body": {
      "context": "{{$json.contextual_content}}",
      "user_profile": {
        "name": "{{$json.name}}",
        "preferences": "{{$json.pulse_preferences}}",
        "insights": "{{$json.user_insights}}"
      },
      "message_template": {
        "tone": "friendly_professional",
        "max_length": 300,
        "include_call_to_action": true,
        "personalization_level": "high"
      },
      "tenant_branding": "{{$tenant.branding_settings}}"
    }
  }
}
```

**API Response:**
```json
{
  "synthesized_message": "Hi John! \n\nHope your week is off to a great start! Based on your recent questions about order tracking, I thought you'd love this tip: You can now get real-time inventory checks by simply asking 'Is [product] in stock?' \n\nAlso exciting news - we've just launched automated status updates that I think would save you time!\n\nAny questions about your current orders or our new features? Just reply and I'm here to help! \n\nBest,\nYour WhappStream Assistant",
  "personalization_elements": [
    "user_name",
    "recent_interaction_context", 
    "relevant_feature_suggestion",
    "conversational_tone"
  ],
  "estimated_engagement_score": 0.87
}
```

#### **Node 5: Send WhatsApp Message (HTTP Request)**
```json
{
  "name": "Send WhatsApp Message",
  "type": "http_request",
  "parameters": {
    "method": "POST", 
    "url": "https://engine.flomastr.com/messages/send",
    "headers": {
      "Authorization": "Bearer {{$credentials.backend_token}}",
      "Content-Type": "application/json"
    },
    "body": {
      "to": "{{$json.whatsapp_number}}",
      "message": {
        "text": "{{$json.synthesized_message}}"
      },
      "tenant_id": "{{$tenant.id}}",
      "message_type": "relational_pulse",
      "campaign_id": "pulse_{{$execution.startedAt | date('YYYY-MM-DD')}}"
    }
  }
}
```

## 🎯 Content Personalization Engine

### **Contextual Content Sources**
```
Business Brain Integration:
├── Knowledge Base Articles (personalized recommendations)
├── Product Updates (based on user purchase history)
├── Tips & Best Practices (relevant to user's questions)
└── Industry Insights (matched to user interests)

Data Engine Integration:
├── Customer Purchase History
├── Recent Interaction Topics  
├── Support Ticket Patterns
├── Product Usage Analytics
└── Engagement Preferences

External Data Sources:
├── Industry News APIs
├── Weather/Local Events
├── Seasonal Promotions
└── Company Calendar Events
```

### **Message Personalization Layers**

#### **Layer 1: User Context**
- **Name personalization**: "Hi [FirstName]!"
- **Interaction history**: "Based on your recent question about..."
- **Purchase context**: "Since you're using [Product]..."
- **Engagement style**: Adapt tone to user's communication style

#### **Layer 2: Content Relevance**
- **Topic matching**: Content relevant to user's recent inquiries
- **Difficulty level**: Match complexity to user's expertise level  
- **Content format**: Tips, updates, reminders based on preferences
- **Timing relevance**: Season, events, business cycles

#### **Layer 3: Tenant Branding**
- **Brand voice**: Consistent with tenant's communication style
- **Visual elements**: Formatting matching brand personality
- **Call-to-action**: Aligned with tenant's business objectives
- **Compliance**: Respect tenant's regulatory requirements

## 📊 Pulse Analytics & Optimization

### **Performance Metrics**
```sql
-- Pulse campaign analytics
CREATE TABLE pulse_campaigns (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    campaign_date DATE NOT NULL,
    total_users INTEGER,
    messages_sent INTEGER,
    delivery_rate FLOAT,
    open_rate FLOAT,
    response_rate FLOAT,
    engagement_score FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual message tracking
CREATE TABLE pulse_messages (
    id UUID PRIMARY KEY,
    campaign_id UUID REFERENCES pulse_campaigns(id),
    user_id VARCHAR(255),
    whatsapp_number VARCHAR(20),
    message_content TEXT,
    personalization_score FLOAT,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ
);
```

### **Success Metrics Dashboard**
- **Delivery Rate**: Percentage of messages successfully delivered
- **Open Rate**: Estimated based on WhatsApp read receipts
- **Response Rate**: Users who reply within 48 hours
- **Engagement Score**: Composite metric of interaction quality
- **Content Relevance**: User feedback on message value

### **A/B Testing Framework**
```json
{
  "test_variations": [
    {
      "name": "personal_tone",
      "message_style": "highly_personal",
      "user_percentage": 50
    },
    {
      "name": "professional_tone", 
      "message_style": "professional_friendly",
      "user_percentage": 50
    }
  ],
  "success_metrics": ["response_rate", "engagement_score"],
  "test_duration": "4_weeks"
}
```

## 🔐 Privacy & Compliance

### **User Consent Management**
```json
{
  "pulse_preferences": {
    "enabled": true,
    "frequency": "weekly",
    "opt_in_date": "2025-09-01T10:00:00Z",
    "opt_in_method": "explicit_consent",
    "topics": ["product_updates", "tips"],
    "data_usage_consent": true,
    "easy_opt_out": true
  }
}
```

### **GDPR/Privacy Compliance**
- **Explicit Consent**: Users must opt-in to receive Relational Pulse messages
- **Easy Opt-out**: One-click unsubscribe via "STOP" message
- **Data Minimization**: Only use necessary data for personalization
- **Retention Limits**: Automatic cleanup of old pulse analytics data
- **User Rights**: Support for data export and deletion requests

### **Rate Limiting & Anti-Spam**
- **Frequency Caps**: Maximum one pulse message per user per week
- **Business Hours**: Respect user's timezone and business hours
- **Engagement Monitoring**: Reduce frequency for non-responsive users
- **Quality Scoring**: Maintain high message relevance scores

## 🚀 Implementation Guide

### **Phase 1: Tenant Onboarding**
1. **Pulse Configuration**: Enable Relational Pulse in tenant settings
2. **Content Customization**: Define brand voice and message templates
3. **User Opt-in Campaign**: Collect explicit consent from existing users
4. **Scheduling Setup**: Configure optimal send times per tenant

### **Phase 2: Content Engine Integration**
1. **Business Brain Enhancement**: Optimize content retrieval for pulse context
2. **Data Engine Connections**: Connect to customer data sources
3. **Personalization Training**: Fine-tune AI synthesis for tenant's voice
4. **Quality Assurance**: Test message quality and relevance

### **Phase 3: Production Deployment**
1. **Workflow Installation**: Deploy n8n pulse workflows per tenant
2. **Monitoring Setup**: Real-time analytics and alert systems
3. **Performance Optimization**: Monitor and optimize delivery rates
4. **Feedback Loop**: Implement user feedback collection

### **Phase 4: Scale & Optimization**
1. **A/B Testing**: Continuous optimization of message content
2. **Advanced Personalization**: Machine learning for better targeting
3. **Multi-channel Expansion**: Extend beyond WhatsApp to email/SMS
4. **Predictive Analytics**: Anticipate optimal send times and content

## 🛠️ Technical Configuration

### **Tenant Settings Integration**
```http
PUT https://engine.flomastr.com/routes/tenants/{tenant_id}/pulse-settings
```

**Configuration Payload:**
```json
{
  "relational_pulse": {
    "enabled": true,
    "schedule": {
      "frequency": "weekly",
      "day_of_week": "monday",
      "time": "09:00",
      "timezone": "America/New_York"
    },
    "content_settings": {
      "max_message_length": 300,
      "tone": "friendly_professional",
      "include_emojis": false,
      "include_call_to_action": true,
      "content_types": ["tips", "updates", "reminders"]
    },
    "targeting": {
      "min_engagement_score": 0.3,
      "exclude_recent_purchasers": false,
      "respect_user_preferences": true
    },
    "compliance": {
      "require_explicit_consent": true,
      "honor_opt_outs": true,
      "business_hours_only": true
    }
  }
}
```

### **n8n Workflow Template**
```json
{
  "name": "Relational Pulse - {{tenant.name}}",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [{"field": "cronExpression", "value": "0 9 * * 1"}]
        }
      },
      "type": "n8n-nodes-base.cron",
      "position": [240, 300],
      "name": "Weekly Pulse Trigger"
    },
    {
      "parameters": {
        "method": "GET",
        "url": "https://engine.flomastr.com/routes/tenants/{{$env.TENANT_ID}}/pulse/users"
      },
      "type": "n8n-nodes-base.httpRequest", 
      "position": [440, 300],
      "name": "Get Active Users"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://engine.flomastr.com/routes/context/pulse-content"
      },
      "type": "n8n-nodes-base.httpRequest",
      "position": [640, 300], 
      "name": "Get Contextual Content"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://engine.flomastr.com/routes/tools/synthesis"
      },
      "type": "n8n-nodes-base.httpRequest",
      "position": [840, 300],
      "name": "Synthesize Message"
    },
    {
      "parameters": {
        "method": "POST", 
        "url": "https://engine.flomastr.com/messages/send"
      },
      "type": "n8n-nodes-base.httpRequest",
      "position": [1040, 300],
      "name": "Send WhatsApp Message"
    }
  ]
}
```

---

## 🔧 Development & Testing

### **Local Testing Commands**
```bash
# Test pulse user retrieval
curl -X GET "https://engine.flomastr.com/routes/tenants/test-tenant/pulse/users" \
  -H "Authorization: Bearer ${BACKEND_API_SECRET_TOKEN}"

# Test contextual content generation
curl -X POST "https://engine.flomastr.com/routes/context/pulse-content" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id":"test-tenant","user_id":"test-user","preferences":{}}'

# Test message synthesis
curl -X POST "https://engine.flomastr.com/routes/tools/synthesis" \
  -H "Content-Type: application/json" \
  -d '{"context":[],"user_profile":{"name":"Test User"}}'
```

### **Monitoring & Analytics**
```bash
# Check pulse campaign performance
psql $DATABASE_URL -c "SELECT * FROM pulse_campaigns ORDER BY campaign_date DESC LIMIT 5;"

# Monitor message delivery rates
psql $DATABASE_URL -c "
  SELECT 
    campaign_date,
    delivery_rate,
    response_rate,
    engagement_score
  FROM pulse_campaigns 
  WHERE tenant_id = 'whappstream'
  ORDER BY campaign_date DESC;
"
```

**Relational Pulse** transforms FloMastr into a true **Relational AI Partner** that proactively nurtures customer relationships through personalized, contextual, and valuable weekly communications!
