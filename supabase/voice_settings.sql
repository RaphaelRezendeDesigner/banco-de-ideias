-- Voice settings: per-user voice/brand profile injected into every AI generation.
-- Run this in Supabase SQL Editor (once).

create table if not exists public.voice_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  candidate_name text default '',
  slogans text[] default '{}',
  bordoes text[] default '{}',
  keywords text[] default '{}',
  pautas text[] default '{}',
  cta text default '',
  signoff text default '',
  avoid text default '',
  region_focus text default 'Amazonas, interior do Amazonas',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.voice_settings enable row level security;

drop policy if exists "users manage their voice" on public.voice_settings;
create policy "users manage their voice"
  on public.voice_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.touch_voice_settings() returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_touch_voice_settings on public.voice_settings;
create trigger trg_touch_voice_settings
  before update on public.voice_settings
  for each row execute function public.touch_voice_settings();
