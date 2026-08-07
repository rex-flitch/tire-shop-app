import JobBoard from "@/components/job-board";
import { getEmployees } from "@/lib/api/employees";
import { getJobs } from "@/lib/api/jobs";

export default async function Home() {
  const [jobs, employees] = await Promise.all([
    getJobs(),
    getEmployees(),
  ]);

  return (
    <JobBoard
      initialJobs={jobs}
      initialEmployees={employees}
    />
  );
}