-- ============================================================================
-- Nisse Group — AI Appointment-Setting Agent
-- Supabase / PostgreSQL schema
--
-- Run this in the Supabase SQL Editor:
--   https://supabase.com/dashboard/project/czstsfowxbxlbybhhfxn/sql
-- ============================================================================

-- Needed for gen_random_uuid() (available by default on Supabase, kept explicit).
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'lead_status') then
    create type lead_status as enum ('pending', 'called', 'booked', 'failed');
  end if;
end
$$;

-- ----------------------------------------------------------------------------
-- leads
-- ----------------------------------------------------------------------------
create table if not exists public.leads (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  phone_number  text not null,
  email         text,
  company_name  text,
  status        lead_status not null default 'pending',
  created_at    timestamptz not null default now()
);

-- One active row per phone number keeps the dialer from double-calling.
create unique index if not exists leads_phone_number_key
  on public.leads (phone_number);

create index if not exists leads_status_idx on public.leads (status);

-- ----------------------------------------------------------------------------
-- call_logs
-- ----------------------------------------------------------------------------
create table if not exists public.call_logs (
  id             uuid primary key default gen_random_uuid(),
  lead_id        uuid references public.leads (id) on delete set null,
  vapi_call_id   text unique,
  transcript     text,
  summary        text,
  recording_url  text,
  status         text,
  created_at     timestamptz not null default now()
);

create index if not exists call_logs_lead_id_idx on public.call_logs (lead_id);
create index if not exists call_logs_vapi_call_id_idx on public.call_logs (vapi_call_id);

-- ----------------------------------------------------------------------------
-- Row Level Security
--
-- The backend talks to Supabase with the SERVICE ROLE key, which bypasses RLS.
-- We still enable RLS with NO permissive policies so that the anon/public key
-- (if ever leaked to the browser) cannot read or write these tables.
-- ----------------------------------------------------------------------------
alter table public.leads enable row level security;
alter table public.call_logs enable row level security;

-- ----------------------------------------------------------------------------
-- Seed data (optional — remove before production)
-- ----------------------------------------------------------------------------
-- insert into public.leads (name, phone_number, email, company_name) values
--   ('Alex Rivera', '+16045551234', 'alex@example.com', 'Rivera Roofing');
