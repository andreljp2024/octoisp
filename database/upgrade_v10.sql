-- OctoISP upgrade v10: enforce base tenant policies in the public schema.
SET search_path TO public, auth;

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tr069_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_tool_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS providers_isolation_policy ON public.providers;
CREATE POLICY providers_isolation_policy ON public.providers
  FOR ALL USING (
    id IN (SELECT provider_id FROM public.user_provider_access WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS pops_isolation_policy ON public.pops;
CREATE POLICY pops_isolation_policy ON public.pops
  FOR ALL USING (
    provider_id IN (SELECT provider_id FROM public.user_provider_access WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS customers_isolation_policy ON public.customers;
CREATE POLICY customers_isolation_policy ON public.customers
  FOR ALL USING (
    provider_id IN (SELECT provider_id FROM public.user_provider_access WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS devices_isolation_policy ON public.devices;
CREATE POLICY devices_isolation_policy ON public.devices
  FOR ALL USING (
    provider_id IN (SELECT provider_id FROM public.user_provider_access WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS audit_log_isolation_policy ON public.audit_log;
CREATE POLICY audit_log_isolation_policy ON public.audit_log
  FOR ALL USING (
    provider_id IN (SELECT provider_id FROM public.user_provider_access WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS alerts_isolation_policy ON public.alerts;
CREATE POLICY alerts_isolation_policy ON public.alerts
  FOR ALL USING (
    provider_id IN (SELECT provider_id FROM public.user_provider_access WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS tr069_templates_isolation_policy ON public.tr069_templates;
CREATE POLICY tr069_templates_isolation_policy ON public.tr069_templates
  FOR ALL USING (
    provider_id IN (SELECT provider_id FROM public.user_provider_access WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS network_tool_runs_isolation_policy ON public.network_tool_runs;
CREATE POLICY network_tool_runs_isolation_policy ON public.network_tool_runs
  FOR ALL USING (
    provider_id IN (SELECT provider_id FROM public.user_provider_access WHERE user_id = auth.uid())
  );
