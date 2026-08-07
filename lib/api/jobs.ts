import { supabase } from "@/lib/supabase/browser";
import type {
  AssignedEmployee,
  Job,
  JobAssignment,
  JobService,
} from "@/types/job";

export const jobFields = `
  id,
  organization_id,
  location_id,
  customer_name,
  customer_phone,
  vehicle_year,
  vehicle_make,
  vehicle_model,
  license_plate,
  status,
  estimated_minutes,
  priority,
  queued_at,
  started_at,
  completed_at,
  business_date,
  notes,
  job_services (
    id,
    service_type_id,
    service_name,
    estimated_minutes,
    created_at
  ),
  job_assignments (
    id,
    employee_id,
    assigned_at,
    unassigned_at,
    employee:employees!job_assignments_employee_id_fkey (
      id,
      first_name,
      last_name,
      active
    )
  )
`;

type RawEmployee =
  | AssignedEmployee
  | AssignedEmployee[]
  | null;

type RawJobAssignment = Omit<
  JobAssignment,
  "employee"
> & {
  employee: RawEmployee;
};

type RawJob = Omit<
  Job,
  "job_assignments" | "job_services"
> & {
  job_services: JobService[] | null;
  job_assignments: RawJobAssignment[] | null;
};

function normalizeEmployee(
  employee: RawEmployee,
): AssignedEmployee | null {
  if (Array.isArray(employee)) {
    return employee[0] ?? null;
  }

  return employee;
}

export function normalizeJob(rawJob: RawJob): Job {
  return {
    ...rawJob,
    job_services: rawJob.job_services ?? [],
    job_assignments: (rawJob.job_assignments ?? []).map(
      (assignment): JobAssignment => ({
        ...assignment,
        employee: normalizeEmployee(assignment.employee),
      }),
    ),
  };
}

export async function getBrowserJobs(): Promise<Job[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select(jobFields)
    .order("priority", {
      ascending: false,
    })
    .order("queued_at", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as unknown as RawJob[]).map(
    normalizeJob,
  );
}