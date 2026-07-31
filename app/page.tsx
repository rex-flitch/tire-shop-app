import { supabase } from "@/lib/supabase/client";

type JobStatus = "queue" | "in_progress" | "completed";

type Job = {
  id: string;
  customer_name: string;
  vehicle_year: number | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  license_plate: string | null;
  service_description: string;
  status: JobStatus;
  estimated_minutes: number;
  assigned_employee_name: string | null;
  queued_at: string;
  started_at: string | null;
  completed_at: string | null;
};

const columns: Array<{
  status: JobStatus;
  title: string;
}> = [
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

export default async function Home() {
  const { data, error } = await supabase
    .from("jobs")
    .select(`
      id,
      customer_name,
      vehicle_year,
      vehicle_make,
      vehicle_model,
      license_plate,
      service_description,
      status,
      estimated_minutes,
      assigned_employee_name,
      queued_at,
      started_at,
      completed_at
    `)
    .order("priority", {
      ascending: false,
    })
    .order("queued_at", {
      ascending: true,
    });

  if (error) {
    console.error(error);

    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-white p-6">
          <h1 className="text-xl font-bold text-red-700">
            The job board could not be loaded
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Make sure Docker and Supabase are running, and verify your
            environment variables.
          </p>

          <pre className="mt-4 overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">
            {error.message}
          </pre>
        </div>
      </main>
    );
  }

  const jobs = (data ?? []) as Job[];

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
            {jobs.length} active and completed jobs loaded from PostgreSQL
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          {columns.map((column) => {
            const columnJobs = jobs.filter(
              (job) => job.status === column.status,
            );

            return (
              <JobColumn
                key={column.status}
                title={column.title}
                jobs={columnJobs}
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
  jobs: Job[];
};

function JobColumn({ title, jobs }: JobColumnProps) {
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
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </section>
  );
}

type JobCardProps = {
  job: Job;
};

function JobCard({ job }: JobCardProps) {
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
    </article>
  );
}