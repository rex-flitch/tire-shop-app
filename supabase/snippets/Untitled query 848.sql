select
  customer_name,
  vehicle_year,
  vehicle_make,
  vehicle_model,
  service_description,
  status,
  estimated_minutes
from public.jobs
order by queued_at;