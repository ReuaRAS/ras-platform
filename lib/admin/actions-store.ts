"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";
import { requirePermission, requireStaff } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";

/* المراحل 11 – 13: المتجر، الإشعارات */

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
/* المرحلة 11 — متجر النقاط                                           */
/* ------------------------------------------------------------------ */

export async function saveStoreItem(fd: FormData): Promise<void> {
  const path = "/admin/store";
  const ctx = await requirePermission("store.write");
  const sectorId = sectorOrFail(ctx, path);
  const admin = adminClient(path);

  const id = nullable(str(fd, "id"));
  const name = str(fd, "name");
  if (!name) back(path, { error: "اسم العنصر مطلوب." });

  const stockRaw = str(fd, "stock");
  const payload = {
    sector_id: sectorId,
    name,
    description: nullable(str(fd, "description")),
    price: Number(str(fd, "price") || 0),
    stock: stockRaw === "" ? null : Number(stockRaw),
    is_active: str(fd, "is_active") === "on",
  };

  if (payload.price < 0) back(path, { error: "السعر لا يكون سالبًا." });
  if (payload.stock !== null && payload.stock < 0) back(path, { error: "المخزون لا يكون سالبًا." });

  const { error } = id
    ? await admin.from("store_items").update(payload).eq("id", id).eq("sector_id", sectorId)
    : await admin.from("store_items").insert(payload);

  if (error) back(path, { error: error.message });

  await audit(ctx, id ? "store.item_update" : "store.item_create", "store_item", id ?? name, {
    price: payload.price,
  });
  revalidatePath(path);
  back(path, { msg: id ? "تم تحديث العنصر." : "تمت إضافة العنصر." });
}

export async function deleteStoreItem(fd: FormData): Promise<void> {
  const path = "/admin/store";
  const ctx = await requirePermission("store.write");
  const sectorId = sectorOrFail(ctx, path);
  const id = str(fd, "id");
  const admin = adminClient(path);

  const { error } = await admin.from("store_items").delete().eq("id", id).eq("sector_id", sectorId);
  if (error) back(path, { error: error.message });

  await audit(ctx, "store.item_delete", "store_item", id);
  revalidatePath(path);
  back(path, { msg: "تم حذف العنصر." });
}

export async function purchaseForMember(fd: FormData): Promise<void> {
  const path = "/admin/store";
  const ctx = await requirePermission("store.write");
  sectorOrFail(ctx, path);
  const admin = adminClient(path);

  const itemId = str(fd, "item_id");
  const discordId = str(fd, "discord_id");
  if (!itemId || !discordId) back(path, { error: "العنصر ومعرّف العضو مطلوبان." });

  const { error } = await admin.rpc("purchase_item", {
    p_item_id: itemId,
    p_discord_id: discordId,
  });

  if (error) back(path, { error: error.message });

  await audit(ctx, "store.purchase", "store_order", `${discordId}:${itemId}`);
  revalidatePath(path);
  back(path, { msg: "تم خصم النقاط وإنشاء الطلب." });
}

export async function fulfillOrder(fd: FormData): Promise<void> {
  const path = "/admin/store";
  const ctx = await requirePermission("store.write");
  const sectorId = sectorOrFail(ctx, path);
  const id = str(fd, "id");
  const admin = adminClient(path);

  const { error } = await admin
    .from("store_orders")
    .update({
      status: "fulfilled",
      fulfilled_by: ctx.userId,
      fulfilled_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("sector_id", sectorId)
    .eq("status", "pending");

  if (error) back(path, { error: error.message });

  await audit(ctx, "store.fulfill", "store_order", id);
  revalidatePath(path);
  back(path, { msg: "تم تسليم الطلب." });
}

export async function cancelOrder(fd: FormData): Promise<void> {
  const path = "/admin/store";
  const ctx = await requirePermission("store.write");
  sectorOrFail(ctx, path);
  const id = str(fd, "id");
  const admin = adminClient(path);

  const { error } = await admin.rpc("cancel_store_order", { p_order_id: id });
  if (error) back(path, { error: error.message });

  await audit(ctx, "store.cancel", "store_order", id);
  revalidatePath(path);
  back(path, { msg: "تم إلغاء الطلب وإرجاع النقاط والمخزون." });
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
