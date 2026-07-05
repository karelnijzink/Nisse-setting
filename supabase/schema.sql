-- ============================================================================
-- Nisse Group — AI Appointment-Setting Agent
-- Supabase / PostgreSQL schema  (project: czstsfowxbxlbybhhfxn "nisse-hvac")
--
-- NOTE: this project already has an unrelated `public.leads` (HVAC lead-gen)
-- table, so the appointment agent uses its own prefixed tables —
-- `appt_leads` and `appt_call_logs` — to stay fully isolated.
--
-- This is the exact migration applied via the Supabase MCP
-- (migration name: appointment_agent_tables). Re-runnable / idempotent.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Enum (prefixed to avoid clashing with any existing type)
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'appt_lead_status') then
    create type appt_lead_status as enum ('pending', 'called', 'booked', 'failed');
  end if;
end
$$;

-- ----------------------------------------------------------------------------
-- appt_leads
-- ----------------------------------------------------------------------------
create table if not exists public.appt_leads (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  phone_number  text not null,
  email         text,
  company_name  text,
  status        appt_lead_status not null default 'pending',
  created_at    timestamptz not null default now()
);

create unique index if not exists appt_leads_phone_number_key
  on public.appt_leads (phone_number);
create index if not exists appt_leads_status_idx on public.appt_leads (status);

-- ----------------------------------------------------------------------------
-- appt_call_logs
-- ----------------------------------------------------------------------------
create table if not exists public.appt_call_logs (
  id             uuid primary key default gen_random_uuid(),
  lead_id        uuid references public.appt_leads (id) on delete set null,
  vapi_call_id   text unique,
  transcript     text,
  summary        text,
  recording_url  text,
  status         text,
  created_at     timestamptz not null default now()
);

create index if not exists appt_call_logs_lead_id_idx on public.appt_call_logs (lead_id);
create index if not exists appt_call_logs_vapi_call_id_idx on public.appt_call_logs (vapi_call_id);

-- ----------------------------------------------------------------------------
-- Row Level Security
--
-- The backend talks to Supabase with the SERVICE ROLE key, which bypasses RLS.
-- RLS is enabled with NO permissive policies so the anon/public key cannot
-- read or write lead PII.
-- ----------------------------------------------------------------------------
alter table public.appt_leads enable row level security;
alter table public.appt_call_logs enable row level security;

-- ----------------------------------------------------------------------------
-- appt_emails  (email outbound channel)
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'appt_email_status') then
    create type appt_email_status as enum ('queued', 'sent', 'failed', 'preview');
  end if;
end
$$;

create table if not exists public.appt_emails (
  id                   uuid primary key default gen_random_uuid(),
  lead_id              uuid references public.appt_leads (id) on delete set null,
  to_email             text not null,
  subject              text not null,
  body_html            text,
  body_text            text,
  template             text,
  status               appt_email_status not null default 'queued',
  provider             text,
  provider_message_id  text,
  error                text,
  created_at           timestamptz not null default now(),
  sent_at              timestamptz
);

create index if not exists appt_emails_lead_id_idx on public.appt_emails (lead_id);
create index if not exists appt_emails_status_idx on public.appt_emails (status);

alter table public.appt_emails enable row level security;

-- ----------------------------------------------------------------------------
-- Seed data (optional — remove before production)
-- ----------------------------------------------------------------------------
-- insert into public.appt_leads (name, phone_number, email, company_name) values
--   ('Alex Rivera', '+16045551234', 'alex@example.com', 'Rivera Roofing');
