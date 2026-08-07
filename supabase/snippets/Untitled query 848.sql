select
  jobs.customer_name,
  jobs.estimated_minutes as job_total,
  string_agg(
    job_services.service_name
      || ' (' 
      || job_services.estimated_minutes 
      || ' min)',
    ', '
    order by job_services.created_at
  ) as selected_services,
  sum(job_services.estimated_minutes) as calculated_total
from public.jobs
join public.job_services
  on job_services.job_id = jobs.id
group by
  jobs.id,
  jobs.customer_name,
  jobs.estimated_minutes
order by jobs.customer_name;