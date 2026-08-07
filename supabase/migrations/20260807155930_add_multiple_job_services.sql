-- Add updated timestamps to editable service types.
alter table public.service_types
add column if not exists updated_at timestamptz not null default now();

-- Prevent duplicate active service names within one organization.
create unique index if not exists service_types_organization_name_idx
on public.service_types (
  organization_id,
  lower(name)
);

-- Individual services selected for a specific job.
--
-- service_name and estimated_minutes are snapshots.
-- They preserve what the service was called and how long it was estimated
-- to take when the job was created.
create table public.job_services (
  id uuid primary key default gen_random_uuid(),

  job_id uuid not null
    references public.jobs(id)
    on delete cascade,

  service_type_id uuid
    references public.service_types(id)
    on delete set null,

  service_name text not null,

  estimated_minutes integer not null
    check (estimated_minutes > 0),

  created_at timestamptz not null default now()
);

create index job_services_job_id_idx
on public.job_services(job_id);

create index job_services_service_type_id_idx
on public.job_services(service_type_id);

-- Do not allow the same service type to be added to one job twice.
create unique index job_services_job_service_type_idx
on public.job_services(job_id, service_type_id)
where service_type_id is not null;

-- Automatically update service_types.updated_at.
create trigger set_service_types_updated_at
before update on public.service_types
for each row
execute function public.set_updated_at();

-- Enable Row Level Security.
alter table public.job_services enable row level security;

-- Temporary development permissions.
-- These will be replaced after employee authentication is added.

grant select, insert, update on public.service_types to anon;
grant select, insert, update, delete on public.job_services to anon;

create policy "Temporary public service type creation"
on public.service_types
for insert
to anon
with check (true);

create policy "Temporary public service type updating"
on public.service_types
for update
to anon
using (true)
with check (true);

create policy "Temporary public job service reading"
on public.job_services
for select
to anon
using (true);

create policy "Temporary public job service creation"
on public.job_services
for insert
to anon
with check (true);

create policy "Temporary public job service updating"
on public.job_services
for update
to anon
using (true)
with check (true);

create policy "Temporary public job service deletion"
on public.job_services
for delete
to anon
using (true);