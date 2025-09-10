#!/usr/bin/env python3
"""
Test script to verify Relational Pulse tables exist
"""
import asyncio
import os
import asyncpg
import ssl
from dotenv import load_dotenv

load_dotenv()

async def test_pulse_tables():
    """Test Relational Pulse tables"""
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        print("❌ DATABASE_URL environment variable not configured")
        return False

    # Create SSL context
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    try:
        print("🔄 Connecting to database...")
        conn = await asyncpg.connect(database_url, ssl=ssl_context)
        print("✅ Database connection successful")

        # Check all Relational Pulse tables
        pulse_tables = [
            'pulse_campaigns',
            'pulse_messages', 
            'conversation_topics',
            'conversations',
            'users'
        ]
        
        print("\n🔍 Checking Relational Pulse tables...")
        for table in pulse_tables:
            try:
                result = await conn.fetchval(f"SELECT COUNT(*) FROM {table}")
                print(f"✅ Table {table} exists with {result} rows")
            except Exception as e:
                print(f"❌ Table {table} error: {e}")

        # Check if pulse_settings column exists in tenants
        print("\n🔍 Checking pulse_settings in tenants table...")
        try:
            result = await conn.fetchval("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'tenants' AND column_name = 'pulse_settings'
            """)
            if result:
                print("✅ pulse_settings column exists in tenants table")
            else:
                print("❌ pulse_settings column missing from tenants table")
        except Exception as e:
            print(f"❌ Error checking pulse_settings: {e}")

        # Check if customer_context column exists in users
        print("\n🔍 Checking customer_context in users table...")
        try:
            result = await conn.fetchval("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'customer_context'
            """)
            if result:
                print("✅ customer_context column exists in users table")
            else:
                print("❌ customer_context column missing from users table")
        except Exception as e:
            print(f"❌ Error checking customer_context: {e}")

        await conn.close()
        print("\n🎉 Relational Pulse database verification completed!")
        return True

    except Exception as e:
        print(f"❌ Database test failed: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_pulse_tables())
    exit(0 if success else 1)
