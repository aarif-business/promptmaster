-- ============================================================
-- PromptMaster Class — Database Schema + RLS Policies
-- ============================================================

-- 1. PROFILES
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  role        text not null default 'user' check (role in ('user', 'admin')),
  created_at  timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
create policy "Users can view own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- 2. CHALLENGES (image_topic replaces target_image_url)
-- ============================================================
create table if not exists public.challenges (
  id                   uuid primary key default gen_random_uuid(),
  title                text not null,
  description          text not null,
  difficulty           text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  image_topic          text not null,
  min_accuracy_to_pass integer not null default 70,
  created_by           uuid references public.profiles(id),
  created_at           timestamptz not null default now()
);

alter table public.challenges enable row level security;
create policy "Anyone authenticated can read challenges" on public.challenges
  for select using (auth.role() = 'authenticated');
create policy "Admins can insert challenges" on public.challenges
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "Admins can update challenges" on public.challenges
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "Admins can delete challenges" on public.challenges
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- 3. SUBMISSIONS (stores the live image url used in that session)
-- ============================================================
create table if not exists public.submissions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  challenge_id     uuid not null references public.challenges(id) on delete cascade,
  user_prompt      text not null,
  image_url        text,
  ai_response_text text,
  accuracy_score   integer check (accuracy_score between 0 and 100),
  passed           boolean not null default false,
  submitted_at     timestamptz not null default now()
);

alter table public.submissions enable row level security;
create policy "Users can insert own submissions" on public.submissions
  for insert with check (auth.uid() = user_id);
create policy "Users can read own submissions" on public.submissions
  for select using (auth.uid() = user_id);
create policy "Admins can read all submissions" on public.submissions
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- 4. SEED
-- ============================================================
delete from public.submissions;
delete from public.challenges;

insert into public.challenges (title, description, difficulty, image_topic, min_accuracy_to_pass)
values
  (
    'Nature''s Canvas',
    'A fresh landscape image loads every time. Describe exactly what you see — lighting, mood, setting, colors.',
    'beginner',
    'landscape,nature,scenic',
    60
  ),
  (
    'Urban Pulse',
    'A live city scene awaits. Capture the architecture, atmosphere, and energy in your prompt.',
    'intermediate',
    'city,urban,street',
    70
  ),
  (
    'Wild Encounter',
    'A random wildlife image appears. Describe the animal, habitat, lighting, and mood precisely.',
    'advanced',
    'wildlife,animal,nature',
    80
  );
