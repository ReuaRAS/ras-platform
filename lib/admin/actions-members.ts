"use server";

import { revalidatePath } from "next/cache";
import { revalidatePublic } from "@/lib/revalidate";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";

/* المراحل 8 – 10: النقاط، الحضور، الترقيات */

type Ctx = Awaited<ReturnType<typeof requirePermission>>;

function back(path: string, params: Record<string, string>): never {
  const qs = new URLSearchParams(params).toString();
  redirect(`${path}${qs ? `?${qs}` : ""}`);
}

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const nullable = (v: string) => (v.length ? v : null);

function adminClient(path: string) {
  try {
    return createAdminClient();
  } catch {
    back(path, { error: "قاعدة البيانات غير مهيّأة (مفاتيح Supabase)." });
  }
}

function sectorOrFail(ctx: Ctx, path: string): string {
  if (!ctx.sectorId) back(path, { error: "لا يوجد قطاع مرتبط بهذا الحساب." });
  return ctx.sectorId;
}

async function audit(
  ctx: Ctx,
  action: string,
  entityType: string,
  entityId: string | null,
  metadata: Record<string, unknown> = {},
) {
  try {
    await logAudit(createAdminClient(), {
      actorId: ctx.userId,
      sectorId: ctx.sectorId,
      action,
      entityType,
      entityId,
      metadata,
    });
  } catch {
    // تجاهل
  }
}

/* ------------------------------------------------------------------ */
/* المرحلة 8 — XP                                                     */
/* ------------------------------------------------------------------ */

export async function adjustXp(fd: FormData): Promise<void> {
  const path = "/admin/members";
  const ctx = await requirePermission("members.write");
  const sectorId = sectorOrFail(ctx, path);

  const discordId = str(fd, "discord_id");
  const amount = Number(str(fd, "amount"));
  const reason = str(fd, "reason");

  if (!discordId) back(path, { error: "معرّف Discord مطلوب." });
  if (!Number.isFinite(amount) || amount === 0) back(path, { error: "قيمة النقاط يجب ألا تكون صفرًا." });
  if (reason.length < 3) back(path, { error: "سبب التعديل مطلوب (3 أحرف على الأقل)." });

  const admin = adminClient(path);
  const { error } = await admin.rpc("add_xp", {
    p_discord_id: discordId,
    p_sector: sectorId,
    p_amount: amount,
    p_reason: reason,
  });

  if (error) back(path, { error: error.message });

  await audit(ctx, "xp.adjust", "member_xp", discordId, { amount, reason });
  revalidatePath(path);
  revalidatePublic();
  back(path, { msg: amount > 0 ? `تمت إضافة ${amount} نقطة.` : `تم خصم ${Math.abs(amount)} نقطة.` });
}

/* ------------------------------------------------------------------ */
/* المرحلة 9 — الحضور                                                 */
/* ------------------------------------------------------------------ */

export async function markAttendance(fd: FormData): Promise<void> {
  const path = "/admin/attendance";
  const ctx = await requirePermission("attendance.write");
  const sectorId = ctx.sectorId ?? str(fd, "sector_id");
  if (!sectorId) back(path, { error: "حدد القطاع أولًا." });

  const discordId = str(fd, "discord_id");
  const date = str(fd, "date");
  const status = str(fd, "status");
  const note = nullable(str(fd, "note"));

  if (!discordId) back(path, { error: "معرّف Discord مطلوب." });
  if (!date) back(path, { error: "التاريخ مطلوب." });

  const admin = adminClient(path);
  const { error } = await admin.rpc("mark_attendance", {
    p_sector: sectorId,
    p_discord_id: discordId,
    p_date: date,
    p_status: status,
    p_note: note,
  });

  if (error) back(path, { error: error.message });

  await audit(ctx, "attendance.mark", "attendance_record", `${discordId}:${date}`, { status });
  revalidatePath(path);
  revalidatePublic();
  back(path, { msg: "تم تسجيل الحضور.", month: date.slice(0, 7) });
}

export async function clearAttendance(fd: FormData): Promise<void> {
  const path = "/admin/attendance";
  const ctx = await requirePermission("attendance.write");
  const sectorId = ctx.sectorId ?? str(fd, "sector_id");
  if (!sectorId) back(path, { error: "حدد القطاع أولًا." });
  const id = str(fd, "id");
  const admin = adminClient(path);

  const { error } = await admin
    .from("attendance_records")
    .delete()
    .eq("id", id)
    .eq("sector_id", sectorId);

  if (error) back(path, { error: error.message });

  await audit(ctx, "attendance.clear", "attendance_record", id);
  revalidatePath(path);
  revalidatePublic();
  back(path, { msg: "تم حذف سجل الحضور." });
}
