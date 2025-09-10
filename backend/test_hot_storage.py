#!/usr/bin/env python3
"""
Test hot storage tables functionality
"""
import asyncio
import os
import asyncpg
import ssl
from dotenv import load_dotenv

load_dotenv()

async def test_hot_storage_tables():
    """Test the newly created hot storage tables"""
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        print("❌ DATABASE_URL environment variable not configured")
        return False

    # Create SSL context
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    try:
        print("🔄 Testing hot storage tables...")
        conn = await asyncpg.connect(database_url, ssl=ssl_context)
        
        # Test 1: Check all tables exist and are accessible
        tables_to_test = [
            'tenants', 'user_roles', 'tenant_memberships',
            'workflows', 'workflow_executions', 'knowledge_bases',
            'embeddings', 'user_preferences', 'webchat_sessions'
        ]
        
        print("\n📋 Table Status:")
        for table in tables_to_test:
            try:
                count = await conn.fetchval(f"SELECT COUNT(*) FROM {table}")
                columns = await conn.fetch(f"""
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = '{table}' 
                    ORDER BY ordinal_position
                """)
                column_count = len(columns)
                print(f"✅ {table}: {count} rows, {column_count} columns")
            except Exception as e:
                print(f"❌ {table}: Error - {e}")
        
        # Test 2: Test basic workflow CRUD operations
        print("\n🔧 Testing Workflow Operations:")
        
        # Insert test tenant
        tenant_id = await conn.fetchval("""
            INSERT INTO tenants (slug, name, status)
            VALUES ('test-tenant', 'Test Tenant', 'active')
            ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
            RETURNING id
        """)
        print(f"✅ Test tenant ID: {tenant_id}")
        
        # Insert test workflow
        workflow_id = await conn.fetchval("""
            INSERT INTO workflows (tenant_id, name, description, category, is_active)
            VALUES ($1, 'Test Workflow', 'Test workflow description', 'automation', true)
            RETURNING id
        """, tenant_id)
        print(f"✅ Test workflow ID: {workflow_id}")
        
        # Insert test workflow execution
        execution_id = await conn.fetchval("""
            INSERT INTO workflow_executions (workflow_id, tenant_id, status, started_at)
            VALUES ($1, $2, 'success', NOW())
            RETURNING id
        """, workflow_id, tenant_id)
        print(f"✅ Test execution ID: {execution_id}")
        
        # Test 3: Test knowledge base operations
        print("\n📚 Testing Knowledge Base Operations:")
        
        kb_id = await conn.fetchval("""
            INSERT INTO knowledge_bases (tenant_id, name, description, source_type)
            VALUES ($1, 'Test Knowledge Base', 'Test KB description', 'upload')
            RETURNING id
        """, tenant_id)
        print(f"✅ Test knowledge base ID: {kb_id}")
        
        # Insert test embedding
        embedding_id = await conn.fetchval("""
            INSERT INTO embeddings (
                knowledge_base_id, tenant_id, chunk_text, 
                document_name, chunk_index
            ) VALUES ($1, $2, 'Test chunk text for embedding', 'test-doc.pdf', 1)
            RETURNING id
        """, kb_id, tenant_id)
        print(f"✅ Test embedding ID: {embedding_id}")
        
        # Test 4: Test user preferences
        print("\n👤 Testing User Preferences:")
        
        prefs_id = await conn.fetchval("""
            INSERT INTO user_preferences (user_id, tenant_id, preferences)
            VALUES ('test-user-123', $1, '{"theme": "dark", "language": "en"}')
            RETURNING id
        """, tenant_id)
        print(f"✅ Test user preferences ID: {prefs_id}")
        
        # Test 5: Clean up test data
        print("\n🧹 Cleaning up test data:")
        
        cleanup_queries = [
            "DELETE FROM embeddings WHERE id = $1",
            "DELETE FROM knowledge_bases WHERE id = $1", 
            "DELETE FROM user_preferences WHERE id = $1",
            "DELETE FROM workflow_executions WHERE id = $1",
            "DELETE FROM workflows WHERE id = $1",
            "DELETE FROM tenants WHERE id = $1"
        ]
        
        cleanup_ids = [embedding_id, kb_id, prefs_id, execution_id, workflow_id, tenant_id]
        
        for query, test_id in zip(cleanup_queries, cleanup_ids):
            await conn.execute(query, test_id)
        
        print("✅ Test data cleaned up successfully")
        
        await conn.close()
        print("\n🎉 Hot storage tables test completed successfully!")
        return True

    except Exception as e:
        print(f"❌ Hot storage test failed: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_hot_storage_tables())
    exit(0 if success else 1)
