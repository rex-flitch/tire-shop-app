"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { logoutAction } from "@/app/actions/auth";
import {
  claimJobAction,
  moveJobAction,
} from "@/app/actions/jobs";
import BoardColumn from "@/components/board/board-column";
import CompletedDrawer from "@/components/board/completed-drawer";
import EmployeePanel from "@/components/employees/employee-panel";
import CreateJobModal from "@/components/jobs/create-job-modal";
import { getBrowserEmployees } from "@/lib/api/employees";
import { getBrowserJobs } from "@/lib/api/jobs";
import { supabase } from "@/lib/supabase/browser";
import {
  getEmployeeFullName,
  getEmployeeRoleLabel,
  isEmployeeCheckedIn,
  type Employee,
} from "@/types/employee";
import type {
  Job,
  JobStatus,
} from "@/types/job";
import type { ServiceType } from "@/types/service";

type JobBoardProps = {
  initialJobs: Job[];
  initialEmployees: Employee[];
  initialServiceTypes: ServiceType[];
  currentEmployeeId: string;
};

type ActiveJobStatus =
  | "queue"
  | "in_progress";

type ColumnDefinition = {
  status: ActiveJobStatus;
  title: string;
};

const columns: ColumnDefinition[] = [
  {
    status: "queue",
    title: "Queue",
  },
  {
    status: "in_progress",
    title: "In Progress",
  },
];

