-- OctoISP Database Schema
-- Core entities with multi-tenant RLS support

-- Enable Row Level Security
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
SET statement_timeout = 0;

-- Supabase Auth compat (preview/local). In Supabase, these objects already exist.
CREATE SCHEMA IF NOT EXISTS auth;
DO $auth$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'auth' AND c.relname = 'users'
  ) THEN
    CREATE TABLE auth.users (
      id UUID PRIMARY KEY,
      email TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END
$auth$;

DO $auth$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'auth' AND p.proname = 'uid'
  ) THEN
    CREATE FUNCTION auth.uid()
    RETURNS uuid
    LANGUAGE sql
    STABLE
    AS $fn$
      SELECT COALESCE(
        NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid,
        NULLIF((NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'), '')::uuid
      );
    $fn$;
  END IF;
END
$auth$;

-- Providers table - top level entity
CREATE TABLE IF NOT EXISTS providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    plan_name VARCHAR(100),
    sla_target VARCHAR(50),
    last_invoice_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- POPs (Points of Presence) table
CREATE TABLE pops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(255),
    country VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status VARCHAR(50) DEFAULT 'active',
    uplink_capacity VARCHAR(50),
    utilization_percent REAL,
    latency_ms REAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider_id, slug)
);

-- Customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    pop_id UUID REFERENCES pops(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(255),
    country VARCHAR(100),
    plan_name VARCHAR(100),
    last_billing_date DATE,
    contract_start_date DATE,
    contract_end_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Devices table (CPEs and ONTs)
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    pop_id UUID REFERENCES pops(id) ON DELETE SET NULL,
    serial_number VARCHAR(255) NOT NULL,
    oui VARCHAR(6) NOT NULL, -- First 6 chars of MAC
    product_class VARCHAR(255),
    software_version VARCHAR(255),
    hardware_version VARCHAR(255),
    wan_ip INET,
    lan_ip INET,
    mac_address MACADDR,
    optical_rx_power REAL,
    optical_tx_power REAL,
    uptime BIGINT,
    last_contact TIMESTAMP WITH TIME ZONE,
    connection_type VARCHAR(50) DEFAULT 'ethernet', -- ethernet, fiber, wifi, etc
    device_type VARCHAR(50) DEFAULT 'cpe', -- cpe, ont, router, switch, ap
    vendor VARCHAR(100),
    model VARCHAR(100),
    status VARCHAR(50) DEFAULT 'offline',
    location TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(serial_number)
);

-- Network tools history
CREATE TABLE IF NOT EXISTS network_tool_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    user_id UUID,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    pop_id UUID REFERENCES pops(id) ON DELETE SET NULL,
    tool VARCHAR(50) NOT NULL,
    target VARCHAR(255) NOT NULL,
    parameters JSONB DEFAULT '{}'::jsonb,
    output TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE network_tool_runs ENABLE ROW LEVEL SECURITY;
DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'network_tool_runs'
      AND policyname = 'network_tool_runs_isolation_policy'
  ) THEN
    CREATE POLICY network_tool_runs_isolation_policy ON network_tool_runs
      FOR ALL USING (provider_id IN (SELECT provider_id FROM user_provider_access WHERE user_id = auth.uid()));
  END IF;
END
$policy$;

-- Users and RBAC
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL, -- e.g., "devices.view", "customers.edit", "reports.generate"
    description TEXT,
    module VARCHAR(100) NOT NULL, -- e.g., "devices", "customers", "reports"
    action VARCHAR(50) NOT NULL, -- e.g., "view", "create", "edit", "delete", "provision"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- Permissions directly assigned to users (custom overrides)
CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, permission_id),
    FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE user_provider_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- Reference to Supabase auth.users
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    granted_by UUID, -- User who granted the access
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider_id),
    FOREIGN KEY (granted_by) REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_devices_provider_id ON devices(provider_id);
CREATE INDEX idx_devices_customer_id ON devices(customer_id);
CREATE INDEX idx_devices_pop_id ON devices(pop_id);
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_customers_provider_id ON customers(provider_id);
CREATE INDEX idx_customers_pop_id ON customers(pop_id);
CREATE INDEX idx_pops_provider_id ON pops(provider_id);

-- Insert default roles
INSERT INTO roles (id, name, description, is_system_role) VALUES
(uuid_generate_v4(), 'admin_global', 'Global administrator with access to all providers', true),
(uuid_generate_v4(), 'admin_provider', 'Provider administrator with access to a specific provider', true),
(uuid_generate_v4(), 'noc_operator', 'Network Operations Center operator', true),
(uuid_generate_v4(), 'technician', 'Field technician with limited access', true),
(uuid_generate_v4(), 'viewer', 'Viewer with read-only access', true);

