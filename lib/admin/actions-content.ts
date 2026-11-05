"use server";

import { revalidatePath } from "next/cache";
import { revalidatePublic } from "@/lib/revalidate";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";

/* المرحلة 8 — مركز المساعدة (الأسئلة الشائعة) */

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

async function audit(
  ctx: Ctx,
  action: string,
  entityId: string | null,
  metadata: Record<string, unknown> = {},
) {
  try {
    await logAudit(createAdminClient(), {
      actorId: ctx.userId,
      sectorId: ctx.sectorId,
      action,
      entityType: "faq",
      entityId,
      metadata,
    });
  } catch {
    // تجاهل
  }
}

export async function saveFaq(fd: FormData): Promise<void> {
  const path = "/admin/faq";
  const ctx = await requirePermission("faq.write");

  const id = nullable(str(fd, "id"));
  const question = str(fd, "question");
  const answer = str(fd, "answer");

  if (question.length < 4) back(path, { error: "السؤال قصير جدًا." });
  if (answer.length < 2) back(path, { error: "الإجابة مطلوبة." });

  const sectorId = ctx.isSuperAdmin ? nullable(str(fd, "sector_id")) ?? ctx.sectorId : ctx.sectorId;
  if (!ctx.isSuperAdmin && !sectorId) back(path, { error: "لا يوجد قطاع مرتبط بهذا الحساب." });

  const payload = {
    sector_id: sectorId,
    question,
    answer,
    sort_order: Number(str(fd, "sort_order") || 0),
    is_published: fd.get("is_published") !== null,
  };

  const admin = adminClient(path);

  if (id) {
    let q = admin.from("faq").update(payload).eq("id", id);
    if (!ctx.isSuperAdmin) q = q.eq("sector_id", ctx.sectorId!);
    const { error } = await q;
    if (error) back(path, { error: error.message });
    await audit(ctx, "faq.update", id, { question });
  } else {
    const { data, error } = await admin.from("faq").insert(payload).select("id").single();
    if (error) back(path, { error: error.message });
    await audit(ctx, "faq.create", (data as { id: string } | null)?.id ?? null, { question });
  }

  revalidatePath("/admin/faq");
  revalidatePath("/sectors", "layout");
  revalidatePublic();
  back(path, { msg: id ? "تم تحديث السؤال." : "تمت إضافة السؤال." });
}

export async function deleteFaq(fd: FormData): Promise<void> {
  const path = "/admin/faq";
  const ctx = await requirePermission("faq.write");
  const id = str(fd, "id");
  if (!id) back(path, { error: "معرّف غير صالح." });

  const admin = adminClient(path);
  let q = admin.from("faq").delete().eq("id", id);
  if (!ctx.isSuperAdmin) q = q.eq("sector_id", ctx.sectorId!);
  const { error } = await q;
  if (error) back(path, { error: error.message });

  await audit(ctx, "faq.delete", id);
  revalidatePath("/admin/faq");
  revalidatePath("/sectors", "layout");
  revalidatePublic();
  back(path, { msg: "تم حذف السؤال." });
}
