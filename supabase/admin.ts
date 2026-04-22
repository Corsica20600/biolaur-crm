import { createClient } from "@supabase/supabase-js";

const FALLBACK_SUPABASE_URL = "https://mrtsoahvnhclcmigungi.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ydHNvYWh2bmhjbGNtaWd1bmdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3Nzk1MjAsImV4cCI6MjA5MjM1NTUyMH0.lyeyCJm54XjTsmi-VNVtNeqEvUb2-1BKRCULxjB0gs8";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Variables Supabase serveur manquantes.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Variables Supabase serveur manquantes.");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
