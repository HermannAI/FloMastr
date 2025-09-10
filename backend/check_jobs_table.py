#!/usr/bin/env python3
"""Check if jobs table exists for WhatsApp Engine"""
import asyncio
import os
import asyncpg
import ssl
from dotenv import load_dotenv

load_dotenv()

async def check_jobs_table():
    database_url = os.getenv("DATABASE_URL")
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    conn = await asyncpg.connect(database_url, ssl=ssl_context)
    
    # Check if jobs table exists
    result = await conn.fetchval("""
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_name = 'jobs'
    """)
    
    print(f"Jobs table exists: {result > 0}")
    
    if result > 0:
        # Check structure
        columns = await conn.fetch("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'jobs' 
            ORDER BY ordinal_position
        """)
        print("\nJobs table structure:")
        for col in columns:
            print(f"  {col['column_name']}: {col['data_type']}")
    
    await conn.close()

if __name__ == "__main__":
    asyncio.run(check_jobs_table())
