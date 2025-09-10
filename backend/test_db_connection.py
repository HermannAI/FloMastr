#!/usr/bin/env python3
"""
Test database connection to diagnose the tenant provisioning issue
"""
import asyncio
import os
import sys
import dotenv

# Load environment variables
dotenv.load_dotenv()

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

from app.libs.db_connection import get_db_connection

async def test_database_connection():
    """Test database connection and provide detailed error information"""
    print("=" * 60)
    print("DATABASE CONNECTION TEST")
    print("=" * 60)
    
    # Check environment variable
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        print(f"✅ DATABASE_URL found: {database_url[:50]}...")
    else:
        print("❌ DATABASE_URL not found in environment")
        return
    
    # Test connection
    print("\n🔍 Testing database connection...")
    try:
        conn = await get_db_connection()
        if conn:
            print("✅ Connection established successfully")
            
            # Test simple query
            try:
                result = await conn.fetchval('SELECT 1 as test')
                print(f"✅ Test query successful, result: {result}")
            except Exception as query_error:
                print(f"❌ Test query failed: {query_error}")
            
            # Test if we can access the database schema
            try:
                tables = await conn.fetch("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    LIMIT 5
                """)
                print(f"✅ Found {len(tables)} tables in database")
                for table in tables:
                    print(f"  - {table['table_name']}")
            except Exception as schema_error:
                print(f"❌ Schema query failed: {schema_error}")
            
            await conn.close()
            print("✅ Connection closed successfully")
            
        else:
            print("❌ Failed to establish connection (None returned)")
            
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print(f"❌ Error type: {type(e).__name__}")
        
        # Check if it's a network/IP issue
        if "timeout" in str(e).lower() or "connection" in str(e).lower():
            print("\n🔍 This might be a network connectivity or IP whitelist issue!")
            print("   Check if your current IP is whitelisted in the database firewall")
        
        # Try to get more details
        import traceback
        print(f"\n📋 Full error traceback:")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_database_connection())
