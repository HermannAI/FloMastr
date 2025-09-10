
import os
import asyncpg
from app.env import mode, Mode

# Import centralized database connection
from app.libs.db_connection import get_db_connection as get_main_db_connection

async def get_db_connection():
    """Get admin database connection for migrations and admin operations"""
    if mode == Mode.PROD:
        db_url = os.getenv("DATABASE_URL_ADMIN_PROD")
    else:
        db_url = os.getenv("DATABASE_URL_ADMIN_DEV")
    
    conn = await asyncpg.connect(db_url)
    return conn
