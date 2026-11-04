import { createClient } from "@supabase/supabase-js";

/**
 * عميل بصلاحية service_role — للسيرفر فقط (API Routes / Server Actions).
 * يتجاوز RLS؛ لا يُستورد أبدًا في مكوّن عميل.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase admin غير مهيّأ: تأكد من NEXT_PUBLIC_SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY في .env.local",
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
