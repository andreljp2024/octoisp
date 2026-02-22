-- OctoISP upgrade v3: user profiles and report scheduling

-- User profiles (public schema)
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    name TEXT,
    phone TEXT,
    avatar_url TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_profiles'
      AND policyname = 'user_profiles_isolation_policy'
  ) THEN
    CREATE POLICY user_profiles_isolation_policy ON user_profiles
      FOR ALL USING (
        user_id = auth.uid()
        OR provider_id IN (
          SELECT provider_id FROM user_provider_access WHERE user_id = auth.uid()
        )
      );
  END IF;
END
$policy$;

-- Report scheduling
CREATE TABLE IF NOT EXISTS report_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    format VARCHAR(10) NOT NULL DEFAULT 'PDF',
    next_run TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;
DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'report_schedules'
      AND policyname = 'report_schedules_isolation_policy'
  ) THEN
    CREATE POLICY report_schedules_isolation_policy ON report_schedules
      FOR ALL USING (
        provider_id IN (
          SELECT provider_id FROM user_provider_access WHERE user_id = auth.uid()
        )
      );
  END IF;
END
$policy$;

CREATE TABLE IF NOT EXISTS report_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES report_schedules(id) ON DELETE SET NULL,
    report_type VARCHAR(50) NOT NULL,
    format VARCHAR(10) NOT NULL DEFAULT 'PDF',
    status VARCHAR(20) NOT NULL DEFAULT 'generated',
    output_path TEXT,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE report_runs ENABLE ROW LEVEL SECURITY;
DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'report_runs'
      AND policyname = 'report_runs_isolation_policy'
  ) THEN
    CREATE POLICY report_runs_isolation_policy ON report_runs
      FOR ALL USING (
        provider_id IN (
          SELECT provider_id FROM user_provider_access WHERE user_id = auth.uid()
        )
      );
  END IF;
END
$policy$;
