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
    try:
        # Try to get the current user through normal Clerk auth
        try:
            user = await get_current_user(request)
            
            # Check if this user is a super admin
            if is_super_admin(user):
                logger.info(f"Super admin bypass granted for user: {user.email}")
                return SuperAdminBypass(user, is_admin=True)
            
            # Regular authenticated user
            return user
            
        except HTTPException as auth_error:
            # If Clerk auth fails, check if we can identify a super admin by other means
            # This provides a fallback for app-level authenticated super admin users
            # who might not have valid tokens for individual endpoints
            
            # For now, we'll still require proper auth - but this is where we could
            # add additional bypass logic if needed
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