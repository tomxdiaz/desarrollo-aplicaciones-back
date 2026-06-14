SELECT
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'service_role'
AND table_name IN (
  'restaurant_staff',
  'restaurant_table',
  'restaurant',
  'menu',
  'category',
  'product'
)
ORDER BY table_name, privilege_type;