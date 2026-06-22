create type public.payment_method as enum ('CASH', 'CARD', 'WALLET');

alter table public.restaurant_order
  add column payment_method public.payment_method not null default 'CASH';
