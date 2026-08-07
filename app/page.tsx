import JobBoard from "@/components/board/job-board";
import { getServerEmployees } from "@/lib/api/employees.server";
import { getServerJobs } from "@/lib/api/jobs.server";

export default async function Home() {
  const [jobs, employees] = await Promise.all([
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