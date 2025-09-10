#!/usr/bin/env python3
"""
Quick Database Connection Test Script
Run this to verify database connectivity before starting the backend
"""
import asyncio
import os
import sys
from pathlib import Path

# Ensure we're in the backend directory
backend_dir = Path(__file__).parent
os.chdir(backend_dir)
sys.path.insert(0, str(backend_dir))

# Load environment variables
import dotenv
dotenv.load_dotenv()

from app.libs.db_connection import get_db_connection

async def quick_test():
    """Quick database connection test"""
    print("🔍 Quick Database Test")
    print("=" * 40)
    
    try:
        conn = await get_db_connection()
        if conn:
            result = await conn.fetchval('SELECT 1')
            print(f"✅ Database connected! Test result: {result}")
            await conn.close()
            return True
        else:
            print("❌ Database connection failed")
            return False
    except Exception as e:
        print(f"❌ Database error: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(quick_test())
    if success:
        print("\n🎉 Database is ready! You can start the backend server.")
    else:
        print("\n❌ Fix database connection before starting backend.")
        sys.exit(1)
