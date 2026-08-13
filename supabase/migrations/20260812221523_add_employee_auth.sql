create type public.employee_role as enum (
  'technician',
  'front_desk',
  'manager'
);

alter table public.employees
add column auth_user_id uuid
  references auth.users(id)
  on delete set null;

alter table public.employees
add column role public.employee_role
  not null
  default 'technician';

create unique index employees_auth_user_id_idx
on public.employees(auth_user_id)
where auth_user_id is not null;

-- Temporary permissions for authenticated users.
-- We will tighten these with organization/location-specific RLS later.

grant usage on schema public to authenticated;

grant select on public.organizations to authenticated;
grant select on public.locations to authenticated;
grant select on public.service_types to authenticated;
grant select, insert, update on public.jobs to authenticated;
grant select, insert, update, delete on public.job_services to authenticated;
grant select, insert, update on public.employees to authenticated;
grant select, insert, update on public.attendance_sessions to authenticated;
grant select, insert, update on public.job_assignments to authenticated;
grant select, insert on public.job_status_history to authenticated;

create policy "Temporary authenticated organization reading"
on public.organizations
for select
to authenticated
using (true);

create policy "Temporary authenticated location reading"
on public.locations
for select
to authenticated
using (true);

create policy "Temporary authenticated service type reading"
on public.service_types
for select
to authenticated
using (true);

create policy "Temporary authenticated job reading"
on public.jobs
for select
to authenticated
using (true);

create policy "Temporary authenticated job creation"
on public.jobs
for insert
to authenticated
with check (true);

create policy "Temporary authenticated job updating"
on public.jobs
for update
to authenticated
using (true)
with check (true);

create policy "Temporary authenticated job service reading"
on public.job_services
for select
to authenticated
using (true);

create policy "Temporary authenticated job service creation"
on public.job_services
for insert
to authenticated
with check (true);

create policy "Temporary authenticated job service updating"
on public.job_services
for update
to authenticated
using (true)
with check (true);

create policy "Temporary authenticated job service deletion"
on public.job_services
for delete
to authenticated
using (true);

create policy "Temporary authenticated employee reading"
on public.employees
for select
to authenticated
using (true);

create policy "Temporary authenticated employee creation"
on public.employees
for insert
to authenticated
with check (true);

create policy "Temporary authenticated employee updating"
on public.employees
for update
to authenticated
using (true)
with check (true);

create policy "Temporary authenticated attendance reading"
on public.attendance_sessions
for select
to authenticated
using (true);

create policy "Temporary authenticated attendance creation"
on public.attendance_sessions
for insert
to authenticated
with check (true);

create policy "Temporary authenticated attendance updating"
on public.attendance_sessions
for update
to authenticated
using (true)
with check (true);

create policy "Temporary authenticated assignment reading"
on public.job_assignments
for select
to authenticated
using (true);

create policy "Temporary authenticated assignment creation"
on public.job_assignments
for insert
to authenticated
with check (true);

create policy "Temporary authenticated assignment updating"
on public.job_assignments
for update
to authenticated
using (true)
with check (true);

create policy "Temporary authenticated history reading"
on public.job_status_history
for select
to authenticated
using (true);

create policy "Temporary authenticated history creation"
on public.job_status_history
for insert
to authenticated
with check (true);