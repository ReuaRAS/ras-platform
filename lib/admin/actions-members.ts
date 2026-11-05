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

/* ------------------------------------------------------------------ */
/* المرحلة 10 — الرتب والترقيات                                       */
/* ------------------------------------------------------------------ */

export async function saveRank(fd: FormData): Promise<void> {
  const path = "/admin/promotions";
  const ctx = await requirePermission("promotions.write");
  const sectorId = sectorOrFail(ctx, path);
  const admin = adminClient(path);

  const id = nullable(str(fd, "id"));
  const code = str(fd, "code");
  const title = str(fd, "title");
  if (!code || !title) back(path, { error: "كود الرتبة وعنوانها مطلوبان." });

  const payload = {
    sector_id: sectorId,
    code,
    title,
    sort_order: Number(str(fd, "sort_order") || 0),
    min_xp: Number(str(fd, "min_xp") || 0),
  };

  const { error } = id
    ? await admin.from("ranks").update(payload).eq("id", id).eq("sector_id", sectorId)
    : await admin.from("ranks").insert(payload);

  if (error) back(path, { error: error.message });

  await audit(ctx, id ? "rank.update" : "rank.create", "rank", id ?? code);
  revalidatePath(path);
  revalidatePublic();
  back(path, { msg: id ? "تم تحديث الرتبة." : "تمت إضافة الرتبة." });
}

export async function deleteRank(fd: FormData): Promise<void> {
  const path = "/admin/promotions";
  const ctx = await requirePermission("promotions.write");
  const sectorId = sectorOrFail(ctx, path);
  const id = str(fd, "id");
  const admin = adminClient(path);

  const { error } = await admin.from("ranks").delete().eq("id", id).eq("sector_id", sectorId);
  if (error) back(path, { error: error.message });

  await audit(ctx, "rank.delete", "rank", id);
  revalidatePath(path);
  revalidatePublic();
  back(path, { msg: "تم حذف الرتبة." });
}

export async function requestPromotion(fd: FormData): Promise<void> {
  const path = "/admin/promotions";
  const ctx = await requirePermission("promotions.write");
  const sectorId = sectorOrFail(ctx, path);
  const admin = adminClient(path);

  const discordId = str(fd, "discord_id");
  const toRank = str(fd, "to_rank");
  if (!discordId || !toRank) back(path, { error: "معرّف العضو والرتبة المستهدفة مطلوبان." });

  const { error } = await admin.from("promotions").insert({
    sector_id: sectorId,
    discord_id: discordId,
    from_rank: nullable(str(fd, "from_rank")),
    to_rank: toRank,
    note: nullable(str(fd, "note")),
    status: "pending",
    requested_by: ctx.userId,
  });

  if (error) back(path, { error: error.message });

  await audit(ctx, "promotion.request", "promotion", `${discordId}:${toRank}`);
  revalidatePath(path);
  revalidatePublic();
  back(path, { msg: "تم تسجيل طلب الترقية (قيد المراجعة)." });
}

export async function decidePromotion(fd: FormData): Promise<void> {
  const path = "/admin/promotions";
  const ctx = await requirePermission("promotions.write");
  const sectorId = sectorOrFail(ctx, path);
  const id = str(fd, "id");
  const decision = str(fd, "decision") === "approve" ? "approved" : "rejected";
  const note = nullable(str(fd, "note"));
  const admin = adminClient(path);

  const { data: promotion } = await admin
    .from("promotions")
    .select("id, sector_id, discord_id, to_rank, status")
    .eq("id", id)
    .eq("sector_id", sectorId)
    .maybeSingle();

  if (!promotion) back(path, { error: "طلب الترقية غير موجود." });
  if (promotion.status !== "pending") back(path, { error: "تمت مراجعة هذا الطلب مسبقًا." });

  const { error } = await admin
    .from("promotions")
    .update({
      status: decision,
      note,
      decided_by: ctx.userId,
      decided_at: new Date().toISOString(),
      approved_by: decision === "approved" ? ctx.userId : null,
      approved_at: decision === "approved" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("sector_id", sectorId);

  if (error) back(path, { error: error.message });

  if (decision === "approved") {
    const { data: rank } = await admin
      .from("ranks")
      .select("id")
      .eq("sector_id", sectorId)
      .eq("code", promotion.to_rank)
      .maybeSingle();

    if (rank) {
      await admin.from("member_ranks").upsert(
        {
          discord_id: promotion.discord_id,
          rank_id: rank.id,
          assigned_by: ctx.userId,
          assigned_at: new Date().toISOString(),
        },
        { onConflict: "discord_id,rank_id" },
      );
    }

    await admin.rpc("notify_sector", {
      p_sector: sectorId,
      p_title: `ترقية معتمدة: ${promotion.to_rank}`,
      p_body: `تمت ترقية العضو ${promotion.discord_id} إلى ${promotion.to_rank}.`,
      p_href: "/admin/promotions",
    });
  }

  await audit(ctx, `promotion.${decision}`, "promotion", id, { to_rank: promotion.to_rank });
  revalidatePath(path);
  revalidatePublic();
  back(path, { msg: decision === "approved" ? "تم اعتماد الترقية." : "تم رفض طلب الترقية." });
}
