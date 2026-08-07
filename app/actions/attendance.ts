"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AttendanceActionResult =
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    };

export async function checkInEmployeeAction(
  employeeId: string,
): Promise<AttendanceActionResult> {
  if (!employeeId) {
    return {
      success: false,
      message: "An employee ID is required.",
    };
  }

  const supabase = await createSupabaseServerClient();

  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select(`
      id,
      active
    `)
    .eq("id", employeeId)
    .maybeSingle();

  if (employeeError) {
    return {
      success: false,
      message: employeeError.message,
    };
  }

  if (!employee) {
    return {
      success: false,
      message: "The selected employee does not exist.",
    };
  }

  if (!employee.active) {
    return {
      success: false,
      message: "Inactive employees cannot check in.",
    };
  }

  const { data: existingSession, error: sessionError } =
    await supabase
      .from("attendance_sessions")
      .select("id")
      .eq("employee_id", employeeId)
      .is("checked_out_at", null)
      .maybeSingle();

  if (sessionError) {
    return {
      success: false,
      message: sessionError.message,
    };
  }

  if (existingSession) {
    return {
      success: false,
      message: "This employee is already checked in.",
    };
  }

  const { error: insertError } = await supabase
    .from("attendance_sessions")
    .insert({
      employee_id: employeeId,
      checked_in_at: new Date().toISOString(),
    });

  if (insertError) {
    return {
      success: false,
      message: insertError.message,
    };
  }

  revalidatePath("/");

  return {
    success: true,
  };
}

export async function checkOutEmployeeAction(
  employeeId: string,
): Promise<AttendanceActionResult> {
  if (!employeeId) {
    return {
      success: false,
      message: "An employee ID is required.",
    };
  }

  const supabase = await createSupabaseServerClient();

  const { data: openSession, error: sessionError } =
    await supabase
      .from("attendance_sessions")
      .select("id")
      .eq("employee_id", employeeId)
      .is("checked_out_at", null)
      .order("checked_in_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

  if (sessionError) {
    return {
      success: false,
      message: sessionError.message,
    };
  }

  if (!openSession) {
    return {
      success: false,
      message: "This employee is not currently checked in.",
    };
  }

  const { error: updateError } = await supabase
    .from("attendance_sessions")
    .update({
      checked_out_at: new Date().toISOString(),
    })
    .eq("id", openSession.id)
    .is("checked_out_at", null);

  if (updateError) {
    return {
      success: false,
      message: updateError.message,
    };
  }

  revalidatePath("/");

  return {
    success: true,
  };
}