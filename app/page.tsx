import { redirect } from "next/navigation";
import JobBoard from "@/components/board/job-board";
import { getServerEmployees } from "@/lib/api/employees.server";
import { getServerJobs } from "@/lib/api/jobs.server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase =
    await createSupabaseServerClient();

  const { data, error } =
    await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/login");
  }

  const [jobs, employees] =
    await Promise.all([
      getServerJobs(),
      getServerEmployees(),
    ]);

  return (
    <JobBoard
      initialJobs={jobs}
      initialEmployees={employees}
    />
  );
}