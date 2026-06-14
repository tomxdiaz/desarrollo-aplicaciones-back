SELECT rolname
FROM pg_roles
WHERE rolname IN (
  'anon',
  'authenticated',
  'service_role'
);