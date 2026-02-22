-- OctoISP upgrade v9: check constraints for status/enums

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'providers')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'providers_status_check') THEN
    ALTER TABLE providers
      ADD CONSTRAINT providers_status_check
      CHECK (status IN ('active', 'inactive', 'suspended')) NOT VALID;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pops')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pops_status_check') THEN
    ALTER TABLE pops
      ADD CONSTRAINT pops_status_check
      CHECK (status IN ('active', 'inactive', 'maintenance')) NOT VALID;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customers_status_check') THEN
    ALTER TABLE customers
      ADD CONSTRAINT customers_status_check
      CHECK (status IN ('active', 'inactive', 'suspended', 'pending')) NOT VALID;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'devices')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'devices_status_check') THEN
    ALTER TABLE devices
      ADD CONSTRAINT devices_status_check
      CHECK (status IN ('online', 'offline', 'degraded', 'warning', 'critical', 'maintenance')) NOT VALID;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'devices')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'devices_type_check') THEN
    ALTER TABLE devices
      ADD CONSTRAINT devices_type_check
      CHECK (device_type IN ('cpe', 'ont', 'router', 'switch', 'ap', 'olt', 'core', 'unknown')) NOT VALID;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'devices')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'devices_connection_check') THEN
    ALTER TABLE devices
      ADD CONSTRAINT devices_connection_check
      CHECK (connection_type IN ('ethernet', 'fiber', 'wifi', 'lte', 'wireless', 'dsl', 'other')) NOT VALID;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alerts')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'alerts_severity_check') THEN
    ALTER TABLE alerts
      ADD CONSTRAINT alerts_severity_check
      CHECK (severity IN ('info', 'warning', 'critical')) NOT VALID;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alerts')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'alerts_status_check') THEN
    ALTER TABLE alerts
      ADD CONSTRAINT alerts_status_check
      CHECK (status IN ('open', 'acknowledged', 'resolved', 'closed')) NOT VALID;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alert_rules')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'alert_rules_severity_check') THEN
    ALTER TABLE alert_rules
      ADD CONSTRAINT alert_rules_severity_check
      CHECK (severity IN ('info', 'warning', 'critical')) NOT VALID;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alert_rules')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'alert_rules_condition_check') THEN
    ALTER TABLE alert_rules
      ADD CONSTRAINT alert_rules_condition_check
      CHECK (condition IN ('gt', 'gte', 'lt', 'lte', 'eq', 'neq', 'between')) NOT VALID;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alert_events')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'alert_events_severity_check') THEN
    ALTER TABLE alert_events
      ADD CONSTRAINT alert_events_severity_check
      CHECK (severity IN ('info', 'warning', 'critical')) NOT VALID;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alert_events')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'alert_events_status_check') THEN
    ALTER TABLE alert_events
      ADD CONSTRAINT alert_events_status_check
      CHECK (status IN ('open', 'acknowledged', 'resolved', 'closed')) NOT VALID;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'incidents')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'incidents_severity_check') THEN
    ALTER TABLE incidents
      ADD CONSTRAINT incidents_severity_check
      CHECK (severity IN ('info', 'warning', 'critical')) NOT VALID;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'incidents')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'incidents_status_check') THEN
    ALTER TABLE incidents
      ADD CONSTRAINT incidents_status_check
      CHECK (status IN ('open', 'resolved', 'closed')) NOT VALID;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'command_queue')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'command_queue_status_check') THEN
    ALTER TABLE command_queue
      ADD CONSTRAINT command_queue_status_check
      CHECK (status IN ('queued', 'running', 'completed', 'failed', 'retrying')) NOT VALID;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'device_discovery_runs')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'discovery_runs_status_check') THEN
    ALTER TABLE device_discovery_runs
      ADD CONSTRAINT discovery_runs_status_check
      CHECK (status IN ('running', 'completed', 'failed')) NOT VALID;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'report_schedules')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'report_schedules_status_check') THEN
    ALTER TABLE report_schedules
      ADD CONSTRAINT report_schedules_status_check
      CHECK (status IN ('active', 'paused', 'disabled')) NOT VALID;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'report_runs')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'report_runs_status_check') THEN
    ALTER TABLE report_runs
      ADD CONSTRAINT report_runs_status_check
      CHECK (status IN ('generated', 'failed', 'running')) NOT VALID;
  END IF;
END
$$;
