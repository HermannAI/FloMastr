
import requests
import os
from typing import Optional
from pydantic import BaseModel
from app.auth import AuthorizedUser


class StackAuthUserProfile(BaseModel):
    """Stack Auth user profile with email"""
    id: str
    email: Optional[str] = None
    displayName: Optional[str] = None
    profileImageUrl: Optional[str] = None


class StackAuthHelper:
    """Helper class for Stack Auth API operations"""
    
    def __init__(self):
        self.project_id = "34204b2d-cb69-4af7-b557-fd752531f1c3"  # From JWT issuer
        self.secret_key = os.getenv("STACK_SECRET_SERVER_KEY")
        if not self.secret_key:
            raise ValueError("STACK_SECRET_SERVER_KEY not configured")
    
    async def get_user_profile(self, user_id: str) -> StackAuthUserProfile:
        """Get user profile from Stack Auth REST API using user ID"""
        
        # Correct API endpoint format
        url = f"https://api.stack-auth.com/api/v1/users/{user_id}"
        headers = {
            "X-Stack-Access-Type": "server",
            "X-Stack-Project-Id": self.project_id,
            "X-Stack-Secret-Server-Key": self.secret_key,
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code != 200:
            raise ValueError(f"Stack Auth API returned {response.status_code}: {response.text}")
        
        profile_data = response.json()
        
        return StackAuthUserProfile(
            id=profile_data.get("id", ""),
            email=profile_data.get("primaryEmail") or profile_data.get("email"),
            displayName=profile_data.get("displayName"),
            profileImageUrl=profile_data.get("profileImageUrl") or profile_data.get("profile_image_url")
        )
    
    async def get_user_email_from_jwt_user(self, user: AuthorizedUser, access_token: str = "") -> Optional[str]:
        """Get user email by calling Stack Auth API with user ID"""
        try:
            profile = await self.get_user_profile(user.sub)
            return profile.email
        except Exception as e:
            print(f"Failed to get user profile from Stack Auth: {e}")
            return None
    
    def is_super_admin_by_email(self, email: Optional[str]) -> bool:
        """Check if user is super admin by email"""
        if not email:
            return False
        return email == "hermann@changemastr.com"
    
    def is_super_admin_by_user_id(self, user_id: str) -> bool:
        """Check if user is super admin by user ID (fallback)"""
        try:
            super_admin_ids = os.getenv("SUPER_ADMIN_IDS")
            if super_admin_ids and user_id in super_admin_ids.split(","):
                return True
        except Exception:
            pass
        return False


# Global instance
stack_auth = StackAuthHelper()
