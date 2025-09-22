docker-compose up -d
docker-compose up -d
docker-compose up -d
docker-compose exec backend bash
docker-compose exec frontend bash
docker-compose logs -f backend

# FloMastr AI Coding Agent Instructions

## Overview
FloMastr is a multi-tenant AI platform for WhatsApp Business, built with a modular architecture:
- **Backend**: FastAPI (Python 3.11), LangChain integration, modular APIs in `backend/app/apis/`
- **Frontend**: React + TypeScript + Vite, API client in `frontend/src/brain/`
- **WhatsApp Engine**: Messaging microservice
- **Business Brain**: RAG knowledge management
- **Data Engine**: Real-time data integration
- **Database**: PostgreSQL, hot storage pattern
- **Infrastructure**: Docker-first, Codespaces optimized

## Essential Workflows
- **Start full stack**: `docker-compose up -d` (see `codespaces-start.sh` for Codespaces)
- **Backend shell**: `docker-compose exec backend bash`
- **Frontend shell**: `docker-compose exec frontend bash`
- **Update DB schema**: `docker-compose exec backend python migrate_schema.py`
- **Run frontend dev server**: `cd frontend && npm run dev -- --host 0.0.0.0`
- **Run frontend tests**: `cd frontend && npm test`

## API & Routing Patterns
- Backend APIs: Each module in `backend/app/apis/{module}/__init__.py` exports a FastAPI `router`
- All backend routes mounted under `/routes/` (required for frontend proxy)
- Frontend API calls use the `brain` client (`frontend/src/brain/`)
- Example backend endpoint:
  ```python
  # backend/app/apis/example/__init__.py
  from fastapi import APIRouter
  router = APIRouter()
  @router.get("/ping")
  async def ping():
      return {"pong": True}
  ```
- Example frontend call:
  ```typescript
  import brain from '../brain';
  const res = await brain.list_tenants({ limit: 100 });
  ```

## Conventions & Patterns
- **Super Admin**: Emails in `SUPER_ADMIN_EMAILS` env var; use `check_super_admin_access` for admin endpoints
- **Tenant Resolution**: `/routes/resolve-tenant` endpoint; always include tenant context in responses
- **Database Access**: Use `get_db_connection()` from `backend/app/libs/db_connection.py`; close connections with `try/finally`
- **Frontend Components**: Follow shadcn/ui pattern in `frontend/src/components/`
- **LangChain AI**: RAG and tools endpoints in `backend/app/apis/tools/__init__.py`
- **Error Handling**: Use FastAPI `HTTPException` with detailed status codes

## Gotchas & Tips
- Frontend proxy only works for `/routes/*` paths
- Super admin access: `X-User-Email` header or `email` query param required
- Codespaces: Use relative URLs; Vite proxy handles backend routing
- TypeScript server uses `node_modules/typescript/lib`
- Environment variables auto-detect Codespaces via `$CODESPACE_NAME`

## Key Files & Directories
- `backend/app/apis/` — Modular API endpoints
- `frontend/src/brain/` — API client
- `database/hot-storage-schema.sql` — DB schema
- `backend/app/libs/db_connection.py` — DB connection utility
- `backend/app/apis/tools/__init__.py` — LangChain AI endpoints

---
Review and update this guide as architecture evolves. For unclear patterns, ask maintainers for clarification.