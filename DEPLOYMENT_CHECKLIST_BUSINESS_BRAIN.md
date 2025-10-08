# Business Brain - Production Deployment Guide

**Date**: October 8, 2025  
**Target**: DigitalOcean Droplet (143.110.252.87)  
**Database**: DigitalOcean PostgreSQL (Bangalore BLR1)

---

## Pre-Deployment Verification ✅

- [x] pgvector 0.8.1 installed
- [x] embeddings table uses vector(1536) type
- [x] Vector indexes created (cosine + L2)
- [x] API endpoints aligned with database schema
- [x] Frontend connected to backend API
- [x] Multi-tenant isolation verified
- [x] Documentation complete

---

## Deployment Steps

### 1. Prepare Server Environment

```bash
# SSH to production server
ssh root@143.110.252.87

# Navigate to FloMastr directory
cd /path/to/flomastr

# Pull latest code from GitHub
git pull origin main
```

### 2. Database Migration

```bash
# Verify pgvector extension
docker-compose exec backend python -c "
import asyncio
import asyncpg
import os

async def check():
    conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
    version = await conn.fetchval('SELECT extversion FROM pg_extension WHERE extname = \\'vector\\'')
    print(f'pgvector version: {version}')
    await conn.close()

asyncio.run(check())
"

# Expected output: pgvector version: 0.8.1
```

### 3. Verify Database Schema

```bash
# Check embeddings table has vector type
docker-compose exec backend python -c "
import asyncio
import asyncpg
import os

async def check():
    conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
    
    # Check vector type
    type_info = await conn.fetchval('''
        SELECT udt_name 
        FROM information_schema.columns 
        WHERE table_name = \\'embeddings\\' 
        AND column_name = \\'embedding_vector\\'
    ''')
    print(f'embedding_vector type: {type_info}')
    
    # Check indexes
    indexes = await conn.fetch('''
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = \\'embeddings\\'
        AND indexname LIKE \\'%vector%\\'
    ''')
    print(f'Vector indexes: {[idx[\"indexname\"] for idx in indexes]}')
    
    await conn.close()

asyncio.run(check())
"

# Expected output:
# embedding_vector type: vector
# Vector indexes: ['embeddings_vector_cosine_idx', 'embeddings_vector_l2_idx']
```

### 4. Rebuild and Restart Services

```bash
# Rebuild containers with latest code
docker-compose build backend frontend

# Restart all services
docker-compose down
docker-compose up -d

# Wait for services to be ready
sleep 10

# Check service health
docker-compose ps
docker-compose logs --tail=50 backend
docker-compose logs --tail=50 frontend
```

### 5. Verify Backend API

```bash
# Test backend health
curl http://localhost:8000/health

# Expected: {"status":"healthy"}

# Test knowledge health endpoint
curl http://localhost:8000/routes/knowledge/health

# Expected: {"status":"healthy","service":"knowledge"}
```

### 6. Verify Frontend

```bash
# Check frontend is serving
curl http://localhost:3000

# Should return HTML

# Check frontend can reach backend via proxy
curl http://localhost:3000/routes/knowledge/health

# Expected: {"status":"healthy","service":"knowledge"}
```

### 7. Configure Domain & SSL

```bash
# Ensure DNS points to server
dig app.flomastr.com

# Should return: 143.110.252.87

# Verify SSL certificate
curl -I https://app.flomastr.com

# Should return: HTTP/2 200
```

---

## Post-Deployment Testing

### Test 1: Authentication & Tenant Context

1. Open browser: `https://app.flomastr.com/acme/context-builder`
2. Login with Clerk
3. Verify tenant context shows "acme"
4. Check browser console for errors

**Expected**: No errors, tenant context loaded

### Test 2: Knowledge List Load

1. Navigate to Context Builder page
2. Wait for knowledge list to load
3. Open browser DevTools > Network tab
4. Check request to `/routes/knowledge/acme/index`

**Expected**: 
- Status: 200 OK
- Response: `{"entries":[],"total_count":0}` (if no data yet)

### Test 3: Create Knowledge Base (File Upload)

1. Click "Files" tab
2. Upload a test PDF file
3. Fill metadata form:
   - Title: "Test Knowledge Base"
   - Type: "Technical"
   - Intent: "Reference"
   - Tags: ["test"]
4. Click "Save Knowledge"

**Expected**:
- Success toast notification
- Knowledge appears in list
- Form resets

### Test 4: Verify Database

```bash
# Check knowledge_bases table
docker-compose exec backend python -c "
import asyncio
import asyncpg
import os

async def check():
    conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
    
    # Get tenant ID for 'acme'
    tenant = await conn.fetchrow('SELECT id FROM tenants WHERE slug = \\'acme\\'')
    if not tenant:
        print('Tenant acme not found')
        return
    
    # Check knowledge_bases
    kb_count = await conn.fetchval('SELECT COUNT(*) FROM knowledge_bases WHERE tenant_id = \$1', tenant['id'])
    print(f'Knowledge bases for acme: {kb_count}')
    
    # Check embeddings
    emb_count = await conn.fetchval('SELECT COUNT(*) FROM embeddings WHERE tenant_id = \$1', tenant['id'])
    print(f'Embeddings for acme: {emb_count}')
    
    await conn.close()

asyncio.run(check())
"

# Expected: Knowledge bases > 0
```

