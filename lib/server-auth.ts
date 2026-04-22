import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ ok: false, error: "Authentification requise." }, { status: 401 })
    };
  }

  return { user, response: null };
}
