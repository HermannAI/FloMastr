#!/usr/bin/env python3
import asyncio
import os
import asyncpg
import ssl
from dotenv import load_dotenv

load_dotenv()

async def test_db_connection():
    """Test database connection"""
    database_url = os.getenv("DATABASE_URL")
    print(f"Database URL: {database_url}")

    if not database_url:
        print("❌ DATABASE_URL not found")
        return False

    # Create SSL context
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    try:
        print("🔄 Attempting SSL connection...")
        conn = await asyncpg.connect(database_url, ssl=ssl_context)
        print("✅ SSL connection successful")

        # Test a simple query
        result = await conn.fetchval("SELECT 1")
        print(f"✅ Test query result: {result}")

        await conn.close()
        return True

    except Exception as e:
        print(f"❌ SSL connection failed: {e}")

        # Try non-SSL fallback
        try:
            print("🔄 Attempting non-SSL connection...")
            conn = await asyncpg.connect(database_url.replace('?sslmode=require', ''))
            print("✅ Non-SSL connection successful")

            # Test a simple query
            result = await conn.fetchval("SELECT 1")
            print(f"✅ Test query result: {result}")

            await conn.close()
            return True

        except Exception as e2:
            print(f"❌ Non-SSL connection also failed: {e2}")
            return False

async def test_tenant_resolution():
    """Test tenant resolution logic"""
    email = "hermann@changemastr.com"
    print(f"\n🔄 Testing tenant resolution for: {email}")

    # Check super admin emails
    super_admin_emails_str = os.getenv("SUPER_ADMIN_EMAILS")
    print(f"Super admin emails: {super_admin_emails_str}")

    if super_admin_emails_str:
        super_admin_emails = [e.strip() for e in super_admin_emails_str.split(',') if e.strip()]
        print(f"Parsed super admin emails: {super_admin_emails}")

        if email.lower() in [e.lower() for e in super_admin_emails]:
            print(f"✅ {email} is a super admin!")
            return True

    print(f"❌ {email} is not a super admin")
    return False

async def main():
    print("🧪 Testing FloMastr Database and API Routes")
    print("=" * 50)

    # Test database connection
    db_ok = await test_db_connection()

    # Test tenant resolution logic
    tenant_ok = await test_tenant_resolution()

    print("\n" + "=" * 50)
    if db_ok and tenant_ok:
        print("✅ All tests passed!")
    else:
        print("❌ Some tests failed!")

if __name__ == "__main__":
    asyncio.run(main())
