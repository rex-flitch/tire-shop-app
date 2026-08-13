"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type LoginResult =
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    };

export async function loginAction(
  email: string,
  password: string,
): Promise<LoginResult> {
  const supabase =
    await createSupabaseServerClient();

  const { error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
  };
}

export async function logoutAction(): Promise<never> {
  const supabase =
    await createSupabaseServerClient();

  await supabase.auth.signOut();

  redirect("/login");
}