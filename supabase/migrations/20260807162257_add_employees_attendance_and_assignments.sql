-- Employees who can work at a shop location.
create table public.employees (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  location_id uuid not null
    references public.locations(id)
    on delete cascade,

  first_name text not null,
  last_name text not null,

  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint employee_first_name_not_blank
    check (length(trim(first_name)) > 0),

  constraint employee_last_name_not_blank
    check (length(trim(last_name)) > 0)
);

create index employees_location_active_idx
on public.employees(location_id, active);

create unique index employees_location_name_idx
on public.employees(
  location_id,
  lower(first_name),
  lower(last_name)
);

-- Each row represents one employee shift or work session.
--
-- An employee is considered checked in when checked_out_at is null.
create table public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),

  employee_id uuid not null
    references public.employees(id)
    on delete cascade,

  checked_in_at timestamptz not null default now(),
  checked_out_at timestamptz,

  created_at timestamptz not null default now(),

  constraint valid_attendance_session_times check (
    checked_out_at is null
    or checked_out_at >= checked_in_at
  )
);

create index attendance_sessions_employee_idx
on public.attendance_sessions(employee_id, checked_in_at desc);

-- Prevent an employee from having more than one open check-in session.
create unique index one_open_attendance_session_per_employee_idx
on public.attendance_sessions(employee_id)
where checked_out_at is null;

-- Employees assigned to individual jobs.
--
-- unassigned_at preserves assignment history instead of deleting rows.
create table public.job_assignments (
  id uuid primary key default gen_random_uuid(),

  job_id uuid not null
    references public.jobs(id)
    on delete cascade,

  employee_id uuid not null
    references public.employees(id)
    on delete restrict,

  assigned_at timestamptz not null default now(),
  unassigned_at timestamptz,

  created_at timestamptz not null default now(),

  constraint valid_job_assignment_times check (
    unassigned_at is null
    or unassigned_at >= assigned_at
  )
);

create index job_assignments_job_idx
on public.job_assignments(job_id, assigned_at);

create index job_assignments_employee_idx
on public.job_assignments(employee_id, assigned_at);

-- Prevent the same employee from being actively assigned to the same job twice.
create unique index one_active_assignment_per_employee_job_idx
on public.job_assignments(job_id, employee_id)
where unassigned_at is null;

-- Keep employee updated_at current.
create trigger set_employees_updated_at
before update on public.employees
for each row
execute function public.set_updated_at();

-- Confirm an employee is eligible when a new assignment is created.
create or replace function public.validate_job_assignment()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  job_location_id uuid;
  employee_location_id uuid;
  employee_is_active boolean;
  employee_is_checked_in boolean;
begin
  select location_id
  into job_location_id
  from public.jobs
  where id = new.job_id;

  if job_location_id is null then
    raise exception 'The selected job does not exist.';
  end if;

  select location_id, active
  into employee_location_id, employee_is_active
  from public.employees
  where id = new.employee_id;

  if employee_location_id is null then
    raise exception 'The selected employee does not exist.';
  end if;

  if employee_is_active is not true then
    raise exception 'Inactive employees cannot be assigned to jobs.';
  end if;

  if employee_location_id <> job_location_id then
    raise exception 'The employee and job must belong to the same location.';
  end if;

  select exists (
    select 1
    from public.attendance_sessions
    where employee_id = new.employee_id
      and checked_out_at is null
  )
  into employee_is_checked_in;

  if employee_is_checked_in is not true then
    raise exception 'The employee must be checked in before being assigned.';
  end if;

  return new;
end;
$$;

create trigger validate_job_assignment
before insert on public.job_assignments
for each row
execute function public.validate_job_assignment();

-- Enable Row Level Security.
alter table public.employees enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.job_assignments enable row level security;

-- Temporary development permissions.
-- These will be replaced with employee and manager permissions later.

grant select, insert, update on public.employees to anon;
grant select, insert, update on public.attendance_sessions to anon;
grant select, insert, update on public.job_assignments to anon;

create policy "Temporary public employee reading"
on public.employees
for select
to anon
using (true);

create policy "Temporary public employee creation"
on public.employees
for insert
to anon
with check (true);

create policy "Temporary public employee updating"
on public.employees
for update
to anon
using (true)
with check (true);

create policy "Temporary public attendance reading"
on public.attendance_sessions
for select
to anon
using (true);

create policy "Temporary public check in"
on public.attendance_sessions
for insert
to anon
with check (true);

create policy "Temporary public check out"
on public.attendance_sessions
for update
to anon
using (true)
with check (true);

create policy "Temporary public assignment reading"
on public.job_assignments
for select
to anon
using (true);

create policy "Temporary public assignment creation"
on public.job_assignments
for insert
to anon
with check (true);

create policy "Temporary public assignment updating"
on public.job_assignments
for update
to anon
using (true)
with check (true);