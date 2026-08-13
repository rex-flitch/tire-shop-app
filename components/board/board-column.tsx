import JobCard from "@/components/jobs/job-card";
import type { Employee } from "@/types/employee";
import type {
  Job,
  JobStatus,
} from "@/types/job";

type BoardColumnProps = {
  title: string;
  status: JobStatus;
  jobs: Job[];
  employees: Employee[];
  currentEmployee: Employee;
  movingJobId: string | null;
  claimingJobId: string | null;

  onMoveJob: (
    job: Job,
    nextStatus: JobStatus,
  ) => Promise<void>;

  onClaimJob: (
    job: Job,
  ) => Promise<void>;

  onAssignmentsChanged:
    () => Promise<void>;
};

export default function BoardColumn({
  title,
  status,
  jobs,
  employees,
  currentEmployee,
  movingJobId,
  claimingJobId,
  onMoveJob,
  onClaimJob,
  onAssignmentsChanged,
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
              employees={employees}
              currentEmployee={
                currentEmployee
              }
              columnStatus={status}
              isMoving={
                movingJobId === job.id
              }
              isClaiming={
                claimingJobId === job.id
              }
              onMoveJob={
                onMoveJob
              }
              onClaimJob={
                onClaimJob
              }
              onAssignmentsChanged={
                onAssignmentsChanged
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}