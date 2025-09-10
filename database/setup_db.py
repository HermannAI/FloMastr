#!/usr/bin/env python3
"""
Database setup script for FloMastr
"""
import asyncio
import os
import asyncpg
import ssl
from dotenv import load_dotenv

load_dotenv()

async def setup_database():
    """Set up database tables"""
    database_url = os.getenv("DATABASE_URL")
    print(f"Database URL: {database_url[:50]}...")

    if not database_url:
        print("❌ DATABASE_URL environment variable not configured")
        return False

    # Create SSL context
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    try:
        print("🔄 Attempting database connection...")
        conn = await asyncpg.connect(database_url, ssl=ssl_context)
        print("✅ Database connection successful")

        # Create ENUM types
        print("📋 Creating ENUM types...")
        await conn.execute("""
            DO $$ BEGIN
                CREATE TYPE tenant_status AS ENUM ('active', 'inactive', 'suspended');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """)

        await conn.execute("""
            DO $$ BEGIN
                CREATE TYPE membership_role AS ENUM ('owner', 'admin', 'member');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """)

        await conn.execute("""
            DO $$ BEGIN
                CREATE TYPE membership_status AS ENUM ('active', 'pending', 'inactive');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """)

        await conn.execute("""
            DO $$ BEGIN
                CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """)

        # Create user_roles table
        print("📋 Creating user_roles table...")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS user_roles (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE NOT NULL,
                role user_role DEFAULT 'user',
                assigned_by VARCHAR(255),
                assigned_at TIMESTAMPTZ DEFAULT NOW(),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ
            );
        """)

        # Create tenants table
        print("📋 Creating tenants table...")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS tenants (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                slug VARCHAR(63) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                status tenant_status DEFAULT 'active',
                n8n_url VARCHAR(255),
                branding_settings JSONB DEFAULT '{}',
                confidence_threshold FLOAT DEFAULT 0.8,
                hot_ttl_days INTEGER DEFAULT 30,
                deleted_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ
            );
        """)

        # Add missing columns to existing tenants table
        print("📋 Adding missing columns to tenants table...")
        missing_columns = [
            "ALTER TABLE tenants ADD COLUMN IF NOT EXISTS branding_settings JSONB DEFAULT '{}';",
            "ALTER TABLE tenants ADD COLUMN IF NOT EXISTS confidence_threshold FLOAT DEFAULT 0.8;", 
            "ALTER TABLE tenants ADD COLUMN IF NOT EXISTS hot_ttl_days INTEGER DEFAULT 30;",
            "ALTER TABLE tenants ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;"
        ]
        
        for alter_sql in missing_columns:
            try:
                await conn.execute(alter_sql)
            except Exception as e:
                print(f"⚠️ Column addition warning: {e}")

        # Create tenant_memberships table
        print("📋 Creating tenant_memberships table...")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS tenant_memberships (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                user_id VARCHAR(255) NOT NULL,
                role membership_role DEFAULT 'member',
                status membership_status DEFAULT 'active',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ,
                UNIQUE (tenant_id, user_id)
            );
        """)

        # Create workflows table
        print("📋 Creating workflows table...")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS workflows (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                n8n_workflow_id VARCHAR(255),
                category VARCHAR(100),
                tags TEXT[],
                is_active BOOLEAN DEFAULT true,
                is_public BOOLEAN DEFAULT false,
                metadata JSONB,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ,
                UNIQUE (tenant_id, n8n_workflow_id)
            );
        """)

        # Create workflow_executions table
        print("📋 Creating workflow_executions table...")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS workflow_executions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                n8n_execution_id VARCHAR(255),
                status VARCHAR(50) DEFAULT 'running',
                started_at TIMESTAMPTZ DEFAULT NOW(),
                finished_at TIMESTAMPTZ,
                execution_data JSONB,
                error_message TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)

        # Create knowledge_bases table
        print("📋 Creating knowledge_bases table...")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS knowledge_bases (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                source_type VARCHAR(50), -- 'upload', 'url', 'api', etc.
                source_metadata JSONB,
                document_count INTEGER DEFAULT 0,
                total_chunks INTEGER DEFAULT 0,
                last_updated TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ
            );
        """)

        # Create embeddings table (vector storage)
        print("� Creating embeddings table...")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS embeddings (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                knowledge_base_id UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                chunk_text TEXT NOT NULL,
                chunk_metadata JSONB,
                embedding_vector FLOAT[1536], -- OpenAI ada-002 dimensions
                document_name VARCHAR(255),
                chunk_index INTEGER,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)

        # Create user_preferences table
        print("📋 Creating user_preferences table...")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS user_preferences (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id VARCHAR(255) NOT NULL,
                tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
                preferences JSONB DEFAULT '{}',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ,
                UNIQUE (user_id, tenant_id)
            );
        """)

        # Create webchat_sessions table (already used by tenants API)
        print("📋 Creating webchat_sessions table...")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS webchat_sessions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                session_key VARCHAR(255) UNIQUE NOT NULL,
                tenant_id VARCHAR(255) NOT NULL,
                workflow_id VARCHAR(255) NOT NULL,
                user_id VARCHAR(255) NOT NULL,
                messages JSONB DEFAULT '[]',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)

        # Create pulse_campaigns table for Relational Pulse analytics
        print("📋 Creating pulse_campaigns table...")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS pulse_campaigns (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                campaign_date DATE NOT NULL,
                total_users INTEGER DEFAULT 0,
                messages_sent INTEGER DEFAULT 0,
                delivery_rate FLOAT DEFAULT 0.0,
                open_rate FLOAT DEFAULT 0.0,
                response_rate FLOAT DEFAULT 0.0,
                engagement_score FLOAT DEFAULT 0.0,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ
            );
        """)

        # Create pulse_messages table for individual message tracking
        print("📋 Creating pulse_messages table...")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS pulse_messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                campaign_id UUID NOT NULL REFERENCES pulse_campaigns(id) ON DELETE CASCADE,
                user_id VARCHAR(255) NOT NULL,
                whatsapp_number VARCHAR(20) NOT NULL,
                message_content TEXT,
                personalization_score FLOAT DEFAULT 0.0,
                sent_at TIMESTAMPTZ,
                delivered_at TIMESTAMPTZ,
                read_at TIMESTAMPTZ,
                responded_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)

        # Add pulse_settings column to tenants table
        print("📋 Adding pulse_settings to tenants table...")
        await conn.execute("""
            ALTER TABLE tenants 
            ADD COLUMN IF NOT EXISTS pulse_settings JSONB DEFAULT '{"enabled": false}';
        """)

        # Create conversation_topics table for context tracking
        print("📋 Creating conversation_topics table...")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS conversation_topics (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                conversation_id UUID NOT NULL,
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                topic VARCHAR(255) NOT NULL,
                confidence_score FLOAT DEFAULT 0.0,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)

        # Create conversations table for context (if not exists)
        print("📋 Creating conversations table...")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                user_id VARCHAR(255) NOT NULL,
                whatsapp_number VARCHAR(20),
                status VARCHAR(50) DEFAULT 'active',
                last_message_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ
            );
        """)

        # Create users table for Relational Pulse
        print("📋 Creating users table...")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id VARCHAR(255) UNIQUE NOT NULL,
                tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
                name VARCHAR(255),
                whatsapp_number VARCHAR(20),
                email VARCHAR(255),
                status VARCHAR(50) DEFAULT 'active',
                last_interaction TIMESTAMPTZ,
                customer_context JSONB DEFAULT '{}',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ
            );
        """)

        # Add pulse_preferences to user_preferences (users table now exists)
        print("📋 Adding pulse preferences support...")
        await conn.execute("""
            UPDATE user_preferences 
            SET preferences = preferences || '{"pulse_preferences": {"enabled": true, "frequency": "weekly"}}'::jsonb
            WHERE preferences->>'pulse_preferences' IS NULL;
        """)

        # Create useful indexes for performance
        print("📋 Creating performance indexes...")
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_workflows_tenant_id ON workflows(tenant_id);",
            "CREATE INDEX IF NOT EXISTS idx_workflows_active ON workflows(is_active) WHERE is_active = true;",
            "CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);",
            "CREATE INDEX IF NOT EXISTS idx_workflow_executions_tenant_id ON workflow_executions(tenant_id);",
            "CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);",
            "CREATE INDEX IF NOT EXISTS idx_workflow_executions_started_at ON workflow_executions(started_at);",
            "CREATE INDEX IF NOT EXISTS idx_knowledge_bases_tenant_id ON knowledge_bases(tenant_id);",
            "CREATE INDEX IF NOT EXISTS idx_embeddings_knowledge_base_id ON embeddings(knowledge_base_id);",
            "CREATE INDEX IF NOT EXISTS idx_embeddings_tenant_id ON embeddings(tenant_id);",
            "CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);",
            "CREATE INDEX IF NOT EXISTS idx_webchat_sessions_session_key ON webchat_sessions(session_key);",
            "CREATE INDEX IF NOT EXISTS idx_webchat_sessions_tenant_id ON webchat_sessions(tenant_id);",
            "CREATE INDEX IF NOT EXISTS idx_tenant_memberships_user_id ON tenant_memberships(user_id);",
            "CREATE INDEX IF NOT EXISTS idx_tenant_memberships_tenant_id ON tenant_memberships(tenant_id);",
            "CREATE INDEX IF NOT EXISTS idx_pulse_campaigns_tenant_id ON pulse_campaigns(tenant_id);",
            "CREATE INDEX IF NOT EXISTS idx_pulse_campaigns_date ON pulse_campaigns(campaign_date);",
            "CREATE INDEX IF NOT EXISTS idx_pulse_messages_campaign_id ON pulse_messages(campaign_id);",
            "CREATE INDEX IF NOT EXISTS idx_pulse_messages_user_id ON pulse_messages(user_id);",
            "CREATE INDEX IF NOT EXISTS idx_conversation_topics_conversation_id ON conversation_topics(conversation_id);",
            "CREATE INDEX IF NOT EXISTS idx_conversations_tenant_user ON conversations(tenant_id, user_id);",
            "CREATE INDEX IF NOT EXISTS idx_conversations_whatsapp ON conversations(whatsapp_number);"
        ]
        
        for index_sql in indexes:
            try:
                await conn.execute(index_sql)
            except Exception as e:
                print(f"⚠️ Index creation warning: {e}")

        # Verify all tables exist
        print("�🔍 Verifying tables...")
        tables = [
            'tenants', 'user_roles', 'tenant_memberships', 
            'workflows', 'workflow_executions', 'knowledge_bases', 
            'embeddings', 'user_preferences', 'webchat_sessions'
        ]
        for table in tables:
            try:
                result = await conn.fetchval(f"SELECT COUNT(*) FROM {table}")
                print(f"✅ Table {table} exists with {result} rows")
            except Exception as e:
                print(f"❌ Table {table} error: {e}")

        await conn.close()
        print("🎉 Database setup completed successfully!")
        return True

    except Exception as e:
        print(f"❌ Database setup failed: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(setup_database())
    exit(0 if success else 1)
