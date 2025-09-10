
from fastapi import APIRouter, HTTPException, Header, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any
import jwt
import json
from app.auth import AuthorizedUser
from app.libs.auth_utils import get_normalized_user_context, is_super_admin_normalized
import os

router = APIRouter()

class JWTDebugResponse(BaseModel):
    raw_token: Optional[str] = None
    token_header: Optional[Dict[str, Any]] = None
    token_payload: Optional[Dict[str, Any]] = None
    authorized_user_data: Optional[Dict[str, Any]] = None
    email_in_jwt: Optional[str] = None
    email_in_user: Optional[str] = None
    debug_info: Dict[str, Any]

@router.get("/debug/jwt")
async def debug_jwt_token(request: Request, user: AuthorizedUser) -> JWTDebugResponse:
    """Debug endpoint to inspect JWT token and email parsing"""
    
    # Get normalized user context
    normalized_context = get_normalized_user_context(user)
    
    debug_info = {
        "auth_header_present": bool(request.headers.get("authorization")),
        "user_object_type": str(type(user)),
        "user_has_email_attr": hasattr(user, 'email'),
        "disable_auth_test_mode": os.getenv("DISABLE_AUTH_TEST_MODE"),
        "normalized_user_id": normalized_context["user_id"],
        "original_user_id": normalized_context["original_user_id"],
        "is_normalized": normalized_context["is_normalized"],
        "is_super_admin_normalized": normalized_context["is_super_admin"],
        "auth_mode": normalized_context["auth_mode"]
    }
    
    # Extract the raw token from Authorization header
    auth_header = request.headers.get("authorization", "")
    raw_token = None
    token_header = None
    token_payload = None
    email_in_jwt = None
    
    if auth_header and auth_header.startswith("Bearer "):
        raw_token = auth_header[7:]  # Remove "Bearer " prefix
        
        try:
            # Decode token without verification to inspect claims
            token_header = jwt.get_unverified_header(raw_token)
            token_payload = jwt.decode(raw_token, options={"verify_signature": False})
            email_in_jwt = token_payload.get("email")
            
            debug_info["jwt_algorithm"] = token_header.get("alg")
            debug_info["jwt_kid"] = token_header.get("kid")
            debug_info["jwt_issuer"] = token_payload.get("iss")
            debug_info["jwt_subject"] = token_payload.get("sub")
            debug_info["jwt_claims_count"] = len(token_payload)
            debug_info["jwt_claims_keys"] = list(token_payload.keys())
            
        except Exception as e:
            debug_info["jwt_decode_error"] = str(e)
    
    # Extract user data
    authorized_user_data = {}
    email_in_user = None
    
    try:
        # Get all available attributes from the user object
        if hasattr(user, '__dict__'):
            authorized_user_data = user.__dict__.copy()
        elif hasattr(user, 'model_dump'):
            authorized_user_data = user.model_dump()
        else:
            authorized_user_data = {
                "sub": getattr(user, 'sub', None),
                "email": getattr(user, 'email', None),
                "name": getattr(user, 'name', None),
                "picture": getattr(user, 'picture', None)
            }
        
        email_in_user = getattr(user, 'email', None)
        debug_info["user_sub"] = getattr(user, 'sub', None)
        
    except Exception as e:
        debug_info["user_extraction_error"] = str(e)
    
    return JWTDebugResponse(
        raw_token=raw_token[:50] + "..." if raw_token and len(raw_token) > 50 else raw_token,
        token_header=token_header,
        token_payload=token_payload,
        authorized_user_data=authorized_user_data,
        email_in_jwt=email_in_jwt,
        email_in_user=email_in_user,
        debug_info=debug_info
    )

@router.get("/debug/auth-status")
async def debug_auth_status() -> Dict[str, Any]:
    """Debug endpoint to check auth configuration"""
    
    return {
        "stack_secret_key_configured": bool(os.getenv("STACK_SECRET_SERVER_KEY")),
        "disable_auth_test_mode": os.getenv("DISABLE_AUTH_TEST_MODE"),
        "super_admin_ids": os.getenv("SUPER_ADMIN_IDS"),
        "project_id": "34204b2d-cb69-4af7-b557-fd752531f1c3",
        "jwks_url": "https://api.stack-auth.com/api/v1/projects/34204b2d-cb69-4af7-b557-fd752531f1c3/.well-known/jwks.json"
    }
