-- Create custom ENUM types for status and roles
CREATE TYPE tenant_status AS ENUM ('active', 'inactive', 'suspended');

CREATE TYPE membership_role AS ENUM ('owner', 'admin', 'member');

CREATE TYPE membership_status AS ENUM ('active', 'pending', 'inactive');

CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');

-- User Roles Table
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role DEFAULT 'user',
    assigned_by VARCHAR(255),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Tenant Management Table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(63) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    status tenant_status DEFAULT 'active',
    n8n_url VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- User & Membership Management Table
CREATE TABLE tenant_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    role membership_role DEFAULT 'member',
    status membership_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    UNIQUE (tenant_id, user_id)
);
