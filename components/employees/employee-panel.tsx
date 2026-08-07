"use client";

import { useState } from "react";
import {
  checkInEmployeeAction,
  checkOutEmployeeAction,
} from "@/app/actions/attendance";
import {
  getEmployeeFullName,
  isEmployeeCheckedIn,
  type Employee,
} from "@/types/employee";

type EmployeePanelProps = {
  employees: Employee[];
  onAttendanceChanged: () => Promise<void>;
};

export default function EmployeePanel({
  employees,
  onAttendanceChanged,
}: EmployeePanelProps) {
  const [updatingEmployeeId, setUpdatingEmployeeId] =
    useState<string | null>(null);

  const [message, setMessage] = useState<string | null>(null);

  async function checkIn(employee: Employee) {
    setMessage(null);
    setUpdatingEmployeeId(employee.id);

    try {
      const result = await checkInEmployeeAction(employee.id);

      if (!result.success) {
        setMessage(result.message);
        return;
      }

      await onAttendanceChanged();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The employee could not be checked in.",
      );
    } finally {
      setUpdatingEmployeeId(null);
    }
  }

  async function checkOut(employee: Employee) {
    setMessage(null);
    setUpdatingEmployeeId(employee.id);

    try {
      const result = await checkOutEmployeeAction(employee.id);

      if (!result.success) {
        setMessage(result.message);
        return;
      }

      await onAttendanceChanged();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The employee could not be checked out.",
      );
    } finally {
      setUpdatingEmployeeId(null);
    }
  }

  const activeEmployees = employees.filter(
    (employee) => employee.active,
  );

  const checkedInCount = activeEmployees.filter(
    isEmployeeCheckedIn,
  ).length;

  return (
    <section className="mb-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Employees Today
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-900">
            {checkedInCount} of {activeEmployees.length} Checked In
          </h2>
        </div>
      </div>

      {message && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {message}
        </div>
      )}

      {activeEmployees.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          No active employees
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {activeEmployees.map((employee) => {
            const checkedIn = isEmployeeCheckedIn(employee);
            const isUpdating =
              updatingEmployeeId === employee.id;

            return (
              <article
                key={employee.id}
                className="rounded-lg border border-slate-200 p-4"
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                      checkedIn
                        ? "bg-emerald-500"
                        : "bg-slate-300"
                    }`}
                  />

                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-900">
                      {getEmployeeFullName(employee)}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {checkedIn &&
                      employee.attendance_session
                        ? `Checked in ${formatTime(
                            employee.attendance_session
                              .checked_in_at,
                          )}`
                        : "Checked out"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Current Work
                  </p>

                  {employee.active_jobs.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-600">
                      {checkedIn
                        ? "Available"
                        : "No active jobs"}
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-1">
                      {employee.active_jobs.map((job) => (
                        <li
                          key={job.assignment_id}
                          className="text-sm text-slate-700"
                        >
                          {job.customer_name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-4">
                  {checkedIn ? (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => void checkOut(employee)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isUpdating
                        ? "Checking Out..."
                        : "Check Out"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => void checkIn(employee)}
                      className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isUpdating
                        ? "Checking In..."
                        : "Check In"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function formatTime(timestamp: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}