-- OctoISP upgrade v8: user_profiles multi-tenant key (user_id, provider_id)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'user_profiles'
      AND c.contype = 'p'
  ) THEN
    ALTER TABLE public.user_profiles DROP CONSTRAINT user_profiles_pkey;
  END IF;
END
$$;

ALTER TABLE public.user_profiles
  ADD PRIMARY KEY (user_id, provider_id);
