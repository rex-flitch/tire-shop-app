import { redirect } from "next/navigation";
import JobBoard from "@/components/board/job-board";
import { getServerEmployees } from "@/lib/api/employees.server";
import { getServerJobs } from "@/lib/api/jobs.server";
import { getServerServiceTypes } from "@/lib/api/services.server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase =
    await createSupabaseServerClient();

  const { data, error } =
    await supabase.auth.getClaims();

  if (
    error ||
    !data?.claims?.sub
  ) {
    redirect("/login");
  }

  const [
    jobs,
    employees,
    serviceTypes,
  ] = await Promise.all([
    getServerJobs(),
    getServerEmployees(),
    getServerServiceTypes(),
  ]);

  const currentEmployee =
    employees.find(
      (employee) =>
        employee.auth_user_id ===
        data.claims.sub,
    );

  if (!currentEmployee) {
    throw new Error(
      "The authenticated user is not linked to an employee.",
    );
  }

  return (
    <JobBoard
      initialJobs={jobs}
      initialEmployees={employees}
      initialServiceTypes={
        serviceTypes
      }
      currentEmployeeId={
        currentEmployee.id
      }
    />
  );
}