import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase as browserSupabase } from "@/lib/supabase/browser";
import type { ServiceType } from "@/types/service";

export async function queryServiceTypes(
  supabase: SupabaseClient,
): Promise<ServiceType[]> {
  const { data, error } = await supabase
    .from("service_types")
    .select(`
      id,
      organization_id,
      name,
      estimated_minutes,
      active
    `)
    .eq("active", true)
    .order("name", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ServiceType[];
}

export async function getBrowserServiceTypes(): Promise<
  ServiceType[]
> {
  return queryServiceTypes(browserSupabase);
}