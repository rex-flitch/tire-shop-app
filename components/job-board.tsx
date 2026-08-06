"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Job, JobStatus } from "@/types/job";

type JobBoardProps = {
  initialJobs: Job[];
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

const jobFields = `
  id,
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
`;

export default function JobBoard({ initialJobs }: JobBoardProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [message, setMessage] = useState<string | null>(null);
  const [movingJobId, setMovingJobId] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
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
      setMessage(error.message);
      return;
    }

    setJobs((data ?? []) as Job[]);
    setMessage(null);
  }, []);

  useEffect(() => {
    const channel = supabase
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
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadJobs]);

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

    await loadJobs();
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
        <p className="text-sm font-medium text-slate-800">
          {job.service_description}
        </p>

        {job.license_plate && (
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
            Plate: {job.license_plate}
          </p>
        )}

        <p className="mt-3 text-xs text-slate-500">
          {job.assigned_employee_name
            ? `Assigned to ${job.assigned_employee_name}`
            : "Unassigned"}
        </p>
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