-- Add email column to profiles
alter table public.profiles add column if not exists email text;

-- Update existing rows with emails from auth.users
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id;

-- Update trigger to also store email on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;
