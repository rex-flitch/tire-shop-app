-- Enable UUID generation.
create extension if not exists "pgcrypto";

-- Restrict job statuses to approved values.
create type public.job_status as enum (
  'queue',
  'in_progress',
  'completed'
);

-- Tire shop companies using the application.
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'America/Denver',
  created_at timestamptz not null default now()
);

-- Individual shop locations.
create table public.locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,
  name text not null,
  timezone text not null default 'America/Denver',
  created_at timestamptz not null default now()
);

-- Services a shop can perform.
create table public.service_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,
  name text not null,
  estimated_minutes integer not null
    check (estimated_minutes > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Jobs moving through the workflow board.
create table public.jobs (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  location_id uuid not null
    references public.locations(id)
    on delete cascade,

  customer_name text not null,
  customer_phone text,

  vehicle_year integer,
  vehicle_make text,
  vehicle_model text,
  license_plate text,

  service_description text not null,

  status public.job_status not null default 'queue',

  estimated_minutes integer not null
    check (estimated_minutes > 0),

  priority integer not null default 0,

  assigned_employee_name text,

  queued_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,

  business_date date not null default current_date,

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint valid_job_timestamps check (
    (started_at is null or started_at >= queued_at)
    and
    (completed_at is null or started_at is not null)
    and
    (completed_at is null or completed_at >= started_at)
  )
);

-- Complete record of every status movement.
create table public.job_status_history (
  id bigint generated always as identity primary key,

  job_id uuid not null
    references public.jobs(id)
    on delete cascade,

  from_status public.job_status,
  to_status public.job_status not null,

  changed_by_name text,
  changed_at timestamptz not null default now()
);

-- Helpful indexes for loading boards and archives.
create index jobs_location_business_date_idx
  on public.jobs(location_id, business_date);

create index jobs_location_status_idx
  on public.jobs(location_id, status);

create index jobs_queue_order_idx
  on public.jobs(location_id, status, priority desc, queued_at asc);

create index job_status_history_job_id_idx
  on public.job_status_history(job_id, changed_at);

-- Automatically update jobs.updated_at.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_jobs_updated_at
before update on public.jobs
for each row
execute function public.set_updated_at();

-- Record status changes automatically.
create or replace function public.record_job_status_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.status is distinct from new.status then
    insert into public.job_status_history (
      job_id,
      from_status,
      to_status
    )
    values (
      new.id,
      old.status,
      new.status
    );
  end if;

  return new;
end;
$$;

create trigger record_job_status_change
after update of status on public.jobs
for each row
execute function public.record_job_status_change();

-- Enable Row Level Security now rather than bolting it on later.
alter table public.organizations enable row level security;
alter table public.locations enable row level security;
alter table public.service_types enable row level security;
alter table public.jobs enable row level security;
alter table public.job_status_history enable row level security;

-- Temporary development read policies.
-- These let the initial board load without authentication.
-- We will replace these when employee authentication is added.
create policy "Temporary public organization reading"
on public.organizations
for select
to anon
using (true);

create policy "Temporary public location reading"
on public.locations
for select
to anon
using (true);

create policy "Temporary public service type reading"
on public.service_types
for select
to anon
using (true);

create policy "Temporary public job reading"
on public.jobs
for select
to anon
using (true);

create policy "Temporary public history reading"
on public.job_status_history
for select
to anon
using (true);

grant usage on schema public to anon;

grant select on public.organizations to anon;
grant select on public.locations to anon;
grant select on public.service_types to anon;
grant select on public.jobs to anon;
grant select on public.job_status_history to anon;