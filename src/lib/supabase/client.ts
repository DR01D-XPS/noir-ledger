"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env, hasSupabaseCredentials } from "@/lib/env";
import type { Database } from "@/lib/supabase/database";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
  if (!hasSupabaseCredentials) {
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      env.supabaseUrl,
      env.supabaseAnonKey,
    );
  }

  return browserClient;
}
