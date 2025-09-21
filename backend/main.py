"""
FloMastr Backend - Simplified Super Admin Version
"""
print("*** FLOMASTR_MAIN_PY IS EXECUTING! ***")

# Core imports
import asyncio
import os
import sys
import pathlib
import json
from fastapi import FastAPI, HTTPException, Request, APIRouter, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import os
from typing import Optional
import logging
import asyncpg
from dotenv import load_dotenv

# Configuration
load_dotenv()

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Super admin configuration
SUPER_ADMIN_EMAILS = os.getenv("SUPER_ADMIN_EMAILS", "").split(",")
SUPER_ADMIN_EMAILS = [email.strip() for email in SUPER_ADMIN_EMAILS if email.strip()]

print(f"*** Configured super admin emails: {SUPER_ADMIN_EMAILS} ***")

# FastAPI app
app = FastAPI(
    title="FloMastr API - Super Admin Mode",
    description="FloMastr Backend with simplified super admin access",
    version="1.0.0"
)

# Super admin helper functions
def is_super_admin_email(email: str) -> bool:
    """Check if email is in the super admin list"""
    if not email or not SUPER_ADMIN_EMAILS:
        return False
    return email.lower().strip() in [admin_email.lower() for admin_email in SUPER_ADMIN_EMAILS]

def get_user_email_from_request(request: Request) -> Optional[str]:
    """Extract user email from request headers or query parameters"""
    # Try query parameters first
    email = request.query_params.get('email') or request.query_params.get('user_email')
    
    # Then try headers
    if not email:
        email = (request.headers.get('X-User-Email') or 
                request.headers.get('user-email') or 
                request.headers.get('email'))
    
    return email.strip() if email else None

def check_super_admin_access(request: Request) -> bool:
    """Check if request has super admin access"""
    email = get_user_email_from_request(request)
    if not email:
        print("*** No email found in request ***")
        return False
    
    is_admin = is_super_admin_email(email)
    print(f"*** Super admin check: {email} -> {is_admin} ***")
    return is_admin

def get_router_config() -> dict:
    try:
        cfg = json.loads(open("routers.json").read())
    except:
        return False
    return cfg

def is_auth_disabled(router_config: dict, name: str) -> bool:
    return router_config["routers"][name]["disableAuth"]

def import_api_routers() -> APIRouter:
    """Create top level router including all user defined endpoints."""
    routes = APIRouter(prefix="/routes")

    src_path = pathlib.Path(__file__).parent

    # Import API routers from "src/app/apis/*/__init__.py"
    apis_path = src_path / "app" / "apis"

    api_names = [
        p.relative_to(apis_path).parent.as_posix()
        for p in apis_path.glob("*/__init__.py")
    ]

    api_module_prefix = "app.apis."

    # Define which routes should be public (no auth required)
    # All admin routes now use simplified super admin access
    public_routes = ["tenant_resolution", "admin_tenant_provision"]

    for name in api_names:
        print(f"Importing API: {name}")
        try:
            api_module = __import__(api_module_prefix + name, fromlist=[name])
            api_router = getattr(api_module, "router", None)
            if isinstance(api_router, APIRouter):
                # No complex auth dependencies - super admin access is handled per endpoint
                routes.include_router(api_router)
        except Exception as e:
            print(f"Error importing {name}: {e}")
            continue

    print(f"Imported {len(routes.routes)} routes")
    return routes

# Add user management endpoints for super admins
# REMOVED: Mock /routes/users endpoint - using real user_management API instead
@app.get("/routes/tenants-direct")
async def list_tenants_direct(request: Request, skip: int = 0, limit: int = 100):
    """Direct tenants endpoint to test our super admin logic"""
    print(f"*** TENANTS DIRECT called ***")
    
    if not check_super_admin_access(request):
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    # Return some mock tenant data for testing
    mock_tenants = [
        {"id": 1, "name": "Test Tenant 1", "slug": "test-tenant-1"},
        {"id": 2, "name": "Test Tenant 2", "slug": "test-tenant-2"}
    ]
    
    return JSONResponse(content=mock_tenants)

def create_app() -> FastAPI:
    """Create the app. This is called by uvicorn with the factory option to construct the app object."""
    print("🚀 CREATE_APP: Starting FastAPI app creation", flush=True)
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://localhost:5173",
            "https://localhost:5174",
            "https://localhost:5175",
            "https://localhost:5176",
            "https://localhost:5177",
            "https://localhost:5178",  # Current frontend port
            "https://flomastr.com",
            "https://www.flomastr.com"
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Add diagnostic middleware
    @app.middleware("http")
    async def debug_middleware(request: Request, call_next):
        print("🔍 MIDDLEWARE TRIGGERED!", flush=True)
        print(f"🔍 MIDDLEWARE: Request received for {request.method} {request.url.path}", flush=True)
        print(f"   -> Headers: {dict(request.headers)}", flush=True)
        response = await call_next(request)
        return response

    # Include API routes
    app.include_router(import_api_routers())

    # Health check endpoint
    @app.get("/health")
    async def health_check():
        return {"status": "healthy", "mode": "super_admin_simplified"}

    # Test endpoint to verify our code is being used
    @app.get("/test-super-admin")
    async def test_super_admin(request: Request):
        """Simple test to verify our super admin logic works"""
        email = (request.query_params.get('email') or 
                request.headers.get('X-User-Email') or 
                request.headers.get('x-user-email'))
        
        if email:
            is_admin = is_super_admin_email(email.strip())
            return {
                "email": email,
                "is_super_admin": is_admin,
                "super_admin_emails": SUPER_ADMIN_EMAILS,
                "message": "Test endpoint working"
            }
        else:
            return {
                "email": None,
                "is_super_admin": False,
                "message": "No email provided"
            }

    print("FastAPI app created successfully with simplified super admin access")
    return app

# Initialize the app
app = create_app()
