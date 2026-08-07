"use client";

import { useCallback, useEffect, useState } from "react";
import BoardColumn from "@/components/board/board-column";
import EmployeePanel from "@/components/employees/employee-panel";
import { moveJobAction } from "@/app/actions/jobs";
import { getBrowserEmployees } from "@/lib/api/employees";
import { getBrowserJobs } from "@/lib/api/jobs";
import { supabase } from "@/lib/supabase/browser";
import type { Employee } from "@/types/employee";
import type { Job, JobStatus } from "@/types/job";

type JobBoardProps = {
  initialJobs: Job[];
  initialEmployees: Employee[];
};

type ColumnDefinition = {
  status: JobStatus;
  title: string;
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
      const updatedJobs =
        await getBrowserJobs();
  
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
      const updatedEmployees =
        await getBrowserEmployees();
  
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

  async function moveJob(
    job: Job,
    nextStatus: JobStatus,
  ) {
    setMessage(null);
    setMovingJobId(job.id);
  
    const result = await moveJobAction(
      job.id,
      job.started_at,
      nextStatus,
    );
  
    if (!result.success) {
      setMessage(result.message);
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
              <BoardColumn
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