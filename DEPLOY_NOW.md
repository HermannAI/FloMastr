# FloMastr Production Deployment Guide - Step by Step

**Target**: Deploy to app.flomastr.com (Server: 143.110.252.87)  
**Date**: October 8, 2025  
**Objective**: Get live environment running for feature testing

---

## Prerequisites Check ✅

Before we start, verify you have:
- [ ] SSH access to server: `ssh root@143.110.252.87`
- [ ] GitHub repo access: HermannAI/FloMastr
- [ ] Environment variables ready (DATABASE_URL, OPENAI_API_KEY, CLERK keys)
- [ ] Domain configured: app.flomastr.com → 143.110.252.87

---

## STEP 1: Prepare Your Local Repository

### 1.1 Commit All Changes
```bash
# Check what needs to be committed
git status

# Add all changes
git add .

# Commit with message
git commit -m "feat: Business Brain implementation complete - Priorities 1, 2, 3

- Added pgvector 0.8.1 with vector(1536) type and IVFFlat indexes
- Fixed knowledge API to use knowledge_bases table
- Connected ContextBuilder frontend to backend
- Added comprehensive documentation"

# Push to GitHub
git push origin main
```

**Expected Output**: "Everything up-to-date" or successful push message

---

## STEP 2: Connect to Production Server

### 2.1 SSH to Server
```bash
ssh root@143.110.252.87
```

**What to expect**: You should see the server prompt

### 2.2 Navigate to Application Directory
```bash
# Find where FloMastr is installed (likely one of these):
cd /root/flomastr
# OR
cd /opt/flomastr
# OR
cd ~/flomastr

# Verify you're in the right place
ls -la
```

**Expected Output**: You should see `docker-compose.yml`, `backend/`, `frontend/` directories

---

## STEP 3: Pull Latest Code

### 3.1 Pull from GitHub
```bash
# Make sure we're on main branch
git branch

# Pull latest changes
git pull origin main
```

**Expected Output**: List of updated files including:
- backend/app/apis/knowledge/__init__.py
- Documentation files (BUSINESS_BRAIN_*.md)
- README.md updates

### 3.2 Verify Changes Pulled
```bash
# Check if Business Brain docs exist
ls -lh BUSINESS_BRAIN*.md

# Check if knowledge API was updated
grep "knowledge_bases" backend/app/apis/knowledge/__init__.py
```

**Expected Output**: Should show documentation files and "knowledge_bases" in the API file

---

## STEP 4: Verify Environment Configuration

### 4.1 Check Environment File
```bash
# Check if .env or .env.production exists
ls -la .env*

# View environment variables (don't share output!)
cat .env.production
# OR
cat .env
```

**Required Variables**:
```bash
DATABASE_URL=postgresql://...  # Your DigitalOcean database
OPENAI_API_KEY=sk-...          # For embeddings
CLERK_SECRET_KEY=sk_...        # For authentication
CLERK_PUBLISHABLE_KEY=pk_...   # For frontend
SUPER_ADMIN_EMAILS=hermann@changemastr.com,service@changemastr.com
ENVIRONMENT=production
```

### 4.2 Create/Update .env.production if Needed
```bash
nano .env.production
```

Paste this template (UPDATE WITH YOUR REAL VALUES):
```bash
DATABASE_URL=postgresql://doadmin:AVNS_60oX1gbkyUjUxv2y63s@db-postgresql-blr1-flomastr-do-user-24629085-0.g.db.ondigitalocean.com:25060/defaultdb?sslmode=require
OPENAI_API_KEY=sk-YOUR_OPENAI_KEY_HERE
CLERK_SECRET_KEY=sk_YOUR_CLERK_SECRET_HERE
CLERK_PUBLISHABLE_KEY=pk_YOUR_CLERK_PUBLIC_HERE
SUPER_ADMIN_EMAILS=hermann@changemastr.com,service@changemastr.com
ENVIRONMENT=production
PORT=8000
```

