-- OctoISP upgrade v6: RLS hardening and admin policies

CREATE OR REPLACE FUNCTION octoisp_is_admin_global()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_provider_access upa
    JOIN roles r ON r.id = upa.role_id
    WHERE upa.user_id = auth.uid()
      AND r.name = 'admin_global'
  );
$$;

CREATE OR REPLACE FUNCTION octoisp_is_admin_for_provider(p_provider_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_provider_access upa
    JOIN roles r ON r.id = upa.role_id
    WHERE upa.user_id = auth.uid()
      AND (
        r.name = 'admin_global'
        OR (r.name = 'admin_provider' AND upa.provider_id = p_provider_id)
      )
  );
$$;

CREATE OR REPLACE FUNCTION octoisp_can_manage_user(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_provider_access admin_access
    JOIN roles r ON r.id = admin_access.role_id
    WHERE admin_access.user_id = auth.uid()
      AND r.name IN ('admin_global', 'admin_provider')
      AND (
        r.name = 'admin_global'
        OR admin_access.provider_id IN (
          SELECT provider_id FROM user_provider_access upa WHERE upa.user_id = target_user_id
        )
      )
  );
$$;

-- RBAC tables
ALTER TABLE IF EXISTS roles ENABLE ROW LEVEL SECURITY;
DO $policy$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'roles'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'roles' AND policyname = 'roles_read_policy'
  ) THEN
    CREATE POLICY roles_read_policy ON roles
      FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
END
$policy$;

ALTER TABLE IF EXISTS permissions ENABLE ROW LEVEL SECURITY;
DO $policy$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'permissions'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'permissions' AND policyname = 'permissions_read_policy'
  ) THEN
    CREATE POLICY permissions_read_policy ON permissions
      FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
END
$policy$;

ALTER TABLE IF EXISTS role_permissions ENABLE ROW LEVEL SECURITY;
DO $policy$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'role_permissions'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'role_permissions' AND policyname = 'role_permissions_read_policy'
  ) THEN
    CREATE POLICY role_permissions_read_policy ON role_permissions
      FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
END
$policy$;

ALTER TABLE IF EXISTS user_permissions ENABLE ROW LEVEL SECURITY;
DO $policy$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_permissions'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_permissions' AND policyname = 'user_permissions_isolation_policy'
  ) THEN
    CREATE POLICY user_permissions_isolation_policy ON user_permissions
      FOR ALL USING (user_id = auth.uid() OR octoisp_can_manage_user(user_id));
  END IF;
END
$policy$;

ALTER TABLE IF EXISTS user_provider_access ENABLE ROW LEVEL SECURITY;
DO $policy$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_provider_access'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_provider_access' AND policyname = 'user_provider_access_isolation_policy'
  ) THEN
    CREATE POLICY user_provider_access_isolation_policy ON user_provider_access
      FOR ALL USING (user_id = auth.uid() OR octoisp_is_admin_for_provider(provider_id));
  END IF;
END
$policy$;

-- Admin global override for tenant tables
DO $policy$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'providers'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'providers' AND policyname = 'providers_admin_global_policy'
  ) THEN
    CREATE POLICY providers_admin_global_policy ON providers
      FOR ALL USING (octoisp_is_admin_global());
  END IF;
END
$policy$;

DO $policy$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pops'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'pops' AND policyname = 'pops_admin_global_policy'
  ) THEN
    CREATE POLICY pops_admin_global_policy ON pops
      FOR ALL USING (octoisp_is_admin_global());
  END IF;
END
$policy$;

DO $policy$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'customers' AND policyname = 'customers_admin_global_policy'
  ) THEN
    CREATE POLICY customers_admin_global_policy ON customers
      FOR ALL USING (octoisp_is_admin_global());
  END IF;
END
$policy$;

DO $policy$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'devices'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'devices' AND policyname = 'devices_admin_global_policy'
  ) THEN
    CREATE POLICY devices_admin_global_policy ON devices
      FOR ALL USING (octoisp_is_admin_global());
  END IF;
END
$policy$;

DO $policy$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alerts'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'alerts' AND policyname = 'alerts_admin_global_policy'
  ) THEN
    CREATE POLICY alerts_admin_global_policy ON alerts
      FOR ALL USING (octoisp_is_admin_global());
  END IF;
