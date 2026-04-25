-- =============================================================
-- Seed: datos iniciales de Provecho
-- Usuarios: provecho@gmail.com / provecho@gmail.com.ar (pwd: provecho)
-- =============================================================

-- 1. Usuarios en auth.users
--    El trigger on_auth_user_created crea el registro en app_user con global_role=USER
insert into auth.users (
  id, instance_id, aud, role,
  email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
) values
(
  'a1111111-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated', 'authenticated',
  'provecho@gmail.com',
  crypt('provecho', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb
),
(
  'a2222222-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated', 'authenticated',
  'provecho@gmail.com.ar',
  crypt('provecho', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb
);

-- 2. Identidades en auth.identities (necesarias para login email/password)
insert into auth.identities (
  provider_id, user_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
) values
(
  'a1111111-0000-0000-0000-000000000001',
  'a1111111-0000-0000-0000-000000000001'::uuid,
  '{"sub":"a1111111-0000-0000-0000-000000000001","email":"provecho@gmail.com"}'::jsonb,
  'email', now(), now(), now()
),
(
  'a2222222-0000-0000-0000-000000000002',
  'a2222222-0000-0000-0000-000000000002'::uuid,
  '{"sub":"a2222222-0000-0000-0000-000000000002","email":"provecho@gmail.com.ar"}'::jsonb,
  'email', now(), now(), now()
);

-- 3. Promover ambos usuarios a OWNER
update public.app_user
set global_role = 'OWNER'
where id in (
  'a1111111-0000-0000-0000-000000000001'::uuid,
  'a2222222-0000-0000-0000-000000000002'::uuid
);

-- 4. Restaurantes
--    El trigger on_restaurant_created_create_menu crea el menú automáticamente
insert into public.restaurant (owner_id, name, address, description)
values
(
  'a1111111-0000-0000-0000-000000000001'::uuid,
  'Provecho Buenos Aires',
  'Av. Corrientes 1234, CABA',
  'Restaurante de cocina argentina tradicional'
),
(
  'a2222222-0000-0000-0000-000000000002'::uuid,
  'Provecho Palermo',
  'Thames 1100, Palermo, CABA',
  'Restaurante de cocina internacional'
);

-- 5. Categorías: 2 por restaurante (referenciando los menús auto-creados)
with seed_menus as (
  select m.id as menu_id
  from public.menu m
  join public.restaurant r on r.id = m.restaurant_id
  where r.owner_id in (
    'a1111111-0000-0000-0000-000000000001'::uuid,
    'a2222222-0000-0000-0000-000000000002'::uuid
  )
)
insert into public.category (menu_id, name)
select menu_id, cat_name
from seed_menus
cross join (values ('Entradas'), ('Platos Principales')) as cats(cat_name);

-- 6a. Productos para Restaurante 1 (provecho@gmail.com)
with r1_cats as (
  select c.id, c.name
  from public.category c
  join public.menu m on m.id = c.menu_id
  join public.restaurant r on r.id = m.restaurant_id
  where r.owner_id = 'a1111111-0000-0000-0000-000000000001'::uuid
)
insert into public.product (category_id, name, description, price)
select c.id, p.name, p.description, p.price
from r1_cats c
join (values
  ('Entradas',           'Empanadas',           'Empanadas de carne y queso x6',           850.00::numeric),
  ('Entradas',           'Provoleta',            'Provoleta a la plancha con chimichurri',  1200.00::numeric),
  ('Platos Principales', 'Bife de Chorizo',      'Bife de chorizo 400g con papas fritas',  4500.00::numeric),
  ('Platos Principales', 'Milanesa Napolitana',  'Milanesa napolitana con ensalada mixta', 3800.00::numeric)
) as p(cat_name, name, description, price) on c.name = p.cat_name;

-- 6b. Productos para Restaurante 2 (provecho@gmail.com.ar)
with r2_cats as (
  select c.id, c.name
  from public.category c
  join public.menu m on m.id = c.menu_id
  join public.restaurant r on r.id = m.restaurant_id
  where r.owner_id = 'a2222222-0000-0000-0000-000000000002'::uuid
)
insert into public.product (category_id, name, description, price)
select c.id, p.name, p.description, p.price
from r2_cats c
join (values
  ('Entradas',           'Bruschetta',        'Bruschetta con tomate y albahaca fresca',          950.00::numeric),
  ('Entradas',           'Tabla de Quesos',   'Selección de quesos artesanales con mermeladas',  1800.00::numeric),
  ('Platos Principales', 'Pasta al Pesto',    'Pasta fresca con pesto genovés y parmesano',      3200.00::numeric),
  ('Platos Principales', 'Salmón Grillado',   'Salmón atlántico con vegetales de estación',      5200.00::numeric)
) as p(cat_name, name, description, price) on c.name = p.cat_name;

-- 7. Mesas: 2 por restaurante
insert into public.restaurant_table (restaurant_id, code, area, capacity)
select r.id, t.code, t.area, t.capacity
from public.restaurant r
cross join (values
  ('M01', 'Salón', 4),
  ('M02', 'Salón', 2)
) as t(code, area, capacity)
where r.owner_id in (
  'a1111111-0000-0000-0000-000000000001'::uuid,
  'a2222222-0000-0000-0000-000000000002'::uuid
);
