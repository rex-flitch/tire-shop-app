import "server-only";

import { queryEmployees } from "@/lib/api/employees";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Employee } from "@/types/employee";

export async function getServerEmployees(): Promise<
  Employee[]
> {
  const supabase = await createSupabaseServerClient();

  return queryEmployees(supabase);
}