-- SENVIROX Module 2 — application users (service-role access)
-- Run in Supabase SQL editor when USER_STORE=supabase

create table if not exists public.app_users (
  id uuid primary key,
  email text not null unique,
  full_name text not null,
  role text not null check (role in ('super_admin', 'admin', 'manager', 'operator', 'viewer')),
  organization_id text null,
  password_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_users_email_idx on public.app_users (email);

alter table public.app_users enable row level security;

-- No anon/authenticated policies: API uses service role only.
