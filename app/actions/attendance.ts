"use server";

import { revalidatePath } from "next/cache";
import { getCurrentEmployee } from "@/lib/auth/current-employee";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AttendanceActionResult =
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    };

function canManageAttendance(
  currentEmployee: {
    id: string;
    role:
      | "technician"
      | "front_desk"
      | "manager";
  },
  targetEmployeeId: string,
): boolean {
  if (
    currentEmployee.id ===
    targetEmployeeId
  ) {
    return true;
  }

  return (
    currentEmployee.role ===
      "manager" ||
    currentEmployee.role ===
      "front_desk"
  );
}

export async function checkInEmployeeAction(
  employeeId: string,
): Promise<AttendanceActionResult> {
  if (!employeeId) {
    return {
      success: false,
      message:
        "An employee ID is required.",
    };
  }

  const supabase =
    await createSupabaseServerClient();

  try {
    const currentEmployee =
      await getCurrentEmployee(
        supabase,
      );

    if (
      !canManageAttendance(
        currentEmployee,
        employeeId,
      )
    ) {
      return {
        success: false,
        message:
          "You do not have permission to check in this employee.",
      };
    }

    const {
      data: employee,
      error: employeeError,
    } = await supabase
      .from("employees")
      .select(`
        id,
        organization_id,
        location_id,
        active
      `)
      .eq("id", employeeId)
      .maybeSingle();

    if (employeeError) {
      return {
        success: false,
        message:
          employeeError.message,
      };
    }

    if (!employee) {
      return {
        success: false,
        message:
          "The selected employee does not exist.",
      };
    }

    if (
      employee.organization_id !==
        currentEmployee.organization_id ||
      employee.location_id !==
        currentEmployee.location_id
    ) {
      return {
        success: false,
        message:
          "You cannot manage attendance for this employee.",
      };
    }

    if (!employee.active) {
      return {
        success: false,
        message:
          "Inactive employees cannot check in.",
      };
    }

    const {
      data: existingSession,
      error: sessionError,
    } = await supabase
      .from("attendance_sessions")
      .select("id")
      .eq(
        "employee_id",
        employeeId,
      )
      .is(
        "checked_out_at",
        null,
      )
      .maybeSingle();

    if (sessionError) {
      return {
        success: false,
        message:
          sessionError.message,
      };
    }

    if (existingSession) {
      return {
        success: false,
        message:
          "This employee is already checked in.",
      };
    }

    const { error: insertError } =
      await supabase
        .from(
          "attendance_sessions",
        )
        .insert({
          employee_id:
            employeeId,
          checked_in_at:
            new Date().toISOString(),
        });

    if (insertError) {
      return {
        success: false,
        message:
          insertError.message,
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
          : "The employee could not be checked in.",
    };
  }
}

export async function checkOutEmployeeAction(
  employeeId: string,
): Promise<AttendanceActionResult> {
  if (!employeeId) {
    return {
      success: false,
      message:
        "An employee ID is required.",
    };
  }

  const supabase =
    await createSupabaseServerClient();

  try {
    const currentEmployee =
      await getCurrentEmployee(
        supabase,
      );

    if (
      !canManageAttendance(
        currentEmployee,
        employeeId,
      )
    ) {
      return {
        success: false,
        message:
          "You do not have permission to check out this employee.",
      };
    }

    const {
      data: employee,
      error: employeeError,
    } = await supabase
      .from("employees")
      .select(`
        id,
        organization_id,
        location_id
      `)
      .eq("id", employeeId)
      .maybeSingle();

    if (employeeError) {
      return {
        success: false,
        message:
          employeeError.message,
      };
    }

    if (!employee) {
      return {
        success: false,
        message:
          "The selected employee does not exist.",
      };
    }

    if (
      employee.organization_id !==
        currentEmployee.organization_id ||
      employee.location_id !==
        currentEmployee.location_id
    ) {
      return {
        success: false,
        message:
          "You cannot manage attendance for this employee.",
      };
    }

    const {
      data: openSession,
      error: sessionError,
    } = await supabase
      .from("attendance_sessions")
      .select("id")
      .eq(
        "employee_id",
        employeeId,
      )
      .is(
        "checked_out_at",
        null,
      )
      .order("checked_in_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (sessionError) {
      return {
        success: false,
        message:
          sessionError.message,
      };
    }

    if (!openSession) {
      return {
        success: false,
        message:
          "This employee is not currently checked in.",
      };
    }

    const { error: updateError } =
      await supabase
        .from(
          "attendance_sessions",
        )
        .update({
          checked_out_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          openSession.id,
        )
        .is(
          "checked_out_at",
          null,
        );

    if (updateError) {
      return {
        success: false,
        message:
          updateError.message,
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
          : "The employee could not be checked out.",
    };
  }
}