from fastapi import APIRouter, Request
from app.auth import AuthorizedUser

router = APIRouter()

@router.get("/postman-token")
async def get_postman_token(request: Request, user: AuthorizedUser) -> dict:
    """Get full JWT token for Postman testing (temporary endpoint)"""
    
    # Extract the raw token from Authorization header
    auth_header = request.headers.get("authorization", "")
    raw_token = None
    
    if auth_header and auth_header.startswith("Bearer "):
        raw_token = auth_header[7:]  # Remove "Bearer " prefix
    
    return {
        "full_token": raw_token,
        "user_id": user.sub,
        "note": "Copy the full_token value and use it as 'Bearer [full_token]' in Postman"
    }
