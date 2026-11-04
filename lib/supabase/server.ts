import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  isSupabaseConfigured,
} from "@/lib/supabase/env";

/**
 * عميل Supabase للسيرفر مع كوكيز الجلسة (RLS مطبّق).
 * يُرجع null إذا لم تُضبط مفاتيح البيئة بعد.
 */
export async function createServerSupabase() {
  if (!isSupabaseConfigured) return null;
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // يُستدعى من Server Component — التحديث يتولاه middleware
        }
      },
    },
  });
}

/** جلسة المستخدم الحالي (أو null) */
export async function getSession() {
  const supabase = await createServerSupabase();
  if (!supabase) return { supabase: null, user: null, profile: null };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, sector_id, display_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  return { supabase, user, profile };
}
