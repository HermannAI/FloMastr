"""Fastapi dependency to extract user that has been authenticated by Clerk.

Usage:

    from app.auth import AuthorizedUser

    @router.get("/example-data")
    def get_example_data(user: AuthorizedUser):
        return example_read_data_for_user(userId=user.user_id)
"""

from typing import Annotated

from fastapi import Depends

from app.libs.clerk_auth import get_current_user, ClerkUser


AuthorizedUser = Annotated[ClerkUser, Depends(get_current_user)]

# Backward compatibility alias for existing imports
User = ClerkUser
