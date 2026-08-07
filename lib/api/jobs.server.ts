import "server-only";

import { jobFields, normalizeJob } from "@/lib/api/jobs";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Job } from "@/types/job";

export async function getServerJobs(): Promise<Job[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("jobs")
    .select(jobFields)
    .order("priority", {
      ascending: false,
    })
    .order("queued_at", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as unknown[]).map((job) =>
    normalizeJob(
      job as Parameters<typeof normalizeJob>[0],
    ),
  );
}