Save: `Ctrl+X`, then `Y`, then `Enter`

---

## STEP 5: Verify Database & pgvector

### 5.1 Check Database Connection
```bash
# Test database connection
docker-compose exec backend python -c "
import asyncio
import asyncpg
import os

async def test():
    try:
        conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
        version = await conn.fetchval('SELECT version()')
        print(f'✅ Database connected: {version[:50]}...')
        await conn.close()
    except Exception as e:
        print(f'❌ Database error: {e}')

asyncio.run(test())
"
```

**Expected Output**: `✅ Database connected: PostgreSQL ...`

### 5.2 Check pgvector Status
```bash
docker-compose exec backend python -c "
import asyncio
import asyncpg
import os

async def check():
    conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
    
    # Check pgvector extension
    ext = await conn.fetchval(\"\"\"
        SELECT extversion 
        FROM pg_extension 
        WHERE extname = 'vector'
    \"\"\")
    
    if ext:
        print(f'✅ pgvector installed: version {ext}')
    else:
        print('⚠️  pgvector NOT installed - need to install')
    
    # Check embeddings table type
    vec_type = await conn.fetchval(\"\"\"
        SELECT udt_name 
        FROM information_schema.columns 
        WHERE table_name = 'embeddings' 
        AND column_name = 'embedding_vector'
    \"\"\")
    
    if vec_type == 'vector':
        print(f'✅ embeddings.embedding_vector is vector type')
    else:
        print(f'⚠️  embeddings.embedding_vector is {vec_type} (should be vector)')
    
    await conn.close()

asyncio.run(check())
"
```

**Expected Output**: 
- ✅ pgvector installed: version 0.8.1
- ✅ embeddings.embedding_vector is vector type

**If NOT installed**, run:
```bash
docker-compose exec backend python -c "
import asyncio
import asyncpg
import os

async def install():
    conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
    await conn.execute('CREATE EXTENSION IF NOT EXISTS vector')
    print('✅ pgvector extension installed')
    
    # Convert embedding_vector to vector type
    await conn.execute('''
        ALTER TABLE embeddings 
        ALTER COLUMN embedding_vector TYPE vector(1536) 
        USING embedding_vector::vector
    ''')
    print('✅ embedding_vector converted to vector(1536)')
    
    # Create indexes
    await conn.execute('''
        CREATE INDEX IF NOT EXISTS embeddings_vector_cosine_idx 
        ON embeddings USING ivfflat (embedding_vector vector_cosine_ops)
        WITH (lists = 100)
    ''')
    await conn.execute('''
        CREATE INDEX IF NOT EXISTS embeddings_vector_l2_idx 
        ON embeddings USING ivfflat (embedding_vector vector_l2_ops)
        WITH (lists = 100)
    ''')
    print('✅ Vector indexes created')
    
    await conn.close()

asyncio.run(install())
"
```

---

## STEP 6: Rebuild and Deploy Containers

### 6.1 Stop Running Containers
```bash
docker-compose down
```

**Expected Output**: Containers stopping

### 6.2 Rebuild Containers with Latest Code
```bash
# Rebuild both backend and frontend
docker-compose build --no-cache backend frontend
```

**What to expect**: 
- Will take 2-5 minutes
- Shows build progress for Python and Node.js dependencies

### 6.3 Start Services
```bash
# Start in background
docker-compose up -d

# Or start with logs visible (Ctrl+C to exit, containers keep running)
docker-compose up
```

**Expected Output**: 
```
[+] Running 2/2
 ✔ Container flomastr-backend-1   Started
 ✔ Container flomastr-frontend-1  Started
```

### 6.4 Watch Logs
```bash
# In a new terminal, watch logs
docker-compose logs -f backend frontend
```

**What to look for**:
- Backend: `INFO: Application startup complete`
- Frontend: `ready in X ms`
- No error messages

---

## STEP 7: Verify Services Are Running

### 7.1 Check Container Status
```bash
docker-compose ps
```

