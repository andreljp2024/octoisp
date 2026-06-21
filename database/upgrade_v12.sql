-- OctoISP upgrade v12: remove accidental app tables created in auth.
--
-- The app now uses the public schema explicitly. These auth-schema tables are
-- empty duplicates created during the search_path incident and can be dropped.

SET search_path TO public, auth;

DROP TABLE IF EXISTS auth.alert_events CASCADE;
DROP TABLE IF EXISTS auth.alert_rules CASCADE;
DROP TABLE IF EXISTS auth.command_queue CASCADE;
DROP TABLE IF EXISTS auth.command_queue_dlq CASCADE;
DROP TABLE IF EXISTS auth.device_discovery_results CASCADE;
DROP TABLE IF EXISTS auth.device_discovery_runs CASCADE;
DROP TABLE IF EXISTS auth.incidents CASCADE;
DROP TABLE IF EXISTS auth.network_tool_runs CASCADE;
DROP TABLE IF EXISTS auth.provider_settings CASCADE;
DROP TABLE IF EXISTS auth.report_runs CASCADE;
DROP TABLE IF EXISTS auth.report_schedules CASCADE;
DROP TABLE IF EXISTS auth.user_profiles CASCADE;
