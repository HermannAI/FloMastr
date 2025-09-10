from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import requests
import os
from typing import Optional
from pydantic import BaseModel
import time
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

print("🔥 CLERK_AUTH MODULE LOADED!")  # Simple print to verify module loading

security = HTTPBearer(auto_error=False)  # Make it optional so we can fall back to cookies

class ClerkUser(BaseModel):
    user_id: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_super_admin: bool = False

# Cache for JWKS
_jwks_cache = None
_jwks_cache_time = 0
JWKS_CACHE_DURATION = 3600  # 1 hour

def get_clerk_jwks():
    """Get Clerk JWKS from cache or fetch from API"""
    global _jwks_cache, _jwks_cache_time

    current_time = time.time()
    if _jwks_cache and (current_time - _jwks_cache_time) < JWKS_CACHE_DURATION:
        return _jwks_cache

    # Fetch JWKS from Clerk
    try:
        response = requests.get("https://safe-monarch-50.clerk.accounts.dev/.well-known/jwks.json")
        response.raise_for_status()
        _jwks_cache = response.json()
        _jwks_cache_time = current_time
        return _jwks_cache
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch JWKS: {str(e)}")

def verify_clerk_token(token: str) -> dict:
    """Verify Clerk JWT token using JWKS"""
    try:
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]

        # Get the header to find the key ID
        header = jwt.get_unverified_header(token)
        kid = header.get('kid')

        if not kid:
            raise HTTPException(status_code=401, detail="No key ID in token")

        # Get JWKS
        jwks = get_clerk_jwks()

        # Find the correct key
        rsa_key = None
        for key in jwks['keys']:
            if key['kid'] == kid:
                rsa_key = jwt.algorithms.RSAAlgorithm.from_jwk(key)
                break

        if not rsa_key:
            raise HTTPException(status_code=401, detail="Unable to find appropriate key")

        # Decode the JWT token
        payload = jwt.decode(token, rsa_key, algorithms=["RS256"], audience="safe-monarch-50")

        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> ClerkUser:
    """Get current authenticated user from Clerk JWT token (from cookies or Authorization header)"""
    logger.info("🔍 DEBUG: get_current_user function called!")
    token = None

    # Debug: Log all cookies and headers
    logger.info(f"All cookies: {dict(request.cookies)}")
    logger.info(f"All headers: {dict(request.headers)}")
    
    # First try to get token from cookies (Clerk's session cookies)
    # Clerk uses different cookie names depending on configuration
    session_cookie = (
        request.cookies.get("__session") or
        request.cookies.get("clerk-session") or
        request.cookies.get("__clerk_db_jwt") or
        request.cookies.get("clerk-db-jwt") or
        request.cookies.get("__clerk_db_session") or
        request.cookies.get("clerk_db_session") or
        # Additional common Clerk cookie names
        request.cookies.get("__clerk_session") or
        request.cookies.get("clerk_session") or
        request.cookies.get("__clerk_jwt") or
        request.cookies.get("clerk_jwt") or
        request.cookies.get("__session_token") or
        request.cookies.get("session_token")
    )
    
    logger.info(f"Session cookie found: {session_cookie is not None}")
    logger.info(f"Session cookie value (first 50 chars): {session_cookie[:50] if session_cookie else 'None'}")
    
    if session_cookie:
        token = session_cookie
    # Fall back to Authorization header
    elif credentials:
        token = credentials.credentials
        logger.info(f"Using Authorization header token: {token[:50] if token else 'None'}")
    # Also check for Authorization header directly
    elif request.headers.get("authorization"):
        auth_header = request.headers.get("authorization")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            logger.info(f"Using Authorization header (direct): {token[:50] if token else 'None'}")

    if not token:
        logger.info("No authentication credentials provided")
        raise HTTPException(status_code=401, detail="No authentication credentials provided")

    try:
        logger.info(f"Attempting to verify token...")
        payload = verify_clerk_token(token)
        logger.info(f"Token verified successfully")

        # Extract user information from the token
        user_id = payload.get("sub")
        email = payload.get("email")
        first_name = payload.get("first_name")
        last_name = payload.get("last_name")

        logger.info(f"User ID: {user_id}")
        logger.info(f"Email: {email}")
        logger.info(f"First Name: {first_name}")
        logger.info(f"Last Name: {last_name}")

        if not user_id or not email:
            logger.info(f"Invalid token payload - missing user_id or email")
            raise HTTPException(status_code=401, detail="Invalid token payload")

        # Check if user is super admin
        super_admin_emails_str = os.getenv("SUPER_ADMIN_EMAILS", "")
        logger.info(f"SUPER_ADMIN_EMAILS: {super_admin_emails_str}")  # Debug
        logger.info(f"User email: {email}")  # Debug
        super_admin_emails = [e.strip().lower() for e in super_admin_emails_str.split(',') if e.strip()]
        is_super_admin = email.lower() in super_admin_emails
        logger.info(f"Is super admin: {is_super_admin}")  # Debug

        user_obj = ClerkUser(
            user_id=user_id,
            email=email,
            first_name=first_name,
            last_name=last_name,
            is_super_admin=is_super_admin
        )
        
        logger.info(f"Created ClerkUser object: {user_obj}")
        return user_obj

    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

async def get_authorized_user(request: Request, user: ClerkUser = Depends(get_current_user)) -> ClerkUser:
    """Alias for get_current_user for backward compatibility"""
    return user
