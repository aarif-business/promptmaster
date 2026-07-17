-- Add persistent challenge image and prompt assets for stable scoring

alter table public.challenges
  add column if not exists original_image_url text,
  add column if not exists image_data text,
  add column if not exists image_mime_type text,
  add column if not exists reference_prompt text;

-- Allow authenticated users to populate stored image assets when they are missing.
-- Once the stored assets exist, only admins may update the row again.
alter table public.challenges enable row level security;

drop policy if exists "Authenticated users can store missing challenge assets" on public.challenges;
create policy "Authenticated users can store missing challenge assets"
  on public.challenges
  for update
  using (
    auth.role() = 'authenticated' and
    image_data is null and
    reference_prompt is null
  )
  with check (
    auth.role() = 'authenticated' and
    image_data is not null and
    reference_prompt is not null
  );
