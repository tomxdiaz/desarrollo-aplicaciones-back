create or replace function public.handle_new_restaurant_menu()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.menu (restaurant_id, name)
  values (new.id, 'Menu');

  return new;
end;
$$;

drop trigger if exists on_restaurant_created_create_menu on public.restaurant;
create trigger on_restaurant_created_create_menu
after insert on public.restaurant
for each row
execute function public.handle_new_restaurant_menu();

insert into public.menu (restaurant_id, name)
select r.id, 'Menu'
from public.restaurant r
left join public.menu m on m.restaurant_id = r.id
where m.id is null;