import asyncpg
import os
import ssl
import urllib.parse

async def get_db_connection():
    """Get database connection from environment variable"""
    database_url = os.getenv("DATABASE_URL")
    print(f"DEBUG: DATABASE_URL = {database_url}")

    if not database_url:
        raise ValueError("DATABASE_URL environment variable not configured")

    print("DEBUG: Attempting database connection...")

    # Parse the URL to get individual components (like DBeaver does)
    parsed = urllib.parse.urlparse(database_url)
    
    # Try different connection approaches
    connection_attempts = [
        {
            "name": "SSL Required (DigitalOcean default)",
            "params": {
                "host": parsed.hostname,
                "port": parsed.port,
                "database": parsed.path[1:],  # Remove leading /
                "user": parsed.username,
                "password": parsed.password,
                "ssl": "require",
                "timeout": 30
            }
        },
        {
            "name": "SSL Prefer",
            "params": {
                "host": parsed.hostname,
                "port": parsed.port,
                "database": parsed.path[1:],
                "user": parsed.username,
                "password": parsed.password,
                "ssl": "prefer",
                "timeout": 30
            }
        },
        {
            "name": "No SSL",
            "params": {
                "host": parsed.hostname,
                "port": parsed.port,
                "database": parsed.path[1:],
                "user": parsed.username,
                "password": parsed.password,
                "ssl": False,
                "timeout": 30
            }
        }
    ]

    for attempt in connection_attempts:
        try:
            print(f"DEBUG: Trying {attempt['name']}...")
            conn = await asyncpg.connect(**attempt['params'])
            print(f"DEBUG: Database connection successful ({attempt['name']})")
            return conn
        except Exception as e:
            print(f"DEBUG: {attempt['name']} failed: {e}")
            continue
    
    # If all attempts fail, raise the last error
    raise Exception("All database connection attempts failed. Check network connectivity and database configuration.")