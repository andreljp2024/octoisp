-- OctoISP upgrade v7: indexes for performance

CREATE INDEX IF NOT EXISTS idx_alerts_provider_status_created
  ON alerts (provider_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_network_tool_runs_provider_created
  ON network_tool_runs (provider_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_command_queue_provider_status_created
  ON command_queue (provider_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_device_discovery_runs_provider_status
  ON device_discovery_runs (provider_id, status);

CREATE INDEX IF NOT EXISTS idx_incidents_provider_status
  ON incidents (provider_id, status);

CREATE INDEX IF NOT EXISTS idx_alert_rules_provider_enabled
  ON alert_rules (provider_id, enabled);

CREATE INDEX IF NOT EXISTS idx_alert_events_provider_status
  ON alert_events (provider_id, status);

CREATE INDEX IF NOT EXISTS idx_report_schedules_provider_status
  ON report_schedules (provider_id, status);

CREATE INDEX IF NOT EXISTS idx_report_runs_provider_status
  ON report_runs (provider_id, status);

CREATE INDEX IF NOT EXISTS idx_user_provider_access_provider
  ON user_provider_access (provider_id);

CREATE INDEX IF NOT EXISTS idx_user_provider_access_user
  ON user_provider_access (user_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_provider
  ON user_profiles (provider_id);
