import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

/**
 * عميل Supabase للقراءة العامة (بدون كوكيز).
 *
 * الصفحات العامة تُصيَّر مسبقًا (ISR)؛ استعمال عميل يقرأ الكوكيز كان يجبر كل
 * صفحة على التصيير عند كل طلب. هذا العميل يقرأ ما تسمح به سياسات RLS العامة
 * فقط (`is_published`)، ولا يحمل جلسة.
 */
let cached: SupabaseClient | null = null;

export function createPublicSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (cached) return cached;

  cached = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { "x-application-name": "ras-platform-public" } },
  });

  return cached;
}
