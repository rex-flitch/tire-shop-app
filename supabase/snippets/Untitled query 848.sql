select
  jobs.customer_name,
  employees.first_name,
  employees.last_name,
  job_assignments.assigned_at
from public.job_assignments
join public.jobs
  on jobs.id = job_assignments.job_id
join public.employees
  on employees.id = job_assignments.employee_id
where job_assignments.unassigned_at is null
order by jobs.customer_name;