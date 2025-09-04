from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from typing import List, Optional

class CORSMiddleware(BaseHTTPMiddleware):
    """CORS middleware that supports tenant-specific origins"""
    
    def __init__(
        self, 
        app,
        allowed_origins: List[str] = None,
        allowed_methods: List[str] = None,
        allowed_headers: List[str] = None,
        expose_headers: List[str] = None,
        allow_credentials: bool = False,
        max_age: int = 600
    ):
        super().__init__(app)
        self.allowed_origins = allowed_origins or ["*"]
        self.allowed_methods = allowed_methods or ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
        self.allowed_headers = allowed_headers or [
            "Accept",
            "Accept-Language", 
            "Content-Language",
            "Content-Type",
            "Authorization",
            "X-Tenant-Slug",
            "X-Requested-With"
        ]
        self.expose_headers = expose_headers or []
        self.allow_credentials = allow_credentials
        self.max_age = max_age
    
    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin")
        
        # Handle preflight requests
        if request.method == "OPTIONS":
            return self._create_preflight_response(origin)
        
        # Process actual request
        response = await call_next(request)
        
        # Add CORS headers to response
        if origin and self._is_origin_allowed(origin):
            response.headers["Access-Control-Allow-Origin"] = origin
            if self.allow_credentials:
                response.headers["Access-Control-Allow-Credentials"] = "true"
            if self.expose_headers:
                response.headers["Access-Control-Expose-Headers"] = ", ".join(self.expose_headers)
        
        return response
    
    def _is_origin_allowed(self, origin: str) -> bool:
        """Check if origin is allowed"""
        if "*" in self.allowed_origins:
            return True
        
        for allowed_origin in self.allowed_origins:
            if origin == allowed_origin:
                return True
            # Support wildcard subdomains like *.flomastr.com
            if allowed_origin.startswith("*."):
                domain = allowed_origin[2:]
                if origin.endswith(f".{domain}") or origin == domain:
                    return True
        
        return False
    
    def _create_preflight_response(self, origin: Optional[str]) -> Response:
        """Create preflight response for OPTIONS requests"""
        headers = {}
        
        if origin and self._is_origin_allowed(origin):
            headers["Access-Control-Allow-Origin"] = origin
            headers["Access-Control-Allow-Methods"] = ", ".join(self.allowed_methods)
            headers["Access-Control-Allow-Headers"] = ", ".join(self.allowed_headers)
            headers["Access-Control-Max-Age"] = str(self.max_age)
            
            if self.allow_credentials:
                headers["Access-Control-Allow-Credentials"] = "true"
        
        return Response(status_code=200, headers=headers)