export default function JobBoard({
  initialJobs,
  initialEmployees,
  initialServiceTypes,
  currentEmployeeId,
}: JobBoardProps) {
  const [jobs, setJobs] =
    useState<Job[]>(initialJobs);

  const [employees, setEmployees] =
    useState<Employee[]>(
      initialEmployees,
    );

  const [message, setMessage] =
    useState<string | null>(null);

  const [movingJobId, setMovingJobId] =
    useState<string | null>(null);

  const [
    claimingJobId,
    setClaimingJobId,
  ] = useState<string | null>(null);

  const [
    completedDrawerOpen,
    setCompletedDrawerOpen,
  ] = useState(false);

  const [
    createJobModalOpen,
    setCreateJobModalOpen,
  ] = useState(false);

  const currentEmployee =
    employees.find(
      (employee) =>
        employee.id ===
        currentEmployeeId,
    ) ?? null;

  const canCreateJobs =
    currentEmployee?.role ===
      "front_desk" ||
    currentEmployee?.role ===
      "manager";

  const loadJobs = useCallback(
    async () => {
      try {
        const updatedJobs =
          await getBrowserJobs();

        setJobs(updatedJobs);
        setMessage(null);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "The jobs could not be loaded.",
        );
      }
    },
    [],
  );

  const loadEmployees = useCallback(
    async () => {
      try {
        const updatedEmployees =
          await getBrowserEmployees();

        setEmployees(updatedEmployees);
        setMessage(null);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "The employees could not be loaded.",
        );
      }
    },
    [],
  );

  useEffect(() => {
    const jobsChannel = supabase
      .channel("jobs-board")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "jobs",
        },
        () => {
          void loadJobs();
          void loadEmployees();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "job_services",
        },
        () => {
          void loadJobs();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "job_assignments",
        },
        () => {
          void loadJobs();
          void loadEmployees();
        },
      )
      .subscribe();

    const employeesChannel =
      supabase
        .channel("employees-panel")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "employees",
          },
          () => {
            void loadEmployees();
          },
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table:
              "attendance_sessions",
          },
          () => {
            void loadEmployees();
          },
        )
        .subscribe();

    return () => {
      void supabase.removeChannel(
        jobsChannel,
      );

      void supabase.removeChannel(
        employeesChannel,
      );
    };
  }, [loadEmployees, loadJobs]);

  async function moveJob(
    job: Job,
    nextStatus: JobStatus,
  ) {
    setMessage(null);
    setMovingJobId(job.id);

    try {
      const result =
        await moveJobAction(
          job.id,
          job.started_at,
          nextStatus,
        );

      if (!result.success) {
        setMessage(result.message);
        return;
      }

      await Promise.all([
        loadJobs(),
        loadEmployees(),
      ]);
    } finally {
      setMovingJobId(null);
    }
  }

  async function claimJob(
    job: Job,
  ) {
    setMessage(null);
    setClaimingJobId(job.id);

    try {
      const result =
        await claimJobAction(
          job.id,
        );

      if (!result.success) {
        setMessage(result.message);
        return;
      }

      await Promise.all([
        loadJobs(),
        loadEmployees(),
      ]);
    } finally {
      setClaimingJobId(null);
    }
  }

  const handleAssignmentsChanged =
    useCallback(async () => {
      await Promise.all([
        loadJobs(),
        loadEmployees(),
      ]);
    }, [
      loadEmployees,
      loadJobs,
    ]);

  const handleJobCreated =
    useCallback(async () => {
      await Promise.all([
        loadJobs(),
        loadEmployees(),
      ]);
    }, [
      loadEmployees,
      loadJobs,
    ]);

  const completedJobs = jobs
    .filter(
      (job) =>
        job.status === "completed",
    )
    .sort((a, b) => {
      const aTime =
        a.completed_at
          ? new Date(
              a.completed_at,
            ).getTime()
          : 0;

      const bTime =
        b.completed_at
          ? new Date(
              b.completed_at,
            ).getTime()
          : 0;

      return bTime - aTime;
    });

  const activeJobCount =
    jobs.filter(
      (job) =>
        job.status !== "completed",
    ).length;

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Tire Shop Workflow
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Today&apos;s Jobs
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              {activeJobCount} active{" "}
              {activeJobCount === 1
                ? "job"
                : "jobs"}
            </p>
          </div>

          <div className="flex flex-wrap items-start gap-3">
            {canCreateJobs && (
              <button
                type="button"
                onClick={() =>
                  setCreateJobModalOpen(
                    true,
                  )
                }
                className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white shadow-sm hover:bg-slate-700"
              >
                + New Job
              </button>
            )}

            {currentEmployee && (
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-start gap-6">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {getEmployeeFullName(
                        currentEmployee,
                      )}
                    </p>

                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <span>
                        {getEmployeeRoleLabel(
                          currentEmployee.role,
                        )}
                      </span>

                      <span
                        aria-hidden="true"
                      >
                        ·
                      </span>

                      <span
                        className={
                          isEmployeeCheckedIn(
                            currentEmployee,
                          )
                            ? "font-medium text-emerald-700"
                            : "font-medium text-slate-500"
                        }
                      >
                        {isEmployeeCheckedIn(
                          currentEmployee,
                        )
                          ? "Checked In"
                          : "Checked Out"}
                      </span>
                    </div>
                  </div>

                  <form
                    action={
                      logoutAction
                    }
                  >
                    <button
                      type="submit"
                      className="text-sm font-semibold text-slate-500 hover:text-slate-900"
                    >
                      Log Out
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </header>

        {currentEmployee && (
          <EmployeePanel
            employees={employees}
            currentEmployee={
              currentEmployee
            }
            onAttendanceChanged={
              loadEmployees
            }
          />
        )}

        {message && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {message}
          </div>
        )}

        {currentEmployee && (
          <section className="grid gap-6 lg:grid-cols-2">
            {columns.map(
              (column) => {
                const columnJobs =
                  jobs.filter(
                    (job) =>
                      job.status ===
                      column.status,
                  );

                return (
                  <BoardColumn
                    key={
                      column.status
                    }
                    title={
                      column.title
                    }
                    status={
                      column.status
                    }
                    jobs={
                      columnJobs
                    }
                    employees={
                      employees
                    }
                    currentEmployee={
                      currentEmployee
                    }
                    movingJobId={
                      movingJobId
                    }
                    claimingJobId={
                      claimingJobId
                    }
                    onMoveJob={
                      moveJob
                    }
                    onClaimJob={
                      claimJob
                    }
                    onAssignmentsChanged={
                      handleAssignmentsChanged
                    }
                  />
                );
              },
            )}
          </section>
        )}

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <button
            type="button"
            onClick={() =>
              setCompletedDrawerOpen(
                true,
              )
            }
            className="flex w-full items-center justify-between gap-4 text-left"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Today
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-900">
                Completed Jobs
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                {
                  completedJobs.length
                }
              </span>

              <span className="text-sm font-semibold text-slate-700">
                View Completed →
              </span>
            </div>
          </button>
        </section>
      </div>

      {currentEmployee && (
        <CompletedDrawer
          jobs={completedJobs}
          isOpen={
            completedDrawerOpen
          }
          onClose={() =>
            setCompletedDrawerOpen(
              false,
            )
          }
          currentEmployee={
            currentEmployee
          }
          onJobReopened={async () => {
            await Promise.all([
              loadJobs(),
              loadEmployees(),
            ]);
          }}
        />
      )}

      {createJobModalOpen &&
        canCreateJobs && (
          <CreateJobModal
            serviceTypes={
              initialServiceTypes
            }
            onClose={() =>
              setCreateJobModalOpen(
                false,
              )
            }
            onJobCreated={
              handleJobCreated
            }
          />
        )}
    </main>
  );
}