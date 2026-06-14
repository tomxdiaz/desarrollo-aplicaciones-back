SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN (
  'restaurant',
  'restaurant_table',
  'menu',
  'category',
  'product'
);