"use server";

import { revalidatePath } from "next/cache";
import { getCurrentEmployee } from "@/lib/auth/current-employee";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { JobStatus } from "@/types/job";

type MoveJobResult =
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    };

type ClaimJobResult =
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    };

type CreateJobResult =
  | {
      success: true;
      jobId: string;
    }
  | {
      success: false;
      message: string;
    };

type ReopenJobResult =
    | {
        success: true;
      }
    | {
        success: false;
        message: string;
      };

export type CreateJobInput = {
  customerName: string;
  customerPhone: string | null;

  vehicleYear: number | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  licensePlate: string | null;

  serviceTypeIds: string[];

  priority: number;
  notes: string | null;
};

export async function moveJobAction(
  jobId: string,
  currentStartedAt: string | null,
  nextStatus: JobStatus,
): Promise<MoveJobResult> {
  if (!jobId) {
    return {
      success: false,
      message: "A job ID is required.",
    };
  }

  const allowedStatuses: JobStatus[] = [
    "queue",
    "in_progress",
    "completed",
  ];

  if (!allowedStatuses.includes(nextStatus)) {
    return {
      success: false,
      message:
        "The requested job status is invalid.",
    };
  }

  const supabase =
    await createSupabaseServerClient();

  try {
    const currentEmployee =
      await getCurrentEmployee(supabase);

    const {
      data: job,
      error: jobError,
    } = await supabase
      .from("jobs")
      .select(`
        id,
        organization_id,
        location_id,
        status,
        started_at
      `)
      .eq("id", jobId)
      .maybeSingle();

    if (jobError) {
      return {
        success: false,
        message: jobError.message,
      };
    }

    if (!job) {
      return {
        success: false,
        message:
          "The selected job does not exist.",
      };
    }

    if (
      job.organization_id !==
        currentEmployee.organization_id ||
      job.location_id !==
        currentEmployee.location_id
    ) {
      return {
        success: false,
        message:
          "You do not have permission to modify this job.",
      };
    }

    if (
      currentEmployee.role ===
      "technician"
    ) {
      if (
        nextStatus !== "completed"
      ) {
        return {
          success: false,
          message:
            "Technicians cannot manually move jobs.",
        };
      }

      if (
        job.status !== "in_progress"
      ) {
        return {
          success: false,
          message:
            "Only an in-progress job can be completed.",
        };
      }

      const {
        data: assignment,
        error: assignmentError,
      } = await supabase
        .from("job_assignments")
        .select("id")
        .eq("job_id", jobId)
        .eq(
          "employee_id",
          currentEmployee.id,
        )
        .is("unassigned_at", null)
        .maybeSingle();

      if (assignmentError) {
        return {
          success: false,
          message:
            assignmentError.message,
        };
      }

      if (!assignment) {
        return {
          success: false,
          message:
            "You can only complete jobs assigned to you.",
        };
      }
    }

    if (
      currentEmployee.role ===
      "front_desk"
    ) {
      if (nextStatus !== "queue") {
        return {
          success: false,
          message:
            "Front desk employees can only move jobs back to the queue.",
        };
      }
    }

    const now = new Date().toISOString();

    const updates: {
      status: JobStatus;
      started_at?: string | null;
      completed_at?: string | null;
    } = {
      status: nextStatus,
    };

    if (nextStatus === "queue") {
      updates.started_at = null;
      updates.completed_at = null;
    }

    if (nextStatus === "in_progress") {
      updates.started_at =
        job.started_at ??
        currentStartedAt ??
        now;

      updates.completed_at = null;
    }

    if (nextStatus === "completed") {
      updates.started_at =
        job.started_at ??
        currentStartedAt ??
        now;

      updates.completed_at = now;
    }

    const { error } = await supabase
      .from("jobs")
      .update(updates)
      .eq("id", jobId);

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    revalidatePath("/");

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "The job could not be updated.",
    };
  }
}

export async function claimJobAction(
  jobId: string,
): Promise<ClaimJobResult> {
  if (!jobId) {
    return {
      success: false,
      message: "A job ID is required.",
    };
  }

  const supabase =
    await createSupabaseServerClient();

  try {
    const currentEmployee =
      await getCurrentEmployee(supabase);

    if (
      currentEmployee.role !==
        "technician" &&
      currentEmployee.role !==
        "manager"
    ) {
      return {
        success: false,
        message:
          "You do not have permission to claim jobs.",
      };
    }

    const { error } = await supabase.rpc(
      "claim_job",
      {
        p_job_id: jobId,
      },
    );

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    revalidatePath("/");

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "The job could not be claimed.",
    };
  }
}

