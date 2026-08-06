import JobBoard from "@/components/job-board";
import { supabase } from "@/lib/supabase/client";
import type { Job } from "@/types/job";

export default async function Home() {
  const { data, error } = await supabase
    .from("jobs")
    .select(`
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
            Make sure Docker and Supabase are running, then verify the database
            permissions and environment variables.
          </p>

          <pre className="mt-4 overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">
            {error.message}
          </pre>
        </div>
      </main>
    );
  }

  return <JobBoard initialJobs={(data ?? []) as Job[]} />;
}