"use server";

import { revalidatePath } from "next/cache";
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
      message: "The requested job status is invalid.",
    };
  }

  const supabase =
    await createSupabaseServerClient();

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
      currentStartedAt ?? now;

    updates.completed_at = null;
  }

  if (nextStatus === "completed") {
    updates.started_at =
      currentStartedAt ?? now;

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
}