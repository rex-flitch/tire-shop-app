import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  EmployeeRole,
} from "@/types/employee";

export type CurrentEmployee = {
  id: string;
  organization_id: string;
  location_id: string;
  auth_user_id: string;
  first_name: string;
  last_name: string;
  role: EmployeeRole;
  active: boolean;
};

export async function getCurrentEmployee(
  supabase: SupabaseClient,
): Promise<CurrentEmployee> {
  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  const authUserId =
    claimsData?.claims?.sub;

  if (
    claimsError ||
    !authUserId
  ) {
    throw new Error(
      "You must be logged in to perform this action.",
    );
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
      auth_user_id,
      first_name,
      last_name,
      role,
      active
    `)
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (employeeError) {
    throw new Error(
      employeeError.message,
    );
  }

  if (!employee) {
    throw new Error(
      "Your login is not linked to an employee.",
    );
  }

  if (!employee.active) {
    throw new Error(
      "Your employee account is inactive.",
    );
  }

  return employee as CurrentEmployee;
}