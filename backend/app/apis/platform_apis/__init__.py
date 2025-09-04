
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from datetime import datetime
import json
import asyncpg
import databutton as db

# Import centralized database connection
from app.libs.db_connection import get_db_connection

router = APIRouter()

class PlatformManifestResponse(BaseModel):
    app_version: str
    bundles: Dict[str, Any]
    feature_flags: Dict[str, Any]
    policies: Dict[str, Any]
    updated_at: datetime

@router.get("/manifest")
async def get_platform_manifest() -> PlatformManifestResponse:
    """Get the platform manifest containing app version, bundles, feature flags, and policies."""
    try:
        conn = await get_db_connection()
        try:
            # Get the single manifest row
            row = await conn.fetchrow("SELECT * FROM platform_manifest ORDER BY id LIMIT 1")
            if not row:
                raise HTTPException(status_code=404, detail="Platform manifest not found")
            
            # Parse JSONB fields properly
            bundles = row['bundles'] if isinstance(row['bundles'], dict) else json.loads(row['bundles'] or '{}')
            feature_flags = row['feature_flags'] if isinstance(row['feature_flags'], dict) else json.loads(row['feature_flags'] or '{}')
            policies = row['policies'] if isinstance(row['policies'], dict) else json.loads(row['policies'] or '{}')
            
            return PlatformManifestResponse(
                app_version=row['app_version'],
                bundles=bundles,
                feature_flags=feature_flags,
                policies=policies,
                updated_at=row['updated_at']
            )
        finally:
            await conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch platform manifest: {str(e)}") from e

async def _table_exists(conn, table_name: str) -> bool:
    """Check if a table exists in the database."""
    try:
        result = await conn.fetchval(
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)",
            table_name
        )
        return bool(result)
    except Exception:
        return False
