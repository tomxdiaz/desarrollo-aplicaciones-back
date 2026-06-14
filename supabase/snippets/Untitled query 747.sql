SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'restaurant'
ORDER BY grantee, privilege_type;