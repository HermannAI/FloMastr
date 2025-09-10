

# Inside app/libs/backend_auth.py

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os

bearer_scheme = HTTPBearer()

def require_backend_token(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    # --- START DIAGNOSTIC LOGGING ---
    server_secret = os.getenv("BACKEND_API_SECRET_TOKEN")
    incoming_token = credentials.credentials

    print("--- AUTH_DEBUG: STARTING AUTHENTICATION CHECK ---")
    print(f"AUTH_DEBUG: Server secret loaded: {'SECRET_IS_SET' if server_secret else 'SECRET_IS_NONE'}")
    print(f"AUTH_DEBUG: Incoming token received: {'TOKEN_IS_PRESENT' if incoming_token else 'TOKEN_IS_NONE'}")

    if server_secret and incoming_token:
        print(f"AUTH_DEBUG: Are they equal? {server_secret == incoming_token}")

    print("--- AUTH_DEBUG: FINISHED AUTHENTICATION CHECK ---")
    # --- END DIAGNOSTIC LOGGING ---

    if not (server_secret and server_secret == incoming_token):
        print("AUTH_FAILURE: Authentication failed. Server secret and incoming token do not match.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    print("AUTH_SUCCESS: Authentication successful.")
    return "ok"
