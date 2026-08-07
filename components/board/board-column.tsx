import JobCard from "@/components/jobs/job-card";
import type { Job, JobStatus } from "@/types/job";

type BoardColumnProps = {
  title: string;
  status: JobStatus;
  jobs: Job[];
  movingJobId: string | null;
  onMoveJob: (job: Job, nextStatus: JobStatus) => Promise<void>;
};

export default function BoardColumn({
  title,
  status,
  jobs,
  movingJobId,
  onMoveJob,
}: BoardColumnProps) {
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