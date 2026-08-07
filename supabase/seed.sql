do $$
declare
  demo_organization_id uuid;
  demo_location_id uuid;

  marcus_employee_id uuid;
  elena_employee_id uuid;
  chris_employee_id uuid;
  sam_employee_id uuid;

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

  -- Create editable service types.
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

  -- Create employees.
  insert into public.employees (
    organization_id,
    location_id,
    first_name,
    last_name,
    active
  )
  values (
    demo_organization_id,
    demo_location_id,
    'Marcus',
    'Reed',
    true
  )
  returning id into marcus_employee_id;

  insert into public.employees (
    organization_id,
    location_id,
    first_name,
    last_name,
    active
  )
  values (
    demo_organization_id,
    demo_location_id,
    'Elena',
    'Torres',
    true
  )
  returning id into elena_employee_id;

  insert into public.employees (
    organization_id,
    location_id,
    first_name,
    last_name,
    active
  )
  values (
    demo_organization_id,
    demo_location_id,
    'Chris',
    'Miller',
    true
  )
  returning id into chris_employee_id;

  insert into public.employees (
    organization_id,
    location_id,
    first_name,
    last_name,
    active
  )
  values (
    demo_organization_id,
    demo_location_id,
    'Sam',
    'Wilson',
    true
  )
  returning id into sam_employee_id;

  -- Check in Marcus, Elena, and Chris.
  insert into public.attendance_sessions (
    employee_id,
    checked_in_at,
    checked_out_at
  )
  values
    (
      marcus_employee_id,
      now() - interval '4 hours',
      null
    ),
    (
      elena_employee_id,
      now() - interval '3 hours 30 minutes',
      null
    ),
    (
      chris_employee_id,
      now() - interval '2 hours',
      null
    );

  -- Create a completed attendance session for Sam.
  -- Sam is currently checked out and should not appear as assignable.
  insert into public.attendance_sessions (
    employee_id,
    checked_in_at,
    checked_out_at
  )
  values (
    sam_employee_id,
    now() - interval '8 hours',
    now() - interval '1 hour'
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

  -- Attach Alex's service.
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

  -- Assign Chris to Alex's job.
  insert into public.job_assignments (
    job_id,
    employee_id,
    assigned_at
  )
  values (
    alex_job_id,
    chris_employee_id,
    now() - interval '10 minutes'
  );

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
    null,
    now() - interval '47 minutes',
    now() - interval '14 minutes',
    null,
    current_date
  )
  returning id into jordan_job_id;

  -- Attach Jordan's service.
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

  -- Assign Marcus to Jordan's job.
  insert into public.job_assignments (
    job_id,
    employee_id,
    assigned_at
  )
  values (
    jordan_job_id,
    marcus_employee_id,
    now() - interval '14 minutes'
  );

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
    null,
    now() - interval '90 minutes',
    now() - interval '58 minutes',
    now() - interval '25 minutes',
    current_date
  )
  returning id into taylor_job_id;

  -- Attach both services to Taylor's job.
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

  -- Assign Elena and Marcus to Taylor's completed job.
  insert into public.job_assignments (
    job_id,
    employee_id,
    assigned_at
  )
  values
    (
      taylor_job_id,
      elena_employee_id,
      now() - interval '58 minutes'
    ),
    (
      taylor_job_id,
      marcus_employee_id,
      now() - interval '50 minutes'
    );

  -- Mark the completed job assignments as finished.
  update public.job_assignments
  set unassigned_at = now() - interval '25 minutes'
  where job_id = taylor_job_id;
end
$$;