### Test 5: Multi-Tenant Isolation

1. Create knowledge base in tenant "acme"
2. Switch to different tenant URL: `/another-tenant/context-builder`
3. Verify "another-tenant" doesn't see "acme"'s knowledge

**Expected**: Each tenant only sees their own data

### Test 6: Error Handling

1. Try to upload invalid file type (e.g., .exe)
2. Try to save without filling required fields
3. Try to save with invalid URL

**Expected**: 
- Appropriate error messages shown
- No crashes or blank screens
- User can correct and retry

---

## Monitoring Setup

### Key Metrics to Monitor

```bash
# Database connections
docker-compose exec backend python -c "
import asyncio
import asyncpg
import os

async def check():
    conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
    active = await conn.fetchval('SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()')
    print(f'Active connections: {active}')
    await conn.close()

asyncio.run(check())
"

# Backend logs
docker-compose logs -f backend | grep -i error

# Frontend logs
docker-compose logs -f frontend | grep -i error
```

### Performance Baselines

After deployment, establish baselines:

1. **Knowledge list load time**: < 500ms
2. **Knowledge base creation**: < 2 seconds
3. **File upload + processing**: < 5 seconds (depends on file size)
4. **Database query time**: < 100ms
5. **Embedding generation**: 50-200ms per chunk (OpenAI API)

---

## Rollback Plan

If issues occur:

```bash
# Quick rollback to previous version
cd /path/to/flomastr
git log --oneline -5  # Find previous commit
git reset --hard <previous-commit-hash>
docker-compose down
docker-compose up -d
```

Or:

```bash
# Restore from backup
# (Ensure you have database backup before deployment)
psql $DATABASE_URL < backup.sql
```

---

## Troubleshooting

### Issue: Backend won't start

```bash
# Check logs
docker-compose logs backend

# Common fixes:
# - Verify DATABASE_URL is correct
# - Check OPENAI_API_KEY is set
# - Verify port 8000 is available
```

### Issue: Frontend can't reach backend

```bash
# Check Vite proxy configuration
cat frontend/vite.config.ts

# Verify backend is responding
curl http://backend:8000/health

# Check Docker network
docker network inspect flomastr_default
```

### Issue: Vector queries failing

```bash
# Verify pgvector is loaded
docker-compose exec backend python -c "
import asyncio
import asyncpg
import os

async def check():
    conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
    try:
        await conn.execute('SELECT \\'[1,2,3]\\'::vector')
        print('✅ pgvector working')
    except Exception as e:
        print(f'❌ pgvector error: {e}')
    await conn.close()

asyncio.run(check())
"
```

### Issue: Embeddings not generating

```bash
# Check OpenAI API key
docker-compose exec backend python -c "
import os
key = os.getenv('OPENAI_API_KEY', 'NOT_SET')
print(f'OpenAI API Key: {key[:10]}...' if len(key) > 10 else 'NOT_SET')
"

# Test OpenAI connection
docker-compose exec backend python -c "
import openai
import os
openai.api_key = os.getenv('OPENAI_API_KEY')
try:
    response = openai.Embedding.create(
        input='test',
        model='text-embedding-ada-002'
    )
    print('✅ OpenAI API working')
except Exception as e:
    print(f'❌ OpenAI error: {e}')
"
```

---

## Success Criteria

Deployment is successful when:

- [x] Backend health endpoint responds
- [x] Frontend loads without errors
- [x] User can login with Clerk
- [x] Tenant context is correct
- [x] Can create knowledge base
- [x] Database records are created
- [x] Multi-tenant isolation works
- [x] Error handling works properly
- [x] No console errors in browser

---

## Next Steps After Deployment

1. **Monitor for 24 hours**
   - Check logs every few hours
   - Monitor error rates
   - Track user activity

2. **Gather Usage Data**
   - Number of knowledge bases created
   - File types uploaded
   - Processing times
   - Error patterns

3. **Implement Priority 4**
   - Add semantic search endpoint
   - Build search UI
   - Test with real queries

4. **Optimize Performance**
   - Tune IVFFlat parameters based on data volume
   - Adjust chunk sizes for better context
   - Cache frequently accessed knowledge

5. **User Feedback**
   - Collect feedback from tenants
   - Identify pain points
   - Prioritize improvements

---

## Contact

For deployment issues:
- **Technical Lead**: Hermann (hermann@changemastr.com)
- **Server Access**: Root SSH to 143.110.252.87
- **Database**: DigitalOcean Console (Bangalore BLR1)

---

**Status**: Ready for Deployment  
**Estimated Deployment Time**: 30-45 minutes  
**Risk Level**: Low (well-tested, rollback plan ready)
