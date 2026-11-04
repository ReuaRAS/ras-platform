"use server";

import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";
import { emailForSector } from "@/lib/auth/sector-map";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { getClientIp, verifyTurnstile } from "@/lib/turnstile";
import { firstError, loginSchema } from "@/lib/validation";

export type LoginState = { error?: string; retryAfter?: number };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    sector: formData.get("sector"),
    password: formData.get("password"),
    turnstileToken: formData.get("cf-turnstile-response") ?? "",
  });

  if (!parsed.success) return { error: firstError(parsed.error) };
  const { sector, password, turnstileToken } = parsed.data;

  const email = emailForSector(sector);
  if (!email) return { error: "قطاع غير معروف." };

  const ip = getClientIp(new Request("http://localhost"));
  const turnstile = await verifyTurnstile(turnstileToken, ip);
  if (!turnstile.ok) return { error: turnstile.error };

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return { error: "قاعدة البيانات غير مهيّأة. اضبط مفاتيح Supabase أولًا." };
  }

  // 1) حد المحاولات (5 محاولات / 15 دقيقة)
  const { data: gate } = await admin.rpc("check_login_allowed", { p_email: email });
  if (gate && typeof gate === "object" && "allowed" in gate && gate.allowed === false) {
    const retry = Number((gate as { retry_after_seconds?: number }).retry_after_seconds ?? 900);
    return {
      error: `تم قفل الحساب مؤقتًا بسبب محاولات فاشلة متكررة. أعد المحاولة بعد ${Math.ceil(
        retry / 60,
      )} دقيقة.`,
      retryAfter: retry,
    };
  }

  // 2) تسجيل الدخول
  const supabase = await createServerSupabase();
  if (!supabase) return { error: "قاعدة البيانات غير مهيّأة." };

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    await admin.rpc("record_failed_login", { p_email: email });
    await logAudit(admin, {
      action: "admin.login_failed",
      entityType: "auth",
      metadata: { email, sector },
      ipAddress: ip,
    });
    return { error: "كلمة المرور غير صحيحة." };
  }

  // 3) تحقق أن الحساب يخص القطاع المطلوب
  const metaSector = (authData.user.app_metadata?.sector_slug ?? null) as string | null;
  if (metaSector && metaSector !== sector) {
    await supabase.auth.signOut();
    await logAudit(admin, {
      actorId: authData.user.id,
      action: "admin.login_wrong_sector",
      entityType: "auth",
      metadata: { expected: sector, actual: metaSector },
      ipAddress: ip,
    });
    return { error: "هذا الحساب لا يخص القطاع المختار." };
  }

  // 4) تصفير المحاولات + التأكد من وجود الملف الشخصي
  await admin.rpc("reset_login_attempts", { p_email: email });

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id, role, sector_id")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (!existingProfile) {
    const { data: sectorRow } = await admin
      .from("sectors")
      .select("id")
      .eq("slug", sector)
      .maybeSingle();

    await admin.from("profiles").insert({
      id: authData.user.id,
      sector_id: sectorRow?.id ?? null,
      display_name: authData.user.app_metadata?.display_name ?? null,
      role: (authData.user.app_metadata?.role as string) ?? "sector_admin",
      is_active: true,
    });
  }

  await logAudit(admin, {
    actorId: authData.user.id,
    action: "admin.login",
    entityType: "auth",
    metadata: { sector, email },
    ipAddress: ip,
  });

  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createServerSupabase();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.auth.signOut();
    try {
      const admin = createAdminClient();
      await logAudit(admin, {
        actorId: user?.id ?? null,
        action: "admin.logout",
        entityType: "auth",
        metadata: {},
      });
    } catch {
      // تجاهل
    }
  }
  redirect("/admin/login");
}
