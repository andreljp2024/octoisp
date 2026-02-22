-- OctoISP upgrade v5: ajustar unicidade de serial por provedor

DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT c.conname INTO constraint_name
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public'
    AND t.relname = 'devices'
    AND c.contype = 'u'
    AND (
      SELECT array_agg(att.attname ORDER BY att.attnum)
      FROM unnest(c.conkey) AS colnum
      JOIN pg_attribute att ON att.attrelid = t.oid AND att.attnum = colnum
    ) = ARRAY['serial_number'];

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.devices DROP CONSTRAINT %I', constraint_name);
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS devices_provider_serial_unique
  ON public.devices (provider_id, serial_number);
