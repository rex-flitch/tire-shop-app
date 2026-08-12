"use client";

import { useState } from "react";
import { setJobAssignmentsAction } from "@/app/actions/assignments";
import {
  getEmployeeFullName,
  isEmployeeCheckedIn,
  type Employee,
} from "@/types/employee";
import type { Job } from "@/types/job";

type AssignmentModalProps = {
  job: Job;
  employees: Employee[];
  onClose: () => void;
  onAssignmentsChanged: () => Promise<void>;
};

export default function AssignmentModal({
  job,
  employees,
  onClose,
  onAssignmentsChanged,
}: AssignmentModalProps) {
  const currentEmployeeIds = job.job_assignments
    .filter((assignment) => assignment.unassigned_at === null)
    .map((assignment) => assignment.employee_id);

  const [selectedEmployeeIds, setSelectedEmployeeIds] =
    useState<string[]>(currentEmployeeIds);

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const availableEmployees = employees.filter(
    (employee) =>
      employee.active &&
      isEmployeeCheckedIn(employee) &&
      employee.location_id === job.location_id,
  );

  function toggleEmployee(employeeId: string) {
    setSelectedEmployeeIds((currentIds) => {
      if (currentIds.includes(employeeId)) {
        return currentIds.filter((id) => id !== employeeId);
      }

      return [...currentIds, employeeId];
    });
  }

  async function saveAssignments() {
    setMessage(null);
    setIsSaving(true);

    try {
      const result = await setJobAssignmentsAction(
        job.id,
        selectedEmployeeIds,
      );

      if (!result.success) {
        setMessage(result.message);
        return;
      }

      await onAssignmentsChanged();
      onClose();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The assignments could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`assignment-title-${job.id}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-200 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Job Assignment
            </p>

            <h2
              id={`assignment-title-${job.id}`}
              className="mt-1 text-xl font-bold text-slate-900"
            >
              {job.customer_name}
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Select one or more checked-in employees.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            Close
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-5">
          {message && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {message}
            </div>
          )}

          {availableEmployees.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center">
              <p className="text-sm font-semibold text-slate-700">
                No employees are available
              </p>

              <p className="mt-1 text-sm text-slate-500">
                An employee must be checked in before they can be assigned.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {availableEmployees.map((employee) => {
                const checked = selectedEmployeeIds.includes(employee.id);

                return (
                  <label
                    key={employee.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 ${
                      checked
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleEmployee(employee.id)}
                      className="h-4 w-4 rounded border-slate-300"
                    />

                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 rounded-full bg-emerald-500"
                    />

                    <span className="flex-1">
                      <span className="block font-semibold text-slate-900">
                        {getEmployeeFullName(employee)}
                      </span>

                      <span className="block text-xs text-slate-500">
                        {employee.active_jobs.length === 0
                          ? "Available"
                          : `${employee.active_jobs.length} active job${
                              employee.active_jobs.length === 1 ? "" : "s"
                            }`}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 p-5">
          <button
            type="button"
            disabled={isSaving || selectedEmployeeIds.length === 0}
            onClick={() => setSelectedEmployeeIds([])}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Remove All
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => void saveAssignments()}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Assignments"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}