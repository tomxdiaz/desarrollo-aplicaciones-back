-- Stores the public URL of the restaurant image uploaded from the backend.
-- Mirrors the `image` column already present on `product`.
alter table public.restaurant
  add column if not exists image text;
