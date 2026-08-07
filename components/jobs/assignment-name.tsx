import type { JobAssignment } from "@/types/job";

type AssignmentNameProps = {
  assignment: JobAssignment;
};

export default function AssignmentName({
  assignment,
}: AssignmentNameProps) {
  const employee = assignment.employee;

  if (!employee) {
    return (
      <p className="text-sm text-amber-700">
        Employee record unavailable
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-slate-700">
      <span
        aria-hidden="true"
        className="h-2 w-2 rounded-full bg-emerald-500"
      />

      <span>
        {employee.first_name} {employee.last_name}
      </span>
    </div>
  );
}