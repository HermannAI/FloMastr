#!/usr/bin/env python3
"""
Simple database connection test to match DBeaver's approach
"""
import asyncio
import asyncpg
import os
import dotenv

# Load environment variables
dotenv.load_dotenv()

async def test_simple_connection():
    """Test database connection with different approaches"""
    print("=" * 60)
    print("SIMPLE DATABASE CONNECTION TEST")
    print("=" * 60)
    
    database_url = os.getenv("DATABASE_URL")
    print(f"Database URL: {database_url[:80]}...")
    
    # Parse the URL manually to see components
    if database_url:
        import urllib.parse
        parsed = urllib.parse.urlparse(database_url)
        print(f"Host: {parsed.hostname}")
        print(f"Port: {parsed.port}")
        print(f"Database: {parsed.path[1:]}")  # Remove leading /
        print(f"Username: {parsed.username}")
        print(f"SSL Mode: {parsed.query}")
    
    # Test 1: Direct connection with parsed parameters
    print("\n🔍 Test 1: Direct connection with individual parameters...")
    try:
        parsed = urllib.parse.urlparse(database_url)
        conn = await asyncpg.connect(
            host=parsed.hostname,
            port=parsed.port,
            database=parsed.path[1:],  # Remove leading /
            user=parsed.username,
            password=parsed.password,
            ssl='require',
            timeout=30
        )
        print("✅ Direct connection successful!")
        result = await conn.fetchval('SELECT 1')
        print(f"✅ Test query result: {result}")
        await conn.close()
        return True
    except Exception as e:
        print(f"❌ Direct connection failed: {e}")
    
    # Test 2: Connection with different SSL settings
    print("\n🔍 Test 2: Connection with ssl='prefer'...")
    try:
        parsed = urllib.parse.urlparse(database_url)
        conn = await asyncpg.connect(
            host=parsed.hostname,
            port=parsed.port,
            database=parsed.path[1:],
            user=parsed.username,
            password=parsed.password,
            ssl='prefer',
            timeout=30
        )
        print("✅ SSL prefer connection successful!")
        result = await conn.fetchval('SELECT 1')
        print(f"✅ Test query result: {result}")
        await conn.close()
        return True
    except Exception as e:
        print(f"❌ SSL prefer connection failed: {e}")
    
    # Test 3: Connection without SSL
    print("\n🔍 Test 3: Connection without SSL...")
    try:
        parsed = urllib.parse.urlparse(database_url)
        conn = await asyncpg.connect(
            host=parsed.hostname,
            port=parsed.port,
            database=parsed.path[1:],
            user=parsed.username,
            password=parsed.password,
            ssl=False,
            timeout=30
        )
        print("✅ Non-SSL connection successful!")
        result = await conn.fetchval('SELECT 1')
        print(f"✅ Test query result: {result}")
        await conn.close()
        return True
    except Exception as e:
        print(f"❌ Non-SSL connection failed: {e}")
    
    return False

if __name__ == "__main__":
    success = asyncio.run(test_simple_connection())
    if success:
        print("\n🎉 Database connection is working!")
    else:
        print("\n❌ All connection attempts failed!")
