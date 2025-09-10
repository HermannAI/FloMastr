#!/usr/bin/env python3
"""
Database Schema Migration: Add Missing Columns for Tenant Provisioning
This script adds the missing columns identified in the schema verification
"""

import asyncio
import asyncpg
import os

async def migrate_database_schema():
    """Add missing columns to make database schema match code expectations"""
    
    # Set the database URL
    os.environ["DATABASE_URL"] = "postgresql://doadmin:AVNS_60oX1gbkyUjUxv2y63s@db-postgresql-blr1-flomastr-do-user-24629085-0.g.db.ondigitalocean.com:25060/defaultdb?sslmode=require"
    
    print("🔧 DATABASE SCHEMA MIGRATION")
    print("=" * 50)
    print("Adding missing columns for tenant provisioning...")
    
    try:
        conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
        print("✅ Database connection successful")
        
        # Start a transaction for all migrations
        async with conn.transaction():
            
            # 1. Add missing columns to user_roles table
            print("\n📋 UPDATING USER_ROLES TABLE:")
            
            # Check if email column already exists
            email_exists = await conn.fetchval("""
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'user_roles' AND column_name = 'email'
                )
            """)
            
            if not email_exists:
                await conn.execute("""
                    ALTER TABLE user_roles 
                    ADD COLUMN email VARCHAR(255) UNIQUE
                """)
                print("  ✅ Added 'email' column")
            else:
                print("  ✅ 'email' column already exists")
            
            # Check if assigned_by column already exists
            assigned_by_exists = await conn.fetchval("""
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'user_roles' AND column_name = 'assigned_by'
                )
            """)
            
            if not assigned_by_exists:
                await conn.execute("""
                    ALTER TABLE user_roles 
                    ADD COLUMN assigned_by VARCHAR(255)
                """)
                print("  ✅ Added 'assigned_by' column")
            else:
                print("  ✅ 'assigned_by' column already exists")
            
            # Check if assigned_at column already exists
            assigned_at_exists = await conn.fetchval("""
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'user_roles' AND column_name = 'assigned_at'
                )
            """)
            
            if not assigned_at_exists:
                await conn.execute("""
                    ALTER TABLE user_roles 
                    ADD COLUMN assigned_at TIMESTAMP WITH TIME ZONE
                """)
                print("  ✅ Added 'assigned_at' column")
            else:
                print("  ✅ 'assigned_at' column already exists")
            
            # Check if updated_at column already exists
            updated_at_exists = await conn.fetchval("""
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'user_roles' AND column_name = 'updated_at'
                )
            """)
            
            if not updated_at_exists:
                await conn.execute("""
                    ALTER TABLE user_roles 
                    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE
                """)
                print("  ✅ Added 'updated_at' column")
            else:
                print("  ✅ 'updated_at' column already exists")
            
            # 2. Add missing column to tenant_memberships table
            print("\n📋 UPDATING TENANT_MEMBERSHIPS TABLE:")
            
            # Check if tenant_slug column already exists
            tenant_slug_exists = await conn.fetchval("""
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'tenant_memberships' AND column_name = 'tenant_slug'
                )
            """)
            
            if not tenant_slug_exists:
                await conn.execute("""
                    ALTER TABLE tenant_memberships 
                    ADD COLUMN tenant_slug VARCHAR(100)
                """)
                print("  ✅ Added 'tenant_slug' column")
            else:
                print("  ✅ 'tenant_slug' column already exists")
            
            print("\n🎉 DATABASE MIGRATION COMPLETED SUCCESSFULLY!")
            
        await conn.close()
        
        # 3. Verify the migration worked
        print("\n🔍 VERIFYING MIGRATION:")
        await verify_migration()
        
    except Exception as e:
        print(f"❌ Migration failed: {type(e).__name__}: {str(e)}")
        raise

async def verify_migration():
    """Verify that all expected columns are now present"""
    
    conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
    
    try:
        # Test the queries that were failing before
        print("  🧪 Testing user_roles query...")
        result = await conn.fetchrow(
            "SELECT id, email FROM user_roles WHERE email = $1",
            "test@example.com"
        )
        print("  ✅ User_roles query with email column works!")
        
        # Check all expected columns exist
        print("  🧪 Checking all expected columns...")
        
        # Check user_roles columns
        user_roles_columns = await conn.fetch("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'user_roles' 
            ORDER BY ordinal_position
        """)
        actual_user_roles_cols = [col['column_name'] for col in user_roles_columns]
        expected_user_roles_cols = ['id', 'user_id', 'role', 'created_at', 'email', 'assigned_by', 'assigned_at', 'updated_at']
        
        missing_user_cols = set(expected_user_roles_cols) - set(actual_user_roles_cols)
        if missing_user_cols:
            print(f"  ❌ Still missing user_roles columns: {missing_user_cols}")
        else:
            print("  ✅ All user_roles columns present!")
        
        # Check tenant_memberships columns
        memberships_columns = await conn.fetch("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'tenant_memberships' 
            ORDER BY ordinal_position
        """)
        actual_memberships_cols = [col['column_name'] for col in memberships_columns]
        expected_memberships_cols = ['id', 'tenant_id', 'user_id', 'role', 'status', 'created_at', 'updated_at', 'tenant_slug']
        
        missing_membership_cols = set(expected_memberships_cols) - set(actual_memberships_cols)
        if missing_membership_cols:
            print(f"  ❌ Still missing tenant_memberships columns: {missing_membership_cols}")
        else:
            print("  ✅ All tenant_memberships columns present!")
            
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(migrate_database_schema())
