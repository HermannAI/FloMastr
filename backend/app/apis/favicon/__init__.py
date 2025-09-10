from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, RedirectResponse
import os
from pathlib import Path

router = APIRouter()

@router.get("/favicon.ico")
async def serve_favicon():
    """
    Serve the FloMastr favicon to override framework routing.
    
    This endpoint resolves the issue where /favicon.ico was being caught
    by the framework's catch-all routing and returning HTML instead of an icon.
    Browsers check /favicon.ico first, so this ensures they get a proper response.
    """
    try:
        # Try to serve local light theme favicon first
        static_dir = Path(__file__).parent.parent.parent / "static"
        favicon_path = static_dir / "favicon-light.ico"
        
        if favicon_path.exists():
            return FileResponse(favicon_path, media_type="image/x-icon")
        else:
            # Fallback to SVG if ICO doesn't exist yet
            svg_path = Path(__file__).parent.parent.parent.parent / "frontend" / "public" / "favicon-light.svg"
            if svg_path.exists():
                return FileResponse(svg_path, media_type="image/svg+xml")
            else:
                # Last resort: redirect to working favicon (temporary)
                return RedirectResponse(
                    url="https://static.databutton.com/public/15880048-1dbd-4cea-820f-d5fbc363499d/light.ico",
                    status_code=301
                )
    except Exception as e:
        # Log error and use fallback
        print(f"Favicon serve error: {e}")
        return RedirectResponse(
            url="https://static.databutton.com/public/15880048-1dbd-4cea-820f-d5fbc363499d/light.ico",
            status_code=301
        )

@router.get("/light.ico") 
async def serve_light_favicon():
    """Serve light theme favicon"""
    try:
        static_dir = Path(__file__).parent.parent.parent / "static"
        favicon_path = static_dir / "favicon-light.ico"
        
        if favicon_path.exists():
            return FileResponse(favicon_path, media_type="image/x-icon")
        else:
            # Fallback to SVG
            svg_path = Path(__file__).parent.parent.parent.parent / "frontend" / "public" / "favicon-light.svg"
            if svg_path.exists():
                return FileResponse(svg_path, media_type="image/svg+xml")
            else:
                raise HTTPException(status_code=404, detail="Light favicon not found")
    except Exception as e:
        print(f"Light favicon error: {e}")
        raise HTTPException(status_code=404, detail="Light favicon not found")

@router.get("/dark.ico")
async def serve_dark_favicon():
    """Serve dark theme favicon"""
    try:
        static_dir = Path(__file__).parent.parent.parent / "static"
        favicon_path = static_dir / "favicon-dark.ico"
        
        if favicon_path.exists():
            return FileResponse(favicon_path, media_type="image/x-icon")
        else:
            # Fallback to SVG
            svg_path = Path(__file__).parent.parent.parent.parent / "frontend" / "public" / "favicon-dark.svg"
            if svg_path.exists():
                return FileResponse(svg_path, media_type="image/svg+xml")
            else:
                raise HTTPException(status_code=404, detail="Dark favicon not found")
    except Exception as e:
        print(f"Dark favicon error: {e}")
        raise HTTPException(status_code=404, detail="Dark favicon not found")