export async function reopenJobAction(
  jobId: string,
): Promise<ReopenJobResult> {
  if (!jobId) {
    return {
      success: false,
      message: "A job ID is required.",
    };
  }

  const supabase =
    await createSupabaseServerClient();

  try {
    const currentEmployee =
      await getCurrentEmployee(supabase);

    if (
      currentEmployee.role !== "manager"
    ) {
      return {
        success: false,
        message:
          "Only managers can reopen completed jobs.",
      };
    }

    const {
      data: job,
      error: jobError,
    } = await supabase
      .from("jobs")
      .select(`
        id,
        organization_id,
        location_id,
        status
      `)
      .eq("id", jobId)
      .maybeSingle();

    if (jobError) {
      return {
        success: false,
        message: jobError.message,
      };
    }

    if (!job) {
      return {
        success: false,
        message:
          "The selected job does not exist.",
      };
    }

    if (
      job.organization_id !==
        currentEmployee.organization_id ||
      job.location_id !==
        currentEmployee.location_id
    ) {
      return {
        success: false,
        message:
          "You do not have permission to reopen this job.",
      };
    }

    if (job.status !== "completed") {
      return {
        success: false,
        message:
          "Only completed jobs can be reopened.",
      };
    }

    const now = new Date().toISOString();

    /*
     * Close active assignments.
     *
     * Assignment history remains intact, but the
     * reopened Queue job becomes unassigned.
     */
    const {
      error: assignmentError,
    } = await supabase
      .from("job_assignments")
      .update({
        unassigned_at: now,
      })
      .eq("job_id", jobId)
      .is("unassigned_at", null);

    if (assignmentError) {
      return {
        success: false,
        message:
          assignmentError.message,
      };
    }

    /*
     * Return the completed job to Queue.
     *
     * The existing database trigger will record
     * completed -> queue in job_status_history.
     */
    const {
      error: jobUpdateError,
    } = await supabase
      .from("jobs")
      .update({
        status: "queue",
        started_at: null,
        completed_at: null,
        queued_at: now,
      })
      .eq("id", jobId);

    if (jobUpdateError) {
      return {
        success: false,
        message:
          jobUpdateError.message,
      };
    }

    revalidatePath("/");

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "The job could not be reopened.",
    };
  }
}

export async function createJobAction(
  input: CreateJobInput,
): Promise<CreateJobResult> {
  const supabase =
    await createSupabaseServerClient();

  try {
    const currentEmployee =
      await getCurrentEmployee(supabase);

    if (
      currentEmployee.role !==
        "front_desk" &&
      currentEmployee.role !==
        "manager"
    ) {
      return {
        success: false,
        message:
          "You do not have permission to create jobs.",
      };
    }

    const customerName =
      input.customerName.trim();

    if (!customerName) {
      return {
        success: false,
        message:
          "Customer name is required.",
      };
    }

    const serviceTypeIds = [
      ...new Set(
        input.serviceTypeIds.filter(
          (serviceTypeId) =>
            typeof serviceTypeId ===
              "string" &&
            serviceTypeId.length > 0,
        ),
      ),
    ];

    if (serviceTypeIds.length === 0) {
      return {
        success: false,
        message:
          "At least one service is required.",
      };
    }

    const {
      data: serviceTypes,
      error: serviceTypesError,
    } = await supabase
      .from("service_types")
      .select(`
        id,
        organization_id,
        name,
        estimated_minutes,
        active
      `)
      .in("id", serviceTypeIds);

    if (serviceTypesError) {
      return {
        success: false,
        message:
          serviceTypesError.message,
      };
    }

    if (
      !serviceTypes ||
      serviceTypes.length !==
        serviceTypeIds.length
    ) {
      return {
        success: false,
        message:
          "One or more selected services are invalid.",
      };
    }

    const invalidService =
      serviceTypes.find(
        (service) =>
          !service.active ||
          service.organization_id !==
            currentEmployee.organization_id,
      );

    if (invalidService) {
      return {
        success: false,
        message:
          "One or more selected services are not available for this shop.",
      };
    }

    const estimatedMinutes =
      serviceTypes.reduce(
        (total, service) =>
          total +
          service.estimated_minutes,
        0,
      );

    const serviceDescription =
      serviceTypes
        .map(
          (service) =>
            service.name,
        )
        .join(", ");

    const {
      data: job,
      error: jobError,
    } = await supabase
      .from("jobs")
      .insert({
        organization_id:
          currentEmployee.organization_id,
        location_id:
          currentEmployee.location_id,

        customer_name:
          customerName,

        customer_phone:
          normalizeOptionalText(
            input.customerPhone,
          ),

        vehicle_year:
          input.vehicleYear,

        vehicle_make:
          normalizeOptionalText(
            input.vehicleMake,
          ),

        vehicle_model:
          normalizeOptionalText(
            input.vehicleModel,
          ),

        license_plate:
          normalizeOptionalText(
            input.licensePlate,
          ),

        service_description:
          serviceDescription,

        status: "queue",

        estimated_minutes:
          estimatedMinutes,

        priority:
          Number.isFinite(
            input.priority,
          )
            ? input.priority
            : 0,

        queued_at:
          new Date().toISOString(),

        notes:
          normalizeOptionalText(
            input.notes,
          ),
      })
      .select("id")
      .single();

    if (jobError) {
      return {
        success: false,
        message: jobError.message,
      };
    }

    const jobServices =
      serviceTypes.map(
        (service) => ({
          job_id: job.id,
          service_type_id:
            service.id,
          service_name:
            service.name,
          estimated_minutes:
            service.estimated_minutes,
        }),
      );

    const {
      error: jobServicesError,
    } = await supabase
      .from("job_services")
      .insert(jobServices);

    if (jobServicesError) {
      /*
       * Since job_services uses ON DELETE CASCADE,
       * remove the incomplete job if the snapshot
       * insert fails.
       */
      await supabase
        .from("jobs")
        .delete()
        .eq("id", job.id);

      return {
        success: false,
        message:
          jobServicesError.message,
      };
    }

    revalidatePath("/");

    return {
      success: true,
      jobId: job.id,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "The job could not be created.",
    };
  }
}

function normalizeOptionalText(
  value: string | null,
): string | null {
  if (value === null) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0
    ? trimmed
    : null;
}