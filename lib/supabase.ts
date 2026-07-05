import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";
import type { Database } from "./types";

// Server-side Supabase client using the SERVICE ROLE key.
//
// This key bypasses Row Level Security, so it must ONLY ever be imported from
// server contexts (API routes, scripts). Never import this from a Client
// Component or ship it to the browser.
//
// Lazily instantiated so that merely importing this module doesn't throw when
// env vars are absent (e.g. during `next build` of unrelated pages).

let client: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> {
  if (client) return client;

  client = createClient<Database>(
    env.supabaseUrl,
    env.supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  return client;
}
