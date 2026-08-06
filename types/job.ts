export type JobStatus = "queue" | "in_progress" | "completed";

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
  service_description: string;
  status: JobStatus;
  estimated_minutes: number;
  priority: number;
  assigned_employee_name: string | null;
  queued_at: string;
  started_at: string | null;
  completed_at: string | null;
  business_date: string;
};