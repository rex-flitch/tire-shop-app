"use server";

import { revalidatePath } from "next/cache";
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
      message: "The employee selection is invalid.",
    };
  }

  const uniqueEmployeeIds = [
    ...new Set(
      employeeIds.filter(
        (employeeId) =>
          typeof employeeId === "string" &&
          employeeId.length > 0,
      ),
    ),
  ];

  const supabase =
    await createSupabaseServerClient();

  const { error } = await supabase.rpc(
    "set_job_assignments",
    {
      p_job_id: jobId,
      p_employee_ids: uniqueEmployeeIds,
    },
  );

  console.log(error);

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
}