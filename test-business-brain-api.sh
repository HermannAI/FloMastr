#!/bin/bash

# Business Brain API Test Script
# Tests the knowledge management endpoints

echo "========================================"
echo "Business Brain API Test"
echo "========================================"
echo ""

# Configuration
BACKEND_URL="http://localhost:8000"
TENANT_SLUG="test-tenant"
USER_EMAIL="hermann@changemastr.com"

echo "📋 Configuration:"
echo "  Backend URL: $BACKEND_URL"
echo "  Tenant Slug: $TENANT_SLUG"
echo "  User Email: $USER_EMAIL"
echo ""

# Test 1: Health Check
echo "1️⃣  Testing Knowledge Health Endpoint..."
echo "   GET /routes/health"
HEALTH_RESPONSE=$(curl -s -X GET "$BACKEND_URL/routes/health" \
  -H "X-User-Email: $USER_EMAIL")

if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
  echo "   ✅ Health check passed"
  echo "   Response: $HEALTH_RESPONSE"
else
  echo "   ❌ Health check failed"
  echo "   Response: $HEALTH_RESPONSE"
fi
echo ""

# Test 2: Get Knowledge Index (should be empty initially)
echo "2️⃣  Testing Get Knowledge Index..."
echo "   GET /routes/$TENANT_SLUG/index"
INDEX_RESPONSE=$(curl -s -X GET "$BACKEND_URL/routes/$TENANT_SLUG/index" \
  -H "X-User-Email: $USER_EMAIL")

echo "   Response: $INDEX_RESPONSE"
if echo "$INDEX_RESPONSE" | grep -q "entries"; then
  echo "   ✅ Get index successful"
else
  echo "   ⚠️  Get index returned unexpected response"
fi
echo ""

# Test 3: Create Knowledge Base
echo "3️⃣  Testing Create Knowledge Base..."
echo "   POST /routes/$TENANT_SLUG/index"

CREATE_RESPONSE=$(curl -s -X POST "$BACKEND_URL/routes/$TENANT_SLUG/index" \
  -H "Content-Type: application/json" \
  -H "X-User-Email: $USER_EMAIL" \
  -d '{
    "title": "Test Knowledge Base",
    "content": "This is a test knowledge base created via API",
    "metadata": {
      "type": "General",
      "intent": "Reference",
      "tags": ["test", "api"],
      "source_type": "api"
    }
  }')

echo "   Response: $CREATE_RESPONSE"
if echo "$CREATE_RESPONSE" | grep -q "\"id\""; then
  echo "   ✅ Knowledge base created successfully"
  KB_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
  echo "   Knowledge Base ID: $KB_ID"
else
  echo "   ❌ Failed to create knowledge base"
fi
echo ""

# Test 4: Get Knowledge Index Again (should have 1 entry)
echo "4️⃣  Testing Get Knowledge Index (after create)..."
echo "   GET /routes/$TENANT_SLUG/index"
INDEX_RESPONSE_2=$(curl -s -X GET "$BACKEND_URL/routes/$TENANT_SLUG/index" \
  -H "X-User-Email: $USER_EMAIL")

echo "   Response: $INDEX_RESPONSE_2"
if echo "$INDEX_RESPONSE_2" | grep -q "Test Knowledge Base"; then
  echo "   ✅ Knowledge base appears in index"
else
  echo "   ⚠️  Knowledge base not found in index"
fi
echo ""

# Test 5: Update Knowledge Base (UPSERT)
echo "5️⃣  Testing Update Knowledge Base (UPSERT)..."
echo "   POST /routes/$TENANT_SLUG/index (same title)"

UPDATE_RESPONSE=$(curl -s -X POST "$BACKEND_URL/routes/$TENANT_SLUG/index" \
  -H "Content-Type: application/json" \
  -H "X-User-Email: $USER_EMAIL" \
  -d '{
    "title": "Test Knowledge Base",
    "content": "Updated content for test knowledge base",
    "metadata": {
      "type": "Policy",
      "intent": "Compliance",
      "tags": ["test", "api", "updated"],
      "source_type": "api"
    }
  }')

echo "   Response: $UPDATE_RESPONSE"
if echo "$UPDATE_RESPONSE" | grep -q "\"id\""; then
  echo "   ✅ Knowledge base updated successfully"
else
  echo "   ❌ Failed to update knowledge base"
fi
echo ""

# Summary
echo "========================================"
echo "Test Summary"
echo "========================================"
echo ""
echo "✅ All basic CRUD operations tested"
echo ""
echo "Next steps:"
echo "  1. Test file upload processing"
echo "  2. Test URL scraping"
echo "  3. Test embedding generation"
echo "  4. Test semantic search"
echo ""
echo "To view the created knowledge base in the database:"
echo "  docker-compose exec backend python -c \\"
echo "    import asyncio; import asyncpg; import os; \\
echo "    asyncio.run((lambda: \\
echo "      asyncpg.connect(os.getenv('DATABASE_URL')).then(lambda c: \\
echo "        c.fetch('SELECT * FROM knowledge_bases LIMIT 5')))())\\"
echo ""
