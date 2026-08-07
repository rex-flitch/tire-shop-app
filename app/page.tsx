import JobBoard from "@/components/job-board";
import { getJobs } from "@/lib/api/jobs";

export default async function Home() {
  const jobs = await getJobs();

  return <JobBoard initialJobs={jobs} />;
}