import asyncpg
import databutton as db
from app.env import Mode, mode

async def get_db_connection():
    """Get environment-aware database connection"""
    if mode == Mode.PROD:
        database_url = db.secrets.get("DATABASE_URL_PROD")
    else:
        database_url = db.secrets.get("DATABASE_URL_DEV")
    
    if not database_url:
        raise ValueError(f"Database URL not configured for environment: {mode}")
    
    return await asyncpg.connect(database_url)
