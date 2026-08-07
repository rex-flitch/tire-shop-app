do $$
declare
  demo_organization_id uuid;
  demo_location_id uuid;

  alex_job_id uuid;
  jordan_job_id uuid;
  taylor_job_id uuid;
begin
  -- Create the demo organization.
  insert into public.organizations (
    name,
    timezone
  )
  values (
    'Demo Tire Shop',
    'America/Denver'
  )
  returning id into demo_organization_id;

  -- Create the demo location.
  insert into public.locations (
    organization_id,
    name,
    timezone
  )
  values (
    demo_organization_id,
    'St. George Location',
    'America/Denver'
  )
  returning id into demo_location_id;

  -- Create the shop's editable job types.
  insert into public.service_types (
    organization_id,
    name,
    estimated_minutes,
    active
  )
  values
    (
      demo_organization_id,
      'Balance Tires',
      25,
      true
    ),
    (
      demo_organization_id,
      'Flat Repair/Single Tire',
      20,
      true
    ),
    (
      demo_organization_id,
      'Hold 4 Parts/Tire''s',
      30,
      true
    ),
    (
      demo_organization_id,
      'Install 2 Tires',
      30,
      true
    ),
    (
      demo_organization_id,
      'Install All Tires',
      45,
      true
    ),
    (
      demo_organization_id,
      'Oil Change',
      55,
      true
    ),
    (
      demo_organization_id,
      'Tire Rotation',
      20,
      true
    );

  -- Create Alex's queued job.
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
  values (
    demo_organization_id,
    demo_location_id,
    'Alex Morgan',
    '435-555-0101',
    2021,
    'Toyota',
    'Tacoma',
    'DEMO-101',
    'Install All Tires',
    'queue'::public.job_status,
    45,
    1,
    null,
    now() - interval '18 minutes',
    null,
    null,
    current_date
  )
  returning id into alex_job_id;

  -- Attach Alex's selected service.
  insert into public.job_services (
    job_id,
    service_type_id,
    service_name,
    estimated_minutes
  )
  select
    alex_job_id,
    id,
    name,
    estimated_minutes
  from public.service_types
  where organization_id = demo_organization_id
    and name = 'Install All Tires';

  -- Create Jordan's in-progress job.
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
  values (
    demo_organization_id,
    demo_location_id,
    'Jordan Lee',
    '435-555-0102',
    2019,
    'Ford',
    'F-150',
    'DEMO-202',
    'Flat Repair/Single Tire',
    'in_progress'::public.job_status,
    20,
    0,
    'Marcus',
    now() - interval '47 minutes',
    now() - interval '14 minutes',
    null,
    current_date
  )
  returning id into jordan_job_id;

  -- Attach Jordan's selected service.
  insert into public.job_services (
    job_id,
    service_type_id,
    service_name,
    estimated_minutes
  )
  select
    jordan_job_id,
    id,
    name,
    estimated_minutes
  from public.service_types
  where organization_id = demo_organization_id
    and name = 'Flat Repair/Single Tire';

  -- Create Taylor's completed job with two services.
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
  values (
    demo_organization_id,
    demo_location_id,
    'Taylor Smith',
    '435-555-0103',
    2022,
    'Honda',
    'CR-V',
    'DEMO-303',
    'Tire Rotation, Balance Tires',
    'completed'::public.job_status,
    45,
    0,
    'Elena',
    now() - interval '90 minutes',
    now() - interval '58 minutes',
    now() - interval '25 minutes',
    current_date
  )
  returning id into taylor_job_id;

  -- Attach both selected services to Taylor's job.
  insert into public.job_services (
    job_id,
    service_type_id,
    service_name,
    estimated_minutes
  )
  select
    taylor_job_id,
    id,
    name,
    estimated_minutes
  from public.service_types
  where organization_id = demo_organization_id
    and name in (
      'Tire Rotation',
      'Balance Tires'
    );
end
$$;