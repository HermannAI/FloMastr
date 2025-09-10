#!/usr/bin/env python3
"""
Debug tenant provisioning by testing database operations step by step
"""

import asyncio
import asyncpg
import os
import uuid

async def debug_tenant_provisioning():
    """Debug each step of tenant provisioning"""
    
    # Set the database URL
    os.environ["DATABASE_URL"] = "postgresql://doadmin:AVNS_60oX1gbkyUjUxv2y63s@db-postgresql-blr1-flomastr-do-user-24629085-0.g.db.ondigitalocean.com:25060/defaultdb?sslmode=require"
    
    print("🔍 DEBUG TENANT PROVISIONING")
    print("=" * 50)
    
    try:
        conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
        print("✅ Database connection successful")
        
        # Test data
        tenant_slug = "debug-company"
        owner_email = "debug@test.com"
        tenant_name = "Debug Company"
        n8n_url = "https://debug.n8n.flomastr.com"
        
        async with conn.transaction():
            
            # 1. Test tenant creation
            print(f"\n📋 STEP 1: Creating tenant '{tenant_slug}'...")
            try:
                tenant_row = await conn.fetchrow(
                    """
                    INSERT INTO tenants (
                        slug, name, status, n8n_url, created_at, updated_at
                    ) VALUES (
                        $1, $2, 'active', $3, NOW(), NOW()
                    ) RETURNING id, slug, name, created_at
                    """,
                    tenant_slug,
                    tenant_name,
                    n8n_url
                )
                tenant_id = str(tenant_row['id'])
                print(f"  ✅ Tenant created with ID: {tenant_id}")
            except Exception as e:
                print(f"  ❌ Tenant creation failed: {type(e).__name__}: {str(e)}")
                raise
            
            # 2. Test user creation
            print(f"\n📋 STEP 2: Creating user '{owner_email}'...")
            user_id = str(uuid.uuid4())
            user_reference_id = f"user_{owner_email.replace('@', '_').replace('.', '_')}"
            
            try:
                print(f"  User ID: {user_id}")
                print(f"  User Reference ID: {user_reference_id}")
                print(f"  Email: {owner_email}")
                
                user_row = await conn.fetchrow(
                    """
                    INSERT INTO user_roles (
                        id, user_id, email, role, assigned_by, assigned_at, created_at, updated_at
                    ) VALUES (
                        $1, $2, $3, 'user', $4, NOW(), NOW(), NOW()
                    ) RETURNING id, user_id, email, role, created_at
                    """,
                    user_id,
                    user_reference_id,
                    owner_email,
                    'system'
                )
                print(f"  ✅ User created: {dict(user_row)}")
            except Exception as e:
                print(f"  ❌ User creation failed: {type(e).__name__}: {str(e)}")
                
                # Let's check what columns actually exist
                print(f"  🔍 Checking user_roles table schema...")
                schema = await conn.fetch("""
                    SELECT column_name, data_type, is_nullable 
                    FROM information_schema.columns 
                    WHERE table_name = 'user_roles' 
                    ORDER BY ordinal_position
                """)
                for col in schema:
                    print(f"    {col['column_name']}: {col['data_type']} ({'NULL' if col['is_nullable'] == 'YES' else 'NOT NULL'})")
                raise
            
            # 3. Test membership creation
            print(f"\n📋 STEP 3: Creating tenant membership...")
            try:
                membership_row = await conn.fetchrow(
                    """
                    INSERT INTO tenant_memberships (
                        tenant_id, user_id, tenant_slug, role, status, created_at, updated_at
                    ) VALUES (
                        $1, $2, $3, 'owner', 'active', NOW(), NOW()
                    ) RETURNING id, tenant_id, user_id, role, status, created_at
                    """,
                    tenant_id,
                    user_reference_id,
                    tenant_slug
                )
                membership_id = str(membership_row['id'])
                print(f"  ✅ Membership created with ID: {membership_id}")
            except Exception as e:
                print(f"  ❌ Membership creation failed: {type(e).__name__}: {str(e)}")
                raise
            
            print(f"\n🎉 ALL STEPS COMPLETED SUCCESSFULLY!")
            print(f"Tenant ID: {tenant_id}")
            print(f"User ID: {user_id}")
            print(f"Membership ID: {membership_id}")
            
        await conn.close()
        
    except Exception as e:
        print(f"❌ Debug failed: {type(e).__name__}: {str(e)}")
        raise

if __name__ == "__main__":
    asyncio.run(debug_tenant_provisioning())
