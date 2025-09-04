
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.auth import AuthorizedUser
from app.libs.auth_utils import is_super_admin

router = APIRouter(prefix="/api/v1/users")

class UserStatusResponse(BaseModel):
    is_super_admin: bool
    user_id: str
    email: Optional[str] = None

@router.get("/me/status", response_model=UserStatusResponse)
async def get_current_user_status(user: AuthorizedUser) -> UserStatusResponse:
    """
    Get the current user's status including super admin privileges.
    
    This endpoint uses the centralized is_super_admin function to determine
    if the authenticated user has super admin privileges.
    
    Returns:
        UserStatusResponse: Contains is_super_admin flag and user information
    """
    return UserStatusResponse(
        is_super_admin=is_super_admin(user),
        user_id=user.sub,
        email=getattr(user, 'email', None)
    )
