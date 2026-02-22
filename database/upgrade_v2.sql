-- OctoISP upgrade v2: multi-tenant NOC features

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Provider settings (JSONB)
CREATE TABLE IF NOT EXISTS provider_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider_id)
);

ALTER TABLE provider_settings ENABLE ROW LEVEL SECURITY;
DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'provider_settings'
      AND policyname = 'provider_settings_isolation_policy'
  ) THEN
    CREATE POLICY provider_settings_isolation_policy ON provider_settings
      FOR ALL USING (provider_id IN (SELECT provider_id FROM user_provider_access WHERE user_id = auth.uid()));
  END IF;
END
$policy$;

-- Device discovery runs
CREATE TABLE IF NOT EXISTS device_discovery_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    network_range VARCHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'running',
    total_found INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS device_discovery_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    run_id UUID NOT NULL REFERENCES device_discovery_runs(id) ON DELETE CASCADE,
    serial_number VARCHAR(255),
    product_class VARCHAR(255),
    vendor VARCHAR(100),
    ip INET,
    mac_address MACADDR,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE device_discovery_runs ENABLE ROW LEVEL SECURITY;
DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'device_discovery_runs'
      AND policyname = 'discovery_runs_isolation_policy'
  ) THEN
    CREATE POLICY discovery_runs_isolation_policy ON device_discovery_runs
      FOR ALL USING (provider_id IN (SELECT provider_id FROM user_provider_access WHERE user_id = auth.uid()));
  END IF;
END
$policy$;

ALTER TABLE device_discovery_results ENABLE ROW LEVEL SECURITY;
DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'device_discovery_results'
      AND policyname = 'discovery_results_isolation_policy'
  ) THEN
    CREATE POLICY discovery_results_isolation_policy ON device_discovery_results
      FOR ALL USING (provider_id IN (SELECT provider_id FROM user_provider_access WHERE user_id = auth.uid()));
  END IF;
END
$policy$;

-- Command queue (TR-069 / actions)
CREATE TABLE IF NOT EXISTS command_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    command VARCHAR(100) NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'queued',
    priority INTEGER DEFAULT 0,
    retry_count INTEGER DEFAULT 0,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS command_queue_dlq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    command_id UUID,
    reason TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE command_queue ENABLE ROW LEVEL SECURITY;
DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'command_queue'
      AND policyname = 'command_queue_isolation_policy'
  ) THEN
    CREATE POLICY command_queue_isolation_policy ON command_queue
      FOR ALL USING (provider_id IN (SELECT provider_id FROM user_provider_access WHERE user_id = auth.uid()));
  END IF;
END
$policy$;

ALTER TABLE command_queue_dlq ENABLE ROW LEVEL SECURITY;
DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'command_queue_dlq'
      AND policyname = 'command_queue_dlq_isolation_policy'
  ) THEN
    CREATE POLICY command_queue_dlq_isolation_policy ON command_queue_dlq
      FOR ALL USING (provider_id IN (SELECT provider_id FROM user_provider_access WHERE user_id = auth.uid()));
  END IF;
END
$policy$;

-- Alert rules and events
CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    scope_type VARCHAR(50) NOT NULL DEFAULT 'provider',
    scope_id UUID,
    metric VARCHAR(100),
    condition VARCHAR(20) NOT NULL DEFAULT 'gt',
    threshold DOUBLE PRECISION NOT NULL DEFAULT 0,
    severity VARCHAR(20) NOT NULL DEFAULT 'warning',
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES alert_rules(id) ON DELETE SET NULL,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'warning',
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    details JSONB DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'alert_rules'
      AND policyname = 'alert_rules_isolation_policy'
  ) THEN
    CREATE POLICY alert_rules_isolation_policy ON alert_rules
      FOR ALL USING (provider_id IN (SELECT provider_id FROM user_provider_access WHERE user_id = auth.uid()));
  END IF;
END
$policy$;

ALTER TABLE alert_events ENABLE ROW LEVEL SECURITY;
DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'alert_events'
      AND policyname = 'alert_events_isolation_policy'
  ) THEN
    CREATE POLICY alert_events_isolation_policy ON alert_events
      FOR ALL USING (provider_id IN (SELECT provider_id FROM user_provider_access WHERE user_id = auth.uid()));
  END IF;
END
$policy$;

-- Incident management
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'warning',
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    summary TEXT
);

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'incidents'
      AND policyname = 'incidents_isolation_policy'
  ) THEN
    CREATE POLICY incidents_isolation_policy ON incidents
      FOR ALL USING (provider_id IN (SELECT provider_id FROM user_provider_access WHERE user_id = auth.uid()));
  END IF;
END
$policy$;

-- Network tools history
CREATE TABLE IF NOT EXISTS network_tool_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    user_id UUID,
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

-- Optional FK to auth.users if schema exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
    ALTER TABLE network_tool_runs
      ADD CONSTRAINT network_tool_runs_user_fk FOREIGN KEY (user_id) REFERENCES auth.users(id);
  END IF;
END $$;
