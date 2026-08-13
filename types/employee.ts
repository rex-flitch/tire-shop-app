export type EmployeeRole =
  | "technician"
  | "front_desk"
  | "manager";

export type EmployeeAttendanceSession = {
  id: string;
  checked_in_at: string;
  checked_out_at: string | null;
};

export type EmployeeActiveJob = {
  assignment_id: string;
  job_id: string;
  customer_name: string;
};

export type Employee = {
  id: string;
  organization_id: string;
  location_id: string;
  auth_user_id: string | null;
  first_name: string;
  last_name: string;
  role: EmployeeRole;
  active: boolean;
  attendance_session: EmployeeAttendanceSession | null;
  active_jobs: EmployeeActiveJob[];
};

export function getEmployeeFullName(
  employee: Employee,
): string {
  return `${employee.first_name} ${employee.last_name}`;
}

export function isEmployeeCheckedIn(
  employee: Employee,
): boolean {
  return employee.attendance_session !== null;
}

export function getEmployeeRoleLabel(
  role: EmployeeRole,
): string {
  if (role === "front_desk") {
    return "Front Desk";
  }

  if (role === "manager") {
    return "Manager";
  }

  return "Technician";
}