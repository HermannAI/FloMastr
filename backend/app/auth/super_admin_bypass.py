"""
Super Admin Authentication Bypass

This module provides an optional authentication dependency that allows super admin users
to bypass individual endpoint authentication checks while maintaining security for regular users.
"""

from fastapi import Depends, HTTPException, Request, status
from typing import Optional, Union
from app.libs.clerk_auth import get_current_user, ClerkUser
from app.libs.auth_utils import is_super_admin
from app.auth.user import AuthorizedUser
import logging

logger = logging.getLogger(__name__)

class SuperAdminBypass:
    """
    Authentication bypass for super admin users.
    
    This class allows super admin users (validated by email in SUPER_ADMIN_EMAILS env var)
    to access admin endpoints without individual token validation, while still requiring
    regular users to go through full authentication.
    """
    
    def __init__(self, user: ClerkUser, is_admin: bool = False):
        self.user = user
        self.is_admin = is_admin
        # Copy all ClerkUser attributes to maintain compatibility
        for attr in dir(user):
            if not attr.startswith('_'):
                setattr(self, attr, getattr(user, attr))

async def get_admin_user_or_bypass(request: Request) -> Union[ClerkUser, SuperAdminBypass]:
    """
    Authentication dependency that allows super admin users to bypass individual auth checks.
    
    For super admin users (validated by SUPER_ADMIN_EMAILS):
    - Skips individual token validation
    - Returns SuperAdminBypass object with admin privileges
    
    For regular users:
    - Requires full Clerk authentication
    - Returns standard ClerkUser object
    
    Args:
        request: FastAPI request object
        
    Returns:
        ClerkUser or SuperAdminBypass object
        
    Raises:
        HTTPException: If authentication fails for non-admin users
    """
    logger.info("🔍 SUPER_ADMIN_BYPASS: Starting authentication check")
    
    try:
        # SIMPLIFIED APPROACH: Check for super admin access first
        # Extract email from headers or query params
        email = (request.query_params.get('email') or 
                request.query_params.get('user_email') or
                request.headers.get('X-User-Email') or 
                request.headers.get('x-user-email') or  # Added lowercase
                request.headers.get('user-email') or 
                request.headers.get('email'))
        
        logger.info(f"🔍 SUPER_ADMIN_BYPASS: Extracted email: {email}")
        
        if email:
            # Check if this is a super admin email
            from app.libs.auth_utils import is_super_admin_email_simple
            
            is_admin = is_super_admin_email_simple(email.strip())
            logger.info(f"🔍 SUPER_ADMIN_BYPASS: Super admin check result: {is_admin}")
            
            if is_admin:
                logger.info(f"✅ SIMPLIFIED: Super admin bypass granted for email: {email}")
                # Create a simplified ClerkUser-like object for super admin
                class SimplifiedSuperAdmin:
                    def __init__(self, email):
                        self.email = email
                        self.id = f"super_admin_{email}"
                        self.is_super_admin = True
                
                user = SimplifiedSuperAdmin(email.strip())
                return SuperAdminBypass(user, is_admin=True)
        
        logger.info("🔍 SUPER_ADMIN_BYPASS: No super admin email found, falling back to Clerk auth")
        
        # Fall back to normal Clerk authentication for regular users
        try:
            user = await get_current_user(request)
            
            # Check if this user is a super admin (legacy check)
            if is_super_admin(user):
                logger.info(f"Super admin bypass granted for user: {user.email}")
                return SuperAdminBypass(user, is_admin=True)
            
            # Regular authenticated user
            return user
            
        except HTTPException as auth_error:
            logger.warning(f"Authentication failed for request to {request.url.path}")
            raise auth_error
            
    except Exception as e:
        logger.error(f"Error in super admin bypass: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service error"
        )

async def get_optional_admin_user(request: Request) -> Optional[Union[ClerkUser, SuperAdminBypass]]:
    """
    Optional authentication dependency that returns None if auth fails.
    Useful for endpoints that work for both authenticated and unauthenticated users.
    """
    try:
        return await get_admin_user_or_bypass(request)
    except HTTPException:
        return None

# Type alias for backward compatibility
AdminUserOrBypass = Union[ClerkUser, SuperAdminBypass]