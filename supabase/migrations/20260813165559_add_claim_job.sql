create or replace function public.claim_job(
  p_job_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_auth_user_id uuid;
  v_employee_id uuid;
  v_job_status public.job_status;
begin
  -- Identify the authenticated Supabase user.
  v_auth_user_id := auth.uid();

  if v_auth_user_id is null then
    raise exception 'You must be logged in to claim a job.';
  end if;

  -- Resolve the authenticated user to an employee.
  select id
  into v_employee_id
  from public.employees
  where auth_user_id = v_auth_user_id
    and active = true;

  if v_employee_id is null then
    raise exception 'Your login is not linked to an active employee.';
  end if;

  -- Lock this job so two employees cannot claim it simultaneously.
  select status
  into v_job_status
  from public.jobs
  where id = p_job_id
  for update;

  if not found then
    raise exception 'The selected job does not exist.';
  end if;

  -- A job can only be claimed while it is still waiting.
  if v_job_status <> 'queue' then
    raise exception 'This job has already been claimed or is no longer in the queue.';
  end if;

  -- Create the assignment.
  --
  -- The existing validate_job_assignment trigger will verify:
  -- 1. The employee is active.
  -- 2. The employee belongs to the same location as the job.
  -- 3. The employee is currently checked in.
  insert into public.job_assignments (
    job_id,
    employee_id
  )
  values (
    p_job_id,
    v_employee_id
  );

  -- Start the job.
  --
  -- The existing record_job_status_change trigger will automatically
  -- create the job_status_history entry.
  update public.jobs
  set
    status = 'in_progress',
    started_at = coalesce(started_at, now()),
    completed_at = null
  where id = p_job_id;
end;
$$;

-- Do not expose Claim Job to anonymous users.
revoke all
on function public.claim_job(uuid)
from public;

revoke all
on function public.claim_job(uuid)
from anon;

grant execute
on function public.claim_job(uuid)
to authenticated;