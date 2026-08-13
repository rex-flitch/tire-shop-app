import "server-only";

import { queryServiceTypes } from "@/lib/api/services";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ServiceType } from "@/types/service";

export async function getServerServiceTypes(): Promise<
  ServiceType[]
> {
  const supabase =
    await createSupabaseServerClient();

  return queryServiceTypes(supabase);
}