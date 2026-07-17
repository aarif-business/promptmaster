-- Fix submissions RLS insert policy
-- The existing policy may be failing due to JWT not being set correctly in server actions

alter table public.submissions disable row level security;
alter table public.submissions enable row level security;

drop policy if exists "Users can insert own submissions" on public.submissions;
drop policy if exists "Users can read own submissions" on public.submissions;
drop policy if exists "Admins can read all submissions" on public.submissions;

-- Recreate with explicit auth.uid() check
create policy "Users can insert own submissions"
  on public.submissions for insert
  with check (auth.uid() = user_id);

create policy "Users can read own submissions"
  on public.submissions for select
  using (auth.uid() = user_id);

create policy "Admins can read all submissions"
  on public.submissions for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
