-- Runtime role used by the API so PostgreSQL row-level security is enforced.
DO $role$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'octoisp_api') THEN
    CREATE ROLE octoisp_api
      NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
END
$role$;

GRANT octoisp_api TO octoisp;
DO $grant$
BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO octoisp_api', current_database());
END
$grant$;
GRANT USAGE ON SCHEMA public, auth TO octoisp_api;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public, auth TO octoisp_api;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public, auth TO octoisp_api;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public, auth TO octoisp_api;

ALTER DEFAULT PRIVILEGES FOR ROLE octoisp IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO octoisp_api;
ALTER DEFAULT PRIVILEGES FOR ROLE octoisp IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO octoisp_api;
ALTER DEFAULT PRIVILEGES FOR ROLE octoisp IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO octoisp_api;
