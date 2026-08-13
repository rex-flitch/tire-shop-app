"use server";

import { revalidatePath } from "next/cache";
import { getCurrentEmployee } from "@/lib/auth/current-employee";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AssignmentResult =
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    };

export async function setJobAssignmentsAction(
  jobId: string,
  employeeIds: string[],
): Promise<AssignmentResult> {
  if (!jobId) {
    return {
      success: false,
      message: "A job ID is required.",
    };
  }

  if (!Array.isArray(employeeIds)) {
    return {
      success: false,
      message:
        "The employee selection is invalid.",
    };
  }

  const uniqueEmployeeIds = [
    ...new Set(
      employeeIds.filter(
        (employeeId) =>
          typeof employeeId ===
            "string" &&
          employeeId.length > 0,
      ),
    ),
  ];

  const supabase =
    await createSupabaseServerClient();

  try {
    const currentEmployee =
      await getCurrentEmployee(
        supabase,
      );

    if (
      currentEmployee.role !==
        "manager" &&
      currentEmployee.role !==
        "front_desk"
    ) {
      return {
        success: false,
        message:
          "You do not have permission to manage job assignments.",
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
        location_id
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
          "You cannot manage assignments for this job.",
      };
    }

    const { error } =
      await supabase.rpc(
        "set_job_assignments",
        {
          p_job_id: jobId,
          p_employee_ids:
            uniqueEmployeeIds,
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
          : "The assignments could not be updated.",
    };
  }
}