"use server";

import { revalidatePath } from "next/cache";
import { revalidatePublic } from "@/lib/revalidate";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";
import { requirePermission, requireStaff } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";

/* المرحلة 13 — الإشعارات */

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
/* المرحلة 13 — الإشعارات                                             */
/* ------------------------------------------------------------------ */

export async function sendNotification(fd: FormData): Promise<void> {
  const path = "/admin/notifications";
  const ctx = await requirePermission("notifications.write");
  const admin = adminClient(path);

  const title = str(fd, "title");
  if (title.length < 3) back(path, { error: "عنوان الإشعار مطلوب (3 أحرف على الأقل)." });

  const target = str(fd, "sector_id");
  const sectorId = target === "__all__" ? null : target || ctx.sectorId;
  if (target !== "__all__" && !sectorId) back(path, { error: "اختر القطاع المستهدف." });

  const { data, error } = await admin.rpc("notify_sector", {
    p_sector: sectorId,
    p_title: title,
    p_body: nullable(str(fd, "body")),
    p_href: nullable(str(fd, "href")),
  });

  if (error) back(path, { error: error.message });

  await audit(ctx, "notification.send", "notification", sectorId ?? "all", {
    title,
    recipients: data,
  });
  revalidatePath(path);
  revalidatePublic();
  back(path, { msg: `تم إرسال الإشعار إلى ${data ?? 0} مستخدمًا.` });
}

export async function markNotificationRead(fd: FormData): Promise<void> {
  const path = str(fd, "redirect_to") || "/admin/notifications";
  const ctx = await requireStaff();
  const id = str(fd, "id");
  const admin = adminClient(path);

  const { error } = await admin
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", ctx.userId);

  if (error) back(path, { error: error.message });

  revalidatePath("/admin");
  revalidatePath("/admin/notifications");
  back(path, { msg: "تم تحديد الإشعار كمقروء." });
}

export async function markAllNotificationsRead(fd: FormData): Promise<void> {
  const path = str(fd, "redirect_to") || "/admin/notifications";
  const ctx = await requireStaff();
  const admin = adminClient(path);

  const { error } = await admin
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", ctx.userId)
    .eq("is_read", false);

  if (error) back(path, { error: error.message });

  revalidatePath("/admin");
  revalidatePath("/admin/notifications");
  back(path, { msg: "تم تحديد كل الإشعارات كمقروءة." });
}