END
$policy$;

DO $policy$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_log'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'audit_log' AND policyname = 'audit_log_admin_global_policy'
  ) THEN
    CREATE POLICY audit_log_admin_global_policy ON audit_log
      FOR ALL USING (octoisp_is_admin_global());
  END IF;
END
$policy$;

DO $policy$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tr069_templates'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'tr069_templates' AND policyname = 'tr069_templates_admin_global_policy'
  ) THEN
    CREATE POLICY tr069_templates_admin_global_policy ON tr069_templates
      FOR ALL USING (octoisp_is_admin_global());
  END IF;
END
$policy$;

DO $policy$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'network_tool_runs'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'network_tool_runs' AND policyname = 'network_tool_runs_admin_global_policy'
  ) THEN
    CREATE POLICY network_tool_runs_admin_global_policy ON network_tool_runs
      FOR ALL USING (octoisp_is_admin_global());
  END IF;
END
$policy$;

DO $policy$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'provider_settings'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'provider_settings' AND policyname = 'provider_settings_admin_global_policy'
  ) THEN
    CREATE POLICY provider_settings_admin_global_policy ON provider_settings
      FOR ALL USING (octoisp_is_admin_global());
  END IF;
END
$policy$;

DO $policy$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'device_discovery_runs'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'device_discovery_runs' AND policyname = 'device_discovery_runs_admin_global_policy'
  ) THEN
    CREATE POLICY device_discovery_runs_admin_global_policy ON device_discovery_runs
      FOR ALL USING (octoisp_is_admin_global());
  END IF;
END
$policy$;

DO $policy$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'device_discovery_results'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'device_discovery_results' AND policyname = 'device_discovery_results_admin_global_policy'
  ) THEN
    CREATE POLICY device_discovery_results_admin_global_policy ON device_discovery_results
      FOR ALL USING (octoisp_is_admin_global());
  END IF;
END
$policy$;

DO $policy$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'command_queue'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'command_queue' AND policyname = 'command_queue_admin_global_policy'
  ) THEN
    CREATE POLICY command_queue_admin_global_policy ON command_queue
      FOR ALL USING (octoisp_is_admin_global());
  END IF;
END
$policy$;

DO $policy$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'command_queue_dlq'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'command_queue_dlq' AND policyname = 'command_queue_dlq_admin_global_policy'
  ) THEN
    CREATE POLICY command_queue_dlq_admin_global_policy ON command_queue_dlq
      FOR ALL USING (octoisp_is_admin_global());
  END IF;
END
$policy$;

DO $policy$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alert_rules'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'alert_rules' AND policyname = 'alert_rules_admin_global_policy'
  ) THEN
    CREATE POLICY alert_rules_admin_global_policy ON alert_rules
      FOR ALL USING (octoisp_is_admin_global());
  END IF;
END
$policy$;

DO $policy$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alert_events'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'alert_events' AND policyname = 'alert_events_admin_global_policy'
  ) THEN
    CREATE POLICY alert_events_admin_global_policy ON alert_events
      FOR ALL USING (octoisp_is_admin_global());
  END IF;
END
$policy$;

DO $policy$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'incidents'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'incidents' AND policyname = 'incidents_admin_global_policy'
  ) THEN
    CREATE POLICY incidents_admin_global_policy ON incidents
      FOR ALL USING (octoisp_is_admin_global());
  END IF;
END
$policy$;

DO $policy$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'report_schedules'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'report_schedules' AND policyname = 'report_schedules_admin_global_policy'
  ) THEN
    CREATE POLICY report_schedules_admin_global_policy ON report_schedules
      FOR ALL USING (octoisp_is_admin_global());
  END IF;
END
$policy$;

DO $policy$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'report_runs'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'report_runs' AND policyname = 'report_runs_admin_global_policy'
  ) THEN
    CREATE POLICY report_runs_admin_global_policy ON report_runs
      FOR ALL USING (octoisp_is_admin_global());
  END IF;
END
$policy$;

DO $policy$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_profiles' AND policyname = 'user_profiles_admin_policy'
  ) THEN
    CREATE POLICY user_profiles_admin_policy ON user_profiles
      FOR ALL USING (user_id = auth.uid() OR octoisp_is_admin_for_provider(provider_id));
  END IF;
END
$policy$;
