create or replace function public.set_job_assignments(
  p_job_id uuid,
  p_employee_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  job_location_id uuid;
  selected_employee_ids uuid[];
  invalid_employee_count integer;
begin
  selected_employee_ids :=
    coalesce(p_employee_ids, array[]::uuid[]);

  select location_id
  into job_location_id
  from public.jobs
  where id = p_job_id;

  if job_location_id is null then
    raise exception 'The selected job does not exist.';
  end if;

  -- Every selected employee must:
  -- 1. Exist
  -- 2. Be active
  -- 3. Belong to the same location
  -- 4. Be currently checked in
  select count(*)
  into invalid_employee_count
  from unnest(selected_employee_ids) as selected(employee_id)
  left join public.employees
    on employees.id = selected.employee_id
  where employees.id is null
    or employees.active is not true
    or employees.location_id <> job_location_id
    or not exists (
      select 1
      from public.attendance_sessions
      where attendance_sessions.employee_id =
        selected.employee_id
        and attendance_sessions.checked_out_at is null
    );

  if invalid_employee_count > 0 then
    raise exception
      'One or more selected employees are unavailable.';
  end if;

  -- End assignments that are no longer selected.
  update public.job_assignments
  set unassigned_at = now()
  where job_id = p_job_id
    and unassigned_at is null
    and not (
      employee_id = any(selected_employee_ids)
    );

  -- Add newly selected employees.
  insert into public.job_assignments (
    job_id,
    employee_id,
    assigned_at
  )
  select
    p_job_id,
    selected.employee_id,
    now()
  from unnest(selected_employee_ids)
    as selected(employee_id)
  where not exists (
    select 1
    from public.job_assignments
    where job_assignments.job_id = p_job_id
      and job_assignments.employee_id =
        selected.employee_id
      and job_assignments.unassigned_at is null
  );
end;
$$;

grant execute
on function public.set_job_assignments(uuid, uuid[])
to anon, authenticated;