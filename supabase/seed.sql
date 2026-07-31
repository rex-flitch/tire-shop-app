with new_organization as (
  insert into public.organizations (
    name,
    timezone
  )
  values (
    'Demo Tire Shop',
    'America/Denver'
  )
  returning id
),
new_location as (
  insert into public.locations (
    organization_id,
    name,
    timezone
  )
  select
    id,
    'St. George Location',
    'America/Denver'
  from new_organization
  returning id, organization_id
),
new_service_types as (
  insert into public.service_types (
    organization_id,
    name,
    estimated_minutes
  )
  select organization_id, 'Flat Repair', 30
  from new_location

  union all

  select organization_id, 'Tire Rotation', 30
  from new_location

  union all

  select organization_id, 'Four-Tire Installation', 75
  from new_location

  union all

  select organization_id, 'Wheel Alignment', 60
  from new_location
)

insert into public.jobs (
  organization_id,
  location_id,
  customer_name,
  customer_phone,
  vehicle_year,
  vehicle_make,
  vehicle_model,
  license_plate,
  service_description,
  status,
  estimated_minutes,
  priority,
  assigned_employee_name,
  queued_at,
  started_at,
  completed_at,
  business_date
)

select
  organization_id,
  id,
  'Alex Morgan',
  '435-555-0101',
  2021,
  'Toyota',
  'Tacoma',
  'DEMO-101',
  'Four-Tire Installation',
  'queue'::public.job_status,
  75,
  1,
  null::text,
  now() - interval '18 minutes',
  null::timestamptz,
  null::timestamptz,
  current_date
from new_location

union all

select
  organization_id,
  id,
  'Jordan Lee',
  '435-555-0102',
  2019,
  'Ford',
  'F-150',
  'DEMO-202',
  'Flat Repair',
  'in_progress'::public.job_status,
  30,
  0,
  'Marcus',
  now() - interval '47 minutes',
  now() - interval '14 minutes',
  null::timestamptz,
  current_date
from new_location

union all

select
  organization_id,
  id,
  'Taylor Smith',
  '435-555-0103',
  2022,
  'Honda',
  'CR-V',
  'DEMO-303',
  'Tire Rotation',
  'completed'::public.job_status,
  30,
  0,
  'Elena',
  now() - interval '90 minutes',
  now() - interval '58 minutes',
  now() - interval '25 minutes',
  current_date
from new_location;