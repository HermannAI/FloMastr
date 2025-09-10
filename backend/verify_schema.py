#!/usr/bin/env python3
"""
Database Schema Verification Script
Check if tables and columns match what the tenant provisioning code expects
"""

import asyncio
import asyncpg
import os

async def verify_database_schema():
    """Verify the database schema matches code expectations"""
    
    # Set the database URL
    os.environ["DATABASE_URL"] = "postgresql://doadmin:AVNS_60oX1gbkyUjUxv2y63s@db-postgresql-blr1-flomastr-do-user-24629085-0.g.db.ondigitalocean.com:25060/defaultdb?sslmode=require"
    
    print("🔍 DATABASE SCHEMA VERIFICATION")
    print("=" * 50)
    
    try:
        conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
        print("✅ Database connection successful")
        
        # 1. Check if tables exist
        print("\n📋 CHECKING TABLE EXISTENCE:")
        tables_to_check = ['tenants', 'user_roles', 'tenant_memberships']
        
        for table_name in tables_to_check:
            exists = await conn.fetchval(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)",
                table_name
            )
            status = "✅ EXISTS" if exists else "❌ MISSING"
            print(f"  {table_name}: {status}")
        
        # 2. Check tenants table schema
        print("\n📋 TENANTS TABLE SCHEMA:")
        tenants_columns = await conn.fetch("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'tenants' 
            ORDER BY ordinal_position
        """)
        
        if tenants_columns:
            for col in tenants_columns:
                print(f"  {col['column_name']}: {col['data_type']} (nullable: {col['is_nullable']})")
        else:
            print("  ❌ No columns found or table doesn't exist")
        
        # 3. Check user_roles table schema
        print("\n📋 USER_ROLES TABLE SCHEMA:")
        user_roles_columns = await conn.fetch("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'user_roles' 
            ORDER BY ordinal_position
        """)
        
        if user_roles_columns:
            for col in user_roles_columns:
                print(f"  {col['column_name']}: {col['data_type']} (nullable: {col['is_nullable']})")
        else:
            print("  ❌ No columns found or table doesn't exist")
        
        # 4. Check tenant_memberships table schema
        print("\n📋 TENANT_MEMBERSHIPS TABLE SCHEMA:")
        memberships_columns = await conn.fetch("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'tenant_memberships' 
            ORDER BY ordinal_position
        """)
        
        if memberships_columns:
            for col in memberships_columns:
                print(f"  {col['column_name']}: {col['data_type']} (nullable: {col['is_nullable']})")
        else:
            print("  ❌ No columns found or table doesn't exist")
        
        # 5. Test simple queries that the provisioning code uses
        print("\n🧪 TESTING QUERIES FROM PROVISIONING CODE:")
        
        # Test tenants query
        try:
            result = await conn.fetchrow(
                "SELECT id, slug FROM tenants WHERE slug = $1",
                "test-query"
            )
            print("  ✅ Tenants query works (SELECT id, slug FROM tenants WHERE slug = $1)")
        except Exception as e:
            print(f"  ❌ Tenants query failed: {type(e).__name__}: {str(e)}")
        
        # Test user_roles query
        try:
            result = await conn.fetchrow(
                "SELECT id, email FROM user_roles WHERE email = $1",
                "test@example.com"
            )
            print("  ✅ User_roles query works (SELECT id, email FROM user_roles WHERE email = $1)")
        except Exception as e:
            print(f"  ❌ User_roles query failed: {type(e).__name__}: {str(e)}")
        
        # 6. Check what the provisioning code expects vs what exists
        print("\n🔍 CODE EXPECTATIONS vs REALITY:")
        
        # Expected columns based on the provisioning code
        expected_tenants_cols = ['id', 'slug', 'name', 'status', 'n8n_url', 'created_at', 'updated_at']
        expected_user_roles_cols = ['id', 'email', 'role', 'assigned_by', 'assigned_at', 'created_at', 'updated_at']
        expected_memberships_cols = ['id', 'tenant_id', 'user_id', 'tenant_slug', 'role', 'status', 'created_at', 'updated_at']
        
        # Check tenants columns
        actual_tenants_cols = [col['column_name'] for col in tenants_columns]
        print(f"\n  TENANTS - Expected: {expected_tenants_cols}")
        print(f"  TENANTS - Actual:   {actual_tenants_cols}")
        missing_tenants = set(expected_tenants_cols) - set(actual_tenants_cols)
        if missing_tenants:
            print(f"  ❌ MISSING TENANTS COLUMNS: {missing_tenants}")
        else:
            print("  ✅ All expected tenants columns present")
        
        # Check user_roles columns
        actual_user_roles_cols = [col['column_name'] for col in user_roles_columns]
        print(f"\n  USER_ROLES - Expected: {expected_user_roles_cols}")
        print(f"  USER_ROLES - Actual:   {actual_user_roles_cols}")
        missing_user_roles = set(expected_user_roles_cols) - set(actual_user_roles_cols)
        if missing_user_roles:
            print(f"  ❌ MISSING USER_ROLES COLUMNS: {missing_user_roles}")
        else:
            print("  ✅ All expected user_roles columns present")
        
        # Check memberships columns
        actual_memberships_cols = [col['column_name'] for col in memberships_columns]
        print(f"\n  MEMBERSHIPS - Expected: {expected_memberships_cols}")
        print(f"  MEMBERSHIPS - Actual:   {actual_memberships_cols}")
        missing_memberships = set(expected_memberships_cols) - set(actual_memberships_cols)
        if missing_memberships:
            print(f"  ❌ MISSING MEMBERSHIPS COLUMNS: {missing_memberships}")
        else:
            print("  ✅ All expected memberships columns present")
        
        await conn.close()
        
    except Exception as e:
        print(f"❌ Database connection or query failed: {type(e).__name__}: {str(e)}")

if __name__ == "__main__":
    asyncio.run(verify_database_schema())
