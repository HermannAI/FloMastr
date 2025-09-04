from fastapi import APIRouter
from pydantic import BaseModel
import databutton as db
from datetime import datetime
import asyncpg

router = APIRouter(prefix="/api/v1/platform")

class PreflightSecretsResponse(BaseModel):
    """Public preflight response for deployment diagnosis - checks secrets without authentication"""
    stack_secret_server_key: str
    super_admin_ids: str
    database_connection: str
    timestamp: datetime

@router.get("/preflight")
async def get_preflight_check() -> PreflightSecretsResponse:
    """Public preflight check to verify required secrets for deployment - no authentication required."""
    
    # Check required secrets without exposing their values
    secrets_status = {
        "stack_secret_server_key": "MISSING",
        "super_admin_ids": "MISSING", 
        "database_connection": "MISSING"
    }
    
    # Check STACK_SECRET_SERVER_KEY
    try:
        stack_secret = db.secrets.get("STACK_SECRET_SERVER_KEY")
        if stack_secret and stack_secret.strip():
            secrets_status["stack_secret_server_key"] = "OK"
    except Exception:
        pass
    
    # Check SUPER_ADMIN_IDS
    try:
        super_admin_ids = db.secrets.get("SUPER_ADMIN_IDS")
        if super_admin_ids and super_admin_ids.strip():
            secrets_status["super_admin_ids"] = "OK"
    except Exception:
        pass
    
    # Check database connection string
    try:
        # Try both dev and prod database URLs
        db_url_dev = db.secrets.get("DATABASE_URL_DEV")
        db_url_prod = db.secrets.get("DATABASE_URL_PROD")
        
        if (db_url_dev and db_url_dev.strip()) or (db_url_prod and db_url_prod.strip()):
            secrets_status["database_connection"] = "OK"
            
            # Also test actual database connectivity
            try:
                database_url = db_url_dev or db_url_prod
                conn = await asyncpg.connect(database_url)
                await conn.fetchval("SELECT 1")  # Simple connectivity test
                await conn.close()
                # If we get here, connection works
            except Exception as conn_error:
                # Connection string exists but connection failed
                secrets_status["database_connection"] = f"EXISTS_BUT_FAILED: {str(conn_error)[:50]}"
    except Exception:
        pass
    
    return PreflightSecretsResponse(
        stack_secret_server_key=secrets_status["stack_secret_server_key"],
        super_admin_ids=secrets_status["super_admin_ids"],
        database_connection=secrets_status["database_connection"],
        timestamp=datetime.now()
    )
