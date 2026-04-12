create type public.global_role as enum ('SUPER_USER', 'OWNER', 'USER');
create type public.restaurant_staff_role as enum ('ADMIN', 'CASHIER_PLUS', 'CASHIER');
create type public.restaurant_table_status as enum ('FREE', 'OCCUPIED');
create type public.restaurant_order_status as enum ('PENDING', 'IN_PROCESS', 'DELIVERED', 'CANCELLED');

create table public.app_user (
  id uuid primary key,
  email text not null unique,
  global_role public.global_role not null default 'USER'
);

create table public.restaurant (
  id bigint generated always as identity primary key,
  owner_id uuid not null references public.app_user(id) on delete restrict,
  name text not null,
  address text,
  description text
);

create table public.restaurant_staff (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.app_user(id) on delete cascade,
  restaurant_id bigint not null references public.restaurant(id) on delete cascade,
  role public.restaurant_staff_role not null,
  unique (user_id, restaurant_id)
);

create table public.menu (
  id bigint generated always as identity primary key,
  restaurant_id bigint not null unique references public.restaurant(id) on delete cascade,
  name text
);

create table public.category (
  id bigint generated always as identity primary key,
  menu_id bigint not null references public.menu(id) on delete cascade,
  name text not null
);

create table public.product (
  id bigint generated always as identity primary key,
  category_id bigint not null references public.category(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  image text
);

create table public.restaurant_table (
  id bigint generated always as identity primary key,
  restaurant_id bigint not null references public.restaurant(id) on delete cascade,
  code text not null,
  area text,
  capacity integer not null check (capacity > 0),
  status public.restaurant_table_status not null default 'FREE',
  unique (restaurant_id, code)
);

create table public.restaurant_order (
  id bigint generated always as identity primary key,
  restaurant_id bigint not null references public.restaurant(id) on delete cascade,
  table_id bigint not null references public.restaurant_table(id) on delete restrict,
  user_id uuid references public.app_user(id) on delete set null,
  number integer not null,
  created_at timestamptz not null default now(),
  status public.restaurant_order_status not null default 'PENDING',
  total numeric(10,2) not null default 0 check (total >= 0),
  unique (restaurant_id, number)
);

create table public.order_item (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.restaurant_order(id) on delete cascade,
  product_id bigint not null references public.product(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  subtotal numeric(10,2) not null check (subtotal >= 0)
);