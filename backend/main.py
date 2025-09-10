import os
import pathlib
import json
import dotenv
from fastapi import FastAPI, APIRouter, Depends, Request
import sys

dotenv.load_dotenv()

from app.libs.clerk_auth import get_authorized_user
from app.libs.cors_middleware import CORSMiddleware


def get_router_config() -> dict:
    try:
        # Note: This file is not available to the agent
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
    public_routes = ["tenant_resolution", "admin_tenant_provision"]

    for name in api_names:
        print(f"Importing API: {name}")
        try:
            api_module = __import__(api_module_prefix + name, fromlist=[name])
            api_router = getattr(api_module, "router", None)
            if isinstance(api_router, APIRouter):
                # Add authentication dependency for non-public routes
                dependencies = []
                if name not in public_routes:
                    dependencies = [Depends(get_authorized_user)]

                routes.include_router(
                    api_router,
                    dependencies=dependencies,
                )
        except Exception as e:
            print(f"Error importing {name}: {e}")
            continue

    print(f"Imported {len(routes.routes)} routes")
    return routes


def create_app() -> FastAPI:
    """Create the app. This is called by uvicorn with the factory option to construct the app object."""
    print("🚀 CREATE_APP: Starting FastAPI app creation", flush=True)
    app = FastAPI(title="FloMastr API", version="1.0.0")

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allowed_origins=[
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
        allowed_methods=["*"],
        allowed_headers=["*"],
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
        return {"status": "healthy"}

    print("FastAPI app created successfully")
    return app


app = create_app()
