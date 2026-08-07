import AssignmentName from "@/components/jobs/assignment-name";
import type { Job, JobStatus } from "@/types/job";

type JobCardProps = {
  job: Job;
  columnStatus: JobStatus;
  isMoving: boolean;
  onMoveJob: (job: Job, nextStatus: JobStatus) => Promise<void>;
};

export default function JobCard({
  job,
  columnStatus,
  isMoving,
  onMoveJob,
}: JobCardProps) {
  const vehicle = [
    job.vehicle_year,
    job.vehicle_make,
    job.vehicle_model,
  ]
    .filter(Boolean)
    .join(" ");

  const currentAssignments = job.job_assignments.filter(
    (assignment) => assignment.unassigned_at === null,
  );

  const historicalAssignments = job.job_assignments.filter(
    (assignment) => assignment.unassigned_at !== null,
  );

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
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Services
        </p>

        {job.job_services.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            No services selected
          </p>
        ) : (
          <ul className="mt-2 space-y-1">
            {job.job_services.map((service) => (
              <li
                key={service.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="font-medium text-slate-800">
                  {service.service_name}
                </span>

                <span className="shrink-0 text-xs text-slate-500">
                  {service.estimated_minutes} min
                </span>
              </li>
            ))}
          </ul>
        )}

        {job.license_plate && (
          <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">
            Plate: {job.license_plate}
          </p>
        )}
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Assigned Employees
        </p>

        {currentAssignments.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            Unassigned
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            {currentAssignments.map((assignment) => (
              <AssignmentName
                key={assignment.id}
                assignment={assignment}
              />
            ))}
          </div>
        )}

        {columnStatus === "completed" &&
          historicalAssignments.length > 0 && (
            <div className="mt-2 space-y-2">
              {historicalAssignments.map((assignment) => (
                <AssignmentName
                  key={assignment.id}
                  assignment={assignment}
                />
              ))}
            </div>
          )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {columnStatus !== "queue" && (
          <button
            type="button"
            disabled={isMoving}
            onClick={() => void onMoveJob(job, "queue")}
            className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Move to Queue
          </button>
        )}

        {columnStatus !== "in_progress" && (
          <button
            type="button"
            disabled={isMoving}
            onClick={() => void onMoveJob(job, "in_progress")}
            className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Start Job
          </button>
        )}

        {columnStatus !== "completed" && (
          <button
            type="button"
            disabled={isMoving}
            onClick={() => void onMoveJob(job, "completed")}
            className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Complete
          </button>
        )}
      </div>
    </article>
  );
}