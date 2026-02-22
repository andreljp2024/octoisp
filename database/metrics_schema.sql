-- OctoISP Metrics Schema (TimescaleDB)

CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Supabase Auth compat (preview/local)
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

CREATE TABLE IF NOT EXISTS user_provider_access (
  user_id UUID NOT NULL,
  provider_id UUID NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, provider_id)
);

ALTER TABLE user_provider_access ENABLE ROW LEVEL SECURITY;
DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_provider_access'
      AND policyname = 'user_provider_access_isolation_policy'
  ) THEN
    CREATE POLICY user_provider_access_isolation_policy ON user_provider_access
      FOR ALL USING (user_id = auth.uid());
  END IF;
END
$policy$;

-- Core metrics table
CREATE TABLE IF NOT EXISTS device_metrics (
  time TIMESTAMP WITH TIME ZONE NOT NULL,
  provider_id UUID NOT NULL,
  device_id UUID NOT NULL,
  cpu_percent REAL,
  mem_percent REAL,
  traffic_in_bps BIGINT,
  traffic_out_bps BIGINT,
  latency_ms REAL,
  packet_loss REAL,
  temperature_c REAL
);

SELECT create_hypertable('device_metrics', 'time', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS idx_device_metrics_provider ON device_metrics (provider_id, device_id, time DESC);

-- Continuous aggregates for common windows
ALTER TABLE IF EXISTS device_metrics DISABLE ROW LEVEL SECURITY;

-- Continuous aggregates for common windows
CREATE MATERIALIZED VIEW IF NOT EXISTS device_metrics_5m
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('5 minutes', time) AS bucket,
  provider_id,
  device_id,
  avg(cpu_percent) AS avg_cpu,
  avg(mem_percent) AS avg_mem,
  avg(traffic_in_bps) AS avg_in_bps,
  avg(traffic_out_bps) AS avg_out_bps,
  max(latency_ms) AS max_latency,
  avg(packet_loss) AS avg_packet_loss
FROM device_metrics
GROUP BY bucket, provider_id, device_id;

CREATE MATERIALIZED VIEW IF NOT EXISTS device_metrics_1h
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', time) AS bucket,
  provider_id,
  device_id,
  avg(cpu_percent) AS avg_cpu,
  avg(mem_percent) AS avg_mem,
  avg(traffic_in_bps) AS avg_in_bps,
  avg(traffic_out_bps) AS avg_out_bps,
  max(latency_ms) AS max_latency,
  avg(packet_loss) AS avg_packet_loss
FROM device_metrics
GROUP BY bucket, provider_id, device_id;

CREATE MATERIALIZED VIEW IF NOT EXISTS device_metrics_24h
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 day', time) AS bucket,
  provider_id,
  device_id,
  avg(cpu_percent) AS avg_cpu,
  avg(mem_percent) AS avg_mem,
  avg(traffic_in_bps) AS avg_in_bps,
  avg(traffic_out_bps) AS avg_out_bps,
  max(latency_ms) AS max_latency,
  avg(packet_loss) AS avg_packet_loss
FROM device_metrics
GROUP BY bucket, provider_id, device_id;

CREATE MATERIALIZED VIEW IF NOT EXISTS device_metrics_7d
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('7 days', time) AS bucket,
  provider_id,
  device_id,
  avg(cpu_percent) AS avg_cpu,
  avg(mem_percent) AS avg_mem,
  avg(traffic_in_bps) AS avg_in_bps,
  avg(traffic_out_bps) AS avg_out_bps,
  max(latency_ms) AS max_latency,
  avg(packet_loss) AS avg_packet_loss
FROM device_metrics
GROUP BY bucket, provider_id, device_id;

CREATE MATERIALIZED VIEW IF NOT EXISTS device_metrics_30d
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('30 days', time) AS bucket,
  provider_id,
  device_id,
  avg(cpu_percent) AS avg_cpu,
  avg(mem_percent) AS avg_mem,
  avg(traffic_in_bps) AS avg_in_bps,
  avg(traffic_out_bps) AS avg_out_bps,
  max(latency_ms) AS max_latency,
  avg(packet_loss) AS avg_packet_loss
FROM device_metrics
GROUP BY bucket, provider_id, device_id;

ALTER TABLE device_metrics ENABLE ROW LEVEL SECURITY;
DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'device_metrics'
      AND policyname = 'device_metrics_isolation_policy'
  ) THEN
    CREATE POLICY device_metrics_isolation_policy ON device_metrics
      FOR ALL USING (provider_id IN (
        SELECT provider_id FROM user_provider_access WHERE user_id = auth.uid()
      ));
  END IF;
END
$policy$;
