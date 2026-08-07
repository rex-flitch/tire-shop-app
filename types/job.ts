export type JobStatus = "queue" | "in_progress" | "completed";

export type JobService = {
  id: string;
  service_type_id: string | null;
  service_name: string;
  estimated_minutes: number;
  created_at: string;
};

export type AssignedEmployee = {
  id: string;
  first_name: string;
  last_name: string;
  active: boolean;
};

export type JobAssignment = {
  id: string;
  employee_id: string;
  assigned_at: string;
  unassigned_at: string | null;
  employee: AssignedEmployee | null;
};

export type Job = {
  id: string;
  organization_id: string;
  location_id: string;

  customer_name: string;
  customer_phone: string | null;

  vehicle_year: number | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  license_plate: string | null;

  status: JobStatus;
  estimated_minutes: number;
  priority: number;

  queued_at: string;
  started_at: string | null;
  completed_at: string | null;
  business_date: string;

  notes: string | null;

  job_services: JobService[];
  job_assignments: JobAssignment[];
};