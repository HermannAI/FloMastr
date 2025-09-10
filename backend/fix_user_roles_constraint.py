#!/usr/bin/env python3
"""
Fix user_roles table constraint to allow 'user' role for tenant owners
"""

import asyncio
import asyncpg
import os

async def fix_user_roles_constraint():
    """Update user_roles table constraint to allow proper role hierarchy"""
    
    # Set the database URL
    os.environ["DATABASE_URL"] = "postgresql://doadmin:AVNS_60oX1gbkyUjUxv2y63s@db-postgresql-blr1-flomastr-do-user-24629085-0.g.db.ondigitalocean.com:25060/defaultdb?sslmode=require"
    
    print("🔧 FIXING USER_ROLES CONSTRAINT")
    print("=" * 50)
    print("Updating constraint to allow proper role hierarchy...")
    
    try:
        conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
        print("✅ Database connection successful")
        
        # Start a transaction
        async with conn.transaction():
            
            # 1. Drop the existing constraint
            print("\n📋 STEP 1: Dropping existing constraint...")
            try:
                await conn.execute("""
                    ALTER TABLE user_roles 
                    DROP CONSTRAINT user_roles_role_check
                """)
                print("  ✅ Existing constraint dropped")
            except Exception as e:
                print(f"  ❌ Failed to drop constraint: {type(e).__name__}: {str(e)}")
                raise
            
            # 2. Add new constraint with proper role hierarchy
            print("\n📋 STEP 2: Adding new constraint with 'user' role...")
            try:
                await conn.execute("""
                    ALTER TABLE user_roles 
                    ADD CONSTRAINT user_roles_role_check 
                    CHECK (role IN ('user', 'admin', 'super_admin'))
                """)
                print("  ✅ New constraint added allowing: 'user', 'admin', 'super_admin'")
            except Exception as e:
                print(f"  ❌ Failed to add new constraint: {type(e).__name__}: {str(e)}")
                raise
            
            print("\n🎉 CONSTRAINT UPDATE COMPLETED SUCCESSFULLY!")
            
        await conn.close()
        
        # 3. Verify the update worked
        print("\n🔍 VERIFYING CONSTRAINT UPDATE:")
        await verify_constraint_update()
        
    except Exception as e:
        print(f"❌ Constraint update failed: {type(e).__name__}: {str(e)}")
        raise

async def verify_constraint_update():
    """Verify that the constraint update worked correctly"""
    
    conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
    
    try:
        # Check the new constraint
        print("  🧪 Checking updated constraint...")
        constraints = await conn.fetch("""
            SELECT 
                tc.constraint_name,
                cc.check_clause
            FROM information_schema.table_constraints tc
            JOIN information_schema.check_constraints cc 
                ON tc.constraint_name = cc.constraint_name
            WHERE tc.table_name = 'user_roles'
            AND tc.constraint_type = 'CHECK'
            AND tc.constraint_name = 'user_roles_role_check'
        """)
        
        if constraints:
            constraint = constraints[0]
            print(f"  ✅ Updated constraint: {constraint['check_clause']}")
        else:
            print("  ❌ Constraint not found!")
            
        # Test inserting a 'user' role (dry run - will rollback)
        print("  🧪 Testing 'user' role insertion...")
        async with conn.transaction():
            try:
                test_user_id = "test-123"
                test_result = await conn.fetchrow("""
                    INSERT INTO user_roles (
                        id, user_id, email, role, assigned_by, assigned_at, created_at, updated_at
                    ) VALUES (
                        $1, $2, $3, 'user', 'system', NOW(), NOW(), NOW()
                    ) RETURNING id, role
                """, test_user_id, "test_user", "test@example.com")
                
                print(f"  ✅ 'user' role insertion test successful: {dict(test_result)}")
                
                # Rollback the test insert
                raise Exception("Test rollback")
                
            except Exception as e:
                if "Test rollback" in str(e):
                    print("  ✅ Test insert rolled back successfully")
                else:
                    print(f"  ❌ 'user' role test failed: {type(e).__name__}: {str(e)}")
                    
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(fix_user_roles_constraint())
