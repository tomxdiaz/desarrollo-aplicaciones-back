-- Grant full access to service_role (used by the NestJS backend via the secret key).
-- service_role has BYPASSRLS but still needs explicit GRANT on tables created via SQL migrations.
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- Grant read/write to authenticated role so RLS policies can be added later.
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
