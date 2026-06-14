-- Public bucket used to store restaurant and product images uploaded from the
-- backend. The backend uploads with the service role key (bypasses RLS);
-- public = true allows the generated public URLs to be read by anyone.
insert into storage.buckets (id, name, public)
values ('restaurant-images', 'restaurant-images', true)
on conflict (id) do nothing;
