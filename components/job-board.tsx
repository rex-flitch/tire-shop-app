"use client";

import { useCallback, useEffect, useState } from "react";
import EmployeePanel from "@/components/employees/employee-panel";
import { getEmployees } from "@/lib/api/employees";
import { getJobs } from "@/lib/api/jobs";
import { supabase } from "@/lib/supabase/client";
import type { Employee } from "@/types/employee";
import type {
  Job,
  JobAssignment,
  JobStatus,
} from "@/types/job";

type JobBoardProps = {
  initialJobs: Job[];
  initialEmployees: Employee[];
};

type ColumnDefinition = {
  status: JobStatus;
  title: string;
};

type DatabaseUpdates = {
  status: JobStatus;
  started_at?: string | null;
  completed_at?: string | null;
};

const columns: ColumnDefinition[] = [
  {
    status: "queue",
    title: "Queue",
  },
  {
    status: "in_progress",
    title: "In Progress",
  },
  {
    status: "completed",
    title: "Completed",
  },
];

export default function JobBoard({
  initialJobs,
  initialEmployees,
}: JobBoardProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [employees, setEmployees] =
    useState<Employee[]>(initialEmployees);

  const [message, setMessage] = useState<string | null>(null);
  const [movingJobId, setMovingJobId] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    try {
      const updatedJobs = await getJobs();

      setJobs(updatedJobs);
      setMessage(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "The jobs could not be loaded.";

      setMessage(errorMessage);
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      const updatedEmployees = await getEmployees();

      setEmployees(updatedEmployees);
      setMessage(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "The employees could not be loaded.";

      setMessage(errorMessage);
    }
  }, []);

  useEffect(() => {
    const jobsChannel = supabase
      .channel("jobs-board")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "jobs",
        },
        () => {
          void loadJobs();
          void loadEmployees();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "job_services",
        },
        () => {
          void loadJobs();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "job_assignments",
        },
        () => {
          void loadJobs();
          void loadEmployees();
        },
      )
      .subscribe();

    const employeesChannel = supabase
      .channel("employees-panel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "employees",
        },
        () => {
          void loadEmployees();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance_sessions",
        },
        () => {
          void loadEmployees();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(jobsChannel);
      void supabase.removeChannel(employeesChannel);
    };
  }, [loadEmployees, loadJobs]);

  async function moveJob(job: Job, nextStatus: JobStatus) {
    setMessage(null);
    setMovingJobId(job.id);

    const now = new Date().toISOString();

    const updates: DatabaseUpdates = {
      status: nextStatus,
    };

    if (nextStatus === "queue") {
      updates.started_at = null;
      updates.completed_at = null;
    }

    if (nextStatus === "in_progress") {
      updates.started_at = job.started_at ?? now;
      updates.completed_at = null;
    }

    if (nextStatus === "completed") {
      updates.started_at = job.started_at ?? now;
      updates.completed_at = now;
    }

    const { error } = await supabase
      .from("jobs")
      .update(updates)
      .eq("id", job.id);

    if (error) {
      setMessage(error.message);
      setMovingJobId(null);
      return;
    }

    await Promise.all([
      loadJobs(),
      loadEmployees(),
    ]);

    setMovingJobId(null);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Tire Shop Workflow
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Today&apos;s Jobs
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            {jobs.length} jobs loaded from PostgreSQL
          </p>
        </header>

        <EmployeePanel
          employees={employees}
          onAttendanceChanged={loadEmployees}
        />

        {message && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {message}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-3">
          {columns.map((column) => {
            const columnJobs = jobs.filter(
              (job) => job.status === column.status,
            );

            return (
              <JobColumn
                key={column.status}
                title={column.title}
                status={column.status}
                jobs={columnJobs}
                movingJobId={movingJobId}
                onMoveJob={moveJob}
              />
            );
          })}
        </section>
      </div>
    </main>
  );
}

type JobColumnProps = {
  title: string;
  status: JobStatus;
  jobs: Job[];
  movingJobId: string | null;
  onMoveJob: (job: Job, nextStatus: JobStatus) => Promise<void>;
};

function JobColumn({
  title,
  status,
  jobs,
  movingJobId,
  onMoveJob,
}: JobColumnProps) {
  return (
    <section className="min-h-96 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          {title}
        </h2>

        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          {jobs.length}
        </span>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          No jobs
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              columnStatus={status}
              isMoving={movingJobId === job.id}
              onMoveJob={onMoveJob}
            />
          ))}
        </div>
      )}
    </section>
  );
}

type JobCardProps = {
  job: Job;
  columnStatus: JobStatus;
  isMoving: boolean;
  onMoveJob: (job: Job, nextStatus: JobStatus) => Promise<void>;
};

function JobCard({
  job,
  columnStatus,
  isMoving,
  onMoveJob,
}: JobCardProps) {
  const vehicle = [
    job.vehicle_year,
    job.vehicle_make,
    job.vehicle_model,
  ]
    .filter(Boolean)
    .join(" ");

  const currentAssignments = job.job_assignments.filter(
    (assignment) => assignment.unassigned_at === null,
  );

  const historicalAssignments = job.job_assignments.filter(
    (assignment) => assignment.unassigned_at !== null,
  );

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">
            {job.customer_name}
          </h3>

          <p className="mt-1 text-sm text-slate-600">
            {vehicle || "Vehicle not entered"}
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
          {job.estimated_minutes} min
        </span>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Services
        </p>

        {job.job_services.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            No services selected
          </p>
        ) : (
          <ul className="mt-2 space-y-1">
            {job.job_services.map((service) => (
              <li
                key={service.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="font-medium text-slate-800">
                  {service.service_name}
                </span>

                <span className="shrink-0 text-xs text-slate-500">
                  {service.estimated_minutes} min
                </span>
              </li>
            ))}
          </ul>
        )}

        {job.license_plate && (
          <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">
            Plate: {job.license_plate}
          </p>
        )}
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Assigned Employees
        </p>

        {currentAssignments.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            Unassigned
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            {currentAssignments.map((assignment) => (
              <AssignmentName
                key={assignment.id}
                assignment={assignment}
              />
            ))}
          </div>
        )}

        {columnStatus === "completed" &&
          historicalAssignments.length > 0 && (
            <div className="mt-2 space-y-2">
              {historicalAssignments.map((assignment) => (
                <AssignmentName
                  key={assignment.id}
                  assignment={assignment}
                />
              ))}
            </div>
          )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {columnStatus !== "queue" && (
          <button
            type="button"
            disabled={isMoving}
            onClick={() => void onMoveJob(job, "queue")}
            className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Move to Queue
          </button>
        )}

        {columnStatus !== "in_progress" && (
          <button
            type="button"
            disabled={isMoving}
            onClick={() => void onMoveJob(job, "in_progress")}
            className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Start Job
          </button>
        )}

        {columnStatus !== "completed" && (
          <button
            type="button"
            disabled={isMoving}
            onClick={() => void onMoveJob(job, "completed")}
            className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Complete
          </button>
        )}
      </div>
    </article>
  );
}

type AssignmentNameProps = {
  assignment: JobAssignment;
};

function AssignmentName({ assignment }: AssignmentNameProps) {
  const employee = assignment.employee;

  if (!employee) {
    return (
      <p className="text-sm text-amber-700">
        Employee record unavailable
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-slate-700">
      <span
        aria-hidden="true"
        className="h-2 w-2 rounded-full bg-emerald-500"
      />

      <span>
        {employee.first_name} {employee.last_name}
      </span>
    </div>
  );
}