**Expected Output**: Both containers should show "Up" status

### 7.2 Test Backend Health
```bash
curl http://localhost:8000/health
```

**Expected Output**: `{"status":"healthy",...}`

### 7.3 Test Knowledge API
```bash
# Health endpoint
curl http://localhost:8000/routes/knowledge/health

# List routes with knowledge in path
curl -s http://localhost:8000/openapi.json | python -c "import sys, json; routes = json.load(sys.stdin)['paths']; print('\\n'.join([r for r in routes if 'knowledge' in r]))"
```

**Expected Output**: Should show knowledge endpoints

### 7.4 Test Frontend
```bash
curl http://localhost:5173
```

**Expected Output**: HTML content (React app)

---

## STEP 8: Configure Caddy Reverse Proxy

### 8.1 Check Current Caddyfile
```bash
# Find Caddyfile location
find / -name Caddyfile 2>/dev/null | head -5

# Common locations:
cat /etc/caddy/Caddyfile
# OR
cat /opt/caddy/Caddyfile
```

### 8.2 Update Caddyfile
```bash
# Edit Caddyfile (use actual path from above)
nano /etc/caddy/Caddyfile
```

**Add these blocks** (or update if they exist):
```
# FloMastr Backend API
api.flomastr.com {
    reverse_proxy localhost:8000
    
    # Enable CORS if needed
    header Access-Control-Allow-Origin *
    header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    header Access-Control-Allow-Headers *
}

# FloMastr Frontend
app.flomastr.com {
    reverse_proxy localhost:5173
    
    # SPA routing - serve index.html for all routes
    @notStatic {
        not path /assets/*
        not path /favicon*
        not path /*.ico
        not path /*.png
        not path /*.svg
    }
    rewrite @notStatic /
}
```

Save: `Ctrl+X`, then `Y`, then `Enter`

### 8.3 Reload Caddy
```bash
# Test configuration
caddy validate --config /etc/caddy/Caddyfile

# Reload Caddy
systemctl reload caddy
# OR
caddy reload --config /etc/caddy/Caddyfile
```

**Expected Output**: No errors

---

## STEP 9: Verify Domain Access

### 9.1 Test from Server
```bash
# Test backend
curl https://api.flomastr.com/health

# Test frontend
curl https://app.flomastr.com
```

### 9.2 Test from Your Local Machine
Open your browser and visit:

1. **Backend Health**: https://api.flomastr.com/health
   - Should show: `{"status":"healthy"}`

2. **Frontend**: https://app.flomastr.com
   - Should load React app
   - Should show FloMastr interface

3. **With Tenant**: https://app.flomastr.com/acme/context-builder
   - Should prompt for login (Clerk)
   - After login, should show ContextBuilder

---

## STEP 10: Post-Deployment Verification

### 10.1 Test Authentication
```bash
# From browser:
1. Go to: https://app.flomastr.com/acme/hitl-tasks
2. Should redirect to Clerk login
3. Login with your Clerk account
4. Should redirect back to app
5. Should see tenant context = "acme"
```

### 10.2 Test Knowledge API
```bash
# You'll need a valid JWT token from Clerk
# This is easier to test from the browser console after logging in

# In browser console (F12):
fetch('/routes/knowledge/acme/index', {
  headers: {
    'Authorization': 'Bearer ' + document.cookie.match(/__session=([^;]+)/)[1]
  }
}).then(r => r.json()).then(console.log)
```

### 10.3 Test Business Brain
```bash
1. Login to app
2. Navigate to: https://app.flomastr.com/acme/context-builder
3. Try uploading a small PDF or text file
4. Fill in metadata form
5. Click "Save Knowledge"
6. Should see success toast
7. Should see knowledge base appear in list
```

---

## STEP 11: Monitor and Debug

### 11.1 Watch Logs
```bash
# Backend logs
docker-compose logs -f backend

# Frontend logs
docker-compose logs -f frontend

# Both together
docker-compose logs -f
```