-- Insert default permissions
INSERT INTO permissions (id, name, description, module, action) VALUES
(uuid_generate_v4(), 'dashboard.view', 'View dashboard information', 'dashboard', 'view'),
(uuid_generate_v4(), 'devices.view', 'View devices', 'devices', 'view'),
(uuid_generate_v4(), 'devices.create', 'Create new devices', 'devices', 'create'),
(uuid_generate_v4(), 'devices.edit', 'Edit existing devices', 'devices', 'edit'),
(uuid_generate_v4(), 'devices.delete', 'Delete devices', 'devices', 'delete'),
(uuid_generate_v4(), 'devices.provision', 'Provision devices', 'devices', 'provision'),
(uuid_generate_v4(), 'devices.wifi_control', 'Control WiFi settings', 'devices', 'wifi_control'),
(uuid_generate_v4(), 'devices.execute_commands', 'Execute commands on devices', 'devices', 'execute_commands'),
(uuid_generate_v4(), 'devices.discover', 'Run automatic device discovery', 'devices', 'discover'),
(uuid_generate_v4(), 'pops.view', 'View POPs', 'pops', 'view'),
(uuid_generate_v4(), 'pops.create', 'Create POPs', 'pops', 'create'),
(uuid_generate_v4(), 'pops.edit', 'Edit POPs', 'pops', 'edit'),
(uuid_generate_v4(), 'pops.delete', 'Delete POPs', 'pops', 'delete'),
(uuid_generate_v4(), 'providers.view', 'View providers', 'providers', 'view'),
(uuid_generate_v4(), 'providers.manage', 'Manage providers', 'providers', 'manage'),
(uuid_generate_v4(), 'customers.view', 'View customers', 'customers', 'view'),
(uuid_generate_v4(), 'customers.create', 'Create new customers', 'customers', 'create'),
(uuid_generate_v4(), 'customers.edit', 'Edit existing customers', 'customers', 'edit'),
(uuid_generate_v4(), 'customers.delete', 'Delete customers', 'customers', 'delete'),
(uuid_generate_v4(), 'alerts.view', 'View alerts', 'alerts', 'view'),
(uuid_generate_v4(), 'alerts.manage', 'Manage alerts', 'alerts', 'manage'),
(uuid_generate_v4(), 'reports.view', 'View reports', 'reports', 'view'),
(uuid_generate_v4(), 'reports.generate', 'Generate custom reports', 'reports', 'generate'),
(uuid_generate_v4(), 'tools.access', 'Access network tools', 'tools', 'access'),
(uuid_generate_v4(), 'users.manage', 'Manage users', 'users', 'manage'),
(uuid_generate_v4(), 'settings.manage', 'Manage system settings', 'settings', 'manage');

-- Audit log table for immutable audit trail
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- Reference to Supabase auth.users
    provider_id UUID REFERENCES providers(id),
    action VARCHAR(100) NOT NULL, -- e.g., 'device.created', 'customer.updated'
    resource_type VARCHAR(50) NOT NULL, -- e.g., 'device', 'customer'
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB, -- Additional context about the action
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts table
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    pop_id UUID REFERENCES pops(id) ON DELETE CASCADE,
    alert_type VARCHAR(100) NOT NULL, -- e.g., 'device_offline', 'high_cpu', 'bandwidth_threshold'
    severity VARCHAR(20) NOT NULL DEFAULT 'info', -- info, warning, critical
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'open', -- open, acknowledged, resolved, closed
    priority INTEGER DEFAULT 0, -- Higher number means higher priority
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID, -- Reference to Supabase auth.users
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID, -- Reference to Supabase auth.users
    closed_at TIMESTAMP WITH TIME ZONE,
    closed_by UUID, -- Reference to Supabase auth.users
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (acknowledged_by) REFERENCES auth.users(id),
    FOREIGN KEY (resolved_by) REFERENCES auth.users(id),
    FOREIGN KEY (closed_by) REFERENCES auth.users(id)
);

-- TR-069/181 templates table
CREATE TABLE tr069_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    vendor VARCHAR(100), -- Apply to specific vendor
    model VARCHAR(100), -- Apply to specific model
    firmware_version VARCHAR(100), -- Apply to specific firmware
    parameters JSONB, -- TR-069 parameters to set
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and policies (must run after user_provider_access exists)
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'providers' AND policyname = 'providers_isolation_policy'
  ) THEN
    CREATE POLICY providers_isolation_policy ON providers
      FOR ALL USING (id IN (SELECT provider_id FROM user_provider_access WHERE user_id = auth.uid()));
  END IF;
END
$policy$;

ALTER TABLE pops ENABLE ROW LEVEL SECURITY;
DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'pops' AND policyname = 'pops_isolation_policy'
  ) THEN
    CREATE POLICY pops_isolation_policy ON pops
      FOR ALL USING (provider_id IN (SELECT provider_id FROM user_provider_access WHERE user_id = auth.uid()));
  END IF;
END
$policy$;

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'customers' AND policyname = 'customers_isolation_policy'
  ) THEN
    CREATE POLICY customers_isolation_policy ON customers
      FOR ALL USING (provider_id IN (SELECT provider_id FROM user_provider_access WHERE user_id = auth.uid()));
  END IF;
END
$policy$;

ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'devices' AND policyname = 'devices_isolation_policy'
  ) THEN
    CREATE POLICY devices_isolation_policy ON devices
      FOR ALL USING (provider_id IN (SELECT provider_id FROM user_provider_access WHERE user_id = auth.uid()));
  END IF;
END
$policy$;

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'audit_log' AND policyname = 'audit_log_isolation_policy'
  ) THEN
    CREATE POLICY audit_log_isolation_policy ON audit_log
      FOR ALL USING (provider_id IS NULL OR provider_id IN (
        SELECT provider_id FROM user_provider_access WHERE user_id = auth.uid()
      ));
  END IF;
END
$policy$;

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'alerts' AND policyname = 'alerts_isolation_policy'
  ) THEN
    CREATE POLICY alerts_isolation_policy ON alerts
      FOR ALL USING (provider_id IN (SELECT provider_id FROM user_provider_access WHERE user_id = auth.uid()));
  END IF;
END
$policy$;

ALTER TABLE tr069_templates ENABLE ROW LEVEL SECURITY;
DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'tr069_templates' AND policyname = 'tr069_templates_isolation_policy'
  ) THEN
    CREATE POLICY tr069_templates_isolation_policy ON tr069_templates
      FOR ALL USING (provider_id IN (SELECT provider_id FROM user_provider_access WHERE user_id = auth.uid()));
  END IF;
END
$policy$;
