import { supabase } from "@/lib/supabase/client";
import type {
  Employee,
  EmployeeActiveJob,
  EmployeeAttendanceSession,
} from "@/types/employee";

type RawEmployee = {
  id: string;
  organization_id: string;
  location_id: string;
  first_name: string;
  last_name: string;
  active: boolean;
};

type RawAttendanceSession = EmployeeAttendanceSession & {
  employee_id: string;
};

type RawActiveAssignment = {
  id: string;
  employee_id: string;
  job_id: string;
  jobs:
    | {
        id: string;
        customer_name: string;
      }
    | Array<{
        id: string;
        customer_name: string;
      }>
    | null;
};

function normalizeRelatedJob(
  relatedJob: RawActiveAssignment["jobs"],
): {
  id: string;
  customer_name: string;
} | null {
  if (Array.isArray(relatedJob)) {
    return relatedJob[0] ?? null;
  }

  return relatedJob;
}

export async function getEmployees(): Promise<Employee[]> {
  const [
    employeesResponse,
    attendanceResponse,
    assignmentsResponse,
  ] = await Promise.all([
    supabase
      .from("employees")
      .select(`
        id,
        organization_id,
        location_id,
        first_name,
        last_name,
        active
      `)
      .order("first_name", {
        ascending: true,
      })
      .order("last_name", {
        ascending: true,
      }),

    supabase
      .from("attendance_sessions")
      .select(`
        id,
        employee_id,
        checked_in_at,
        checked_out_at
      `)
      .is("checked_out_at", null),

    supabase
      .from("job_assignments")
      .select(`
        id,
        employee_id,
        job_id,
        jobs!job_assignments_job_id_fkey (
          id,
          customer_name
        )
      `)
      .is("unassigned_at", null),
  ]);

  if (employeesResponse.error) {
    throw new Error(employeesResponse.error.message);
  }

  if (attendanceResponse.error) {
    throw new Error(attendanceResponse.error.message);
  }

  if (assignmentsResponse.error) {
    throw new Error(assignmentsResponse.error.message);
  }

  const rawEmployees =
    (employeesResponse.data ?? []) as RawEmployee[];

  const attendanceSessions =
    (attendanceResponse.data ?? []) as RawAttendanceSession[];

  const activeAssignments =
    (assignmentsResponse.data ?? []) as unknown as RawActiveAssignment[];

  return rawEmployees.map((employee): Employee => {
    const attendanceSession =
      attendanceSessions.find(
        (session) => session.employee_id === employee.id,
      ) ?? null;

    const activeJobs = activeAssignments
      .filter(
        (assignment) => assignment.employee_id === employee.id,
      )
      .map((assignment): EmployeeActiveJob | null => {
        const job = normalizeRelatedJob(assignment.jobs);

        if (!job) {
          return null;
        }

        return {
          assignment_id: assignment.id,
          job_id: assignment.job_id,
          customer_name: job.customer_name,
        };
      })
      .filter(
        (activeJob): activeJob is EmployeeActiveJob =>
          activeJob !== null,
      );

    return {
      ...employee,
      attendance_session: attendanceSession,
      active_jobs: activeJobs,
    };
  });
}