### 11.2 Check Database Records
```bash
docker-compose exec backend python -c "
import asyncio
import asyncpg
import os

async def check():
    conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
    
    # Get tenant ID for 'acme'
    tenant = await conn.fetchrow('SELECT id, name FROM tenants WHERE slug = \\'acme\\'')
    if tenant:
        print(f'Tenant: {tenant[\"name\"]} (ID: {tenant[\"id\"]})')
        
        # Count knowledge bases
        kb_count = await conn.fetchval('SELECT COUNT(*) FROM knowledge_bases WHERE tenant_id = \$1', tenant['id'])
        print(f'Knowledge bases: {kb_count}')
        
        # Count embeddings
        emb_count = await conn.fetchval('SELECT COUNT(*) FROM embeddings WHERE tenant_id = \$1', tenant['id'])
        print(f'Embeddings: {emb_count}')
    else:
        print('Tenant acme not found')
    
    await conn.close()

asyncio.run(check())
"
```

---

## Troubleshooting

### Issue: Containers won't start
```bash
# Check logs
docker-compose logs backend frontend

# Common fixes:
# 1. Check DATABASE_URL is correct
docker-compose exec backend env | grep DATABASE_URL

# 2. Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Issue: Can't access via domain
```bash
# Check DNS
dig app.flomastr.com
# Should return: 143.110.252.87

# Check Caddy
systemctl status caddy
caddy validate --config /etc/caddy/Caddyfile

# Check ports
netstat -tulpn | grep -E ':(8000|5173|80|443)'
```

### Issue: Backend errors
```bash
# Check database connection
docker-compose exec backend python -c "
import os
print('DATABASE_URL:', os.getenv('DATABASE_URL')[:30] + '...')
"

# Restart backend
docker-compose restart backend

# Check logs
docker-compose logs -f backend
```

### Issue: Frontend can't reach backend
```bash
# Check Vite proxy configuration
cat frontend/vite.config.ts | grep proxy

# Verify backend is accessible
curl http://localhost:8000/health

# Check frontend env vars
docker-compose exec frontend env | grep VITE
```

---

## Success Criteria ✅

Your deployment is successful when:

- [ ] Backend health endpoint responds: https://api.flomastr.com/health
- [ ] Frontend loads: https://app.flomastr.com
- [ ] Can login with Clerk
- [ ] Tenant context loads correctly
- [ ] Can navigate to ContextBuilder: /acme/context-builder
- [ ] Can create knowledge base (upload file/URL)
- [ ] Knowledge base appears in list
- [ ] Database records are created
- [ ] No errors in browser console
- [ ] No errors in docker logs

---

## Quick Command Reference

```bash
# Deploy workflow
git pull origin main
docker-compose down
docker-compose build --no-cache backend frontend
docker-compose up -d
docker-compose logs -f

# Check status
docker-compose ps
curl http://localhost:8000/health
curl http://localhost:5173

# Restart services
docker-compose restart backend frontend

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Database check
docker-compose exec backend python -c "import asyncio, asyncpg, os; asyncio.run(asyncpg.connect(os.getenv('DATABASE_URL')).fetchval('SELECT 1'))"

# Shell access
docker-compose exec backend bash
docker-compose exec frontend sh
```

---

## Next Steps After Deployment

1. **Test all features** in live environment
2. **Create a test tenant** with real data
3. **Upload various file types** (PDF, DOCX, TXT)
4. **Test URL scraping** with different websites
5. **Monitor performance** and error rates
6. **Gather feedback** from actual usage
7. **Iterate and improve** based on findings

---

## Support

**Documentation**: See DEPLOYMENT_CHECKLIST_BUSINESS_BRAIN.md for detailed deployment procedures

**Emergency Rollback**:
```bash
# Revert to previous version
git log --oneline -5
git reset --hard <previous-commit-hash>
docker-compose down
docker-compose up -d
```

---

**You're ready to deploy! Follow the steps above carefully. 🚀**
