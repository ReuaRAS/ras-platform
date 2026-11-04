import "server-only";

import { redirect } from "next/navigation";
import { hasPermission, type Permission } from "@/lib/permissions";
import { getSession } from "@/lib/supabase/server";
import type { Sector } from "@/lib/types";

export type StaffContext = {
  userId: string;
  email: string | null;
  role: string;
  displayName: string | null;
  sectorId: string | null;
  sector: Sector | null;
  isSuperAdmin: boolean;
};

/** يجبر وجود جلسة إدارية فعّالة، وإلا يحوّل إلى صفحة الدخول. */
export async function requireStaff(): Promise<StaffContext> {
  const { supabase, user, profile } = await getSession();

  if (!supabase || !user) redirect("/admin/login");
  if (!profile || profile.is_active === false) {
    redirect("/admin/login?error=inactive");
  }

  let sector: Sector | null = null;
  if (profile.sector_id) {
    const { data } = await supabase
      .from("sectors")
      .select("*")
      .eq("id", profile.sector_id)
      .maybeSingle();
    sector = (data as Sector | null) ?? null;
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    role: profile.role,
    displayName: profile.display_name,
    sectorId: profile.sector_id,
    sector,
    isSuperAdmin: profile.role === "super_admin",
  };
}

/** نفس السابق + تحقق من صلاحية محددة. */
export async function requirePermission(perm: Permission): Promise<StaffContext> {
  const ctx = await requireStaff();
  if (!hasPermission(ctx.role, perm) && !ctx.isSuperAdmin) {
    redirect("/admin?error=permission");
  }
  return ctx;
}

/** فلترة الاستعلام حسب قطاع المستخدم (null = كل القطاعات للمدير العام) */
export function scopeSectorId(ctx: StaffContext): string | null {
  return ctx.isSuperAdmin ? null : ctx.sectorId;
}
