-- OctoISP upgrade v11: materialize the public schema tables that were
-- accidentally created in auth while the search_path was still loose.
--
-- On a fresh bootstrap these auth tables may not exist yet, so each block
-- is guarded and becomes a no-op when the public schema already has the
-- canonical table definition.

SET search_path TO public, auth;

DO $$
BEGIN
  IF to_regclass('public.provider_settings') IS NULL
     AND to_regclass('auth.provider_settings') IS NOT NULL THEN
    EXECUTE 'CREATE TABLE public.provider_settings (LIKE auth.provider_settings INCLUDING ALL)';
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.device_discovery_runs') IS NULL
     AND to_regclass('auth.device_discovery_runs') IS NOT NULL THEN
    EXECUTE 'CREATE TABLE public.device_discovery_runs (LIKE auth.device_discovery_runs INCLUDING ALL)';
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.device_discovery_results') IS NULL
     AND to_regclass('auth.device_discovery_results') IS NOT NULL THEN
    EXECUTE 'CREATE TABLE public.device_discovery_results (LIKE auth.device_discovery_results INCLUDING ALL)';
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.command_queue') IS NULL
     AND to_regclass('auth.command_queue') IS NOT NULL THEN
    EXECUTE 'CREATE TABLE public.command_queue (LIKE auth.command_queue INCLUDING ALL)';
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.command_queue_dlq') IS NULL
     AND to_regclass('auth.command_queue_dlq') IS NOT NULL THEN
    EXECUTE 'CREATE TABLE public.command_queue_dlq (LIKE auth.command_queue_dlq INCLUDING ALL)';
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.incidents') IS NULL
     AND to_regclass('auth.incidents') IS NOT NULL THEN
    EXECUTE 'CREATE TABLE public.incidents (LIKE auth.incidents INCLUDING ALL)';
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.alert_rules') IS NULL
     AND to_regclass('auth.alert_rules') IS NOT NULL THEN
    EXECUTE 'CREATE TABLE public.alert_rules (LIKE auth.alert_rules INCLUDING ALL)';
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.alert_events') IS NULL
     AND to_regclass('auth.alert_events') IS NOT NULL THEN
    EXECUTE 'CREATE TABLE public.alert_events (LIKE auth.alert_events INCLUDING ALL)';
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.report_schedules') IS NULL
     AND to_regclass('auth.report_schedules') IS NOT NULL THEN
    EXECUTE 'CREATE TABLE public.report_schedules (LIKE auth.report_schedules INCLUDING ALL)';
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.report_runs') IS NULL
     AND to_regclass('auth.report_runs') IS NOT NULL THEN
    EXECUTE 'CREATE TABLE public.report_runs (LIKE auth.report_runs INCLUDING ALL)';
  END IF;
END
$$;
