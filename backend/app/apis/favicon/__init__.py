from fastapi import APIRouter
from fastapi.responses import RedirectResponse

router = APIRouter()

@router.get("/favicon.ico")
async def serve_favicon():
    """
    Serve the FloMastr favicon to override framework routing.
    
    This endpoint resolves the issue where /favicon.ico was being caught
    by the framework's catch-all routing and returning HTML instead of an icon.
    Browsers check /favicon.ico first, so this ensures they get a proper response.
    """
    # Redirect to our optimized favicon from CDN
    # Using 301 (permanent redirect) for browser caching
    return RedirectResponse(
        url="https://static.databutton.com/public/15880048-1dbd-4cea-820f-d5fbc363499d/light.ico",
        status_code=301
    )
