"use client";

import type { Job } from "@/types/job";

type CompletedDrawerProps = {
  jobs: Job[];
  isOpen: boolean;
  onClose: () => void;
};

export default function CompletedDrawer({
  jobs,
  isOpen,
  onClose,
}: CompletedDrawerProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close completed jobs"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="completed-jobs-title"
        className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-slate-100 shadow-2xl"
      >
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Today
              </p>

              <h2
                id="completed-jobs-title"
                className="mt-1 text-2xl font-bold text-slate-900"
              >
                Completed Jobs
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                {jobs.length} completed{" "}
                {jobs.length === 1 ? "job" : "jobs"}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </header>

        <div className="space-y-4 p-5">
          {jobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="font-semibold text-slate-700">
                No completed jobs yet
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Jobs completed today will appear here.
              </p>
            </div>
          ) : (
            jobs.map((job) => (
              <CompletedJobCard
                key={job.id}
                job={job}
              />
            ))
          )}
        </div>
      </aside>
    </div>
  );
}

type CompletedJobCardProps = {
  job: Job;
};

function CompletedJobCard({
  job,
}: CompletedJobCardProps) {
  const vehicle = [
    job.vehicle_year,
    job.vehicle_make,
    job.vehicle_model,
  ]
    .filter(Boolean)
    .join(" ");

  const assignments =
    job.job_assignments.filter(
      (assignment) =>
        assignment.employee !== null,
    );

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            {job.customer_name}
          </h3>

          <p className="mt-1 text-sm text-slate-600">
            {vehicle || "Vehicle not entered"}
          </p>
        </div>

        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          Completed
        </span>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Services
        </p>

        <ul className="mt-2 space-y-1">
          {job.job_services.map((service) => (
            <li
              key={service.id}
              className="flex justify-between gap-4 text-sm"
            >
              <span className="text-slate-800">
                {service.service_name}
              </span>

              <span className="shrink-0 text-slate-500">
                {service.estimated_minutes} min
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Worked By
        </p>

        {assignments.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            No employee history
          </p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {assignments.map((assignment) => {
              const employee =
                assignment.employee;

              if (!employee) {
                return null;
              }

              return (
                <span
                  key={assignment.id}
                  className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                >
                  {employee.first_name}{" "}
                  {employee.last_name}
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
        <TimeStat
          label="Estimated"
          value={`${job.estimated_minutes} min`}
        />

        <TimeStat
          label="Completed"
          value={
            job.completed_at
              ? formatTime(job.completed_at)
              : "Unknown"
          }
        />
      </div>
    </article>
  );
}

type TimeStatProps = {
  label: string;
  value: string;
};

function TimeStat({
  label,
  value,
}: TimeStatProps) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function formatTime(
  timestamp: string,
): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}