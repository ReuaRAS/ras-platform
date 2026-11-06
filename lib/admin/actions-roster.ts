"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RosterField } from "@/lib/types";

/* كوادر القطاعات — واجهة الإدارة لجدول موحّد لكل قطاع */

type Ctx = Awaited<ReturnType<typeof requirePermission>>;

const PATH = "/admin/roster";

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const nullable = (v: string) => (v.length ? v : null);

/** يعود إلى نفس عرض الصفحة (القطاع + البحث + الصفحة) مع رسالة */
function back(fd: FormData, params: Record<string, string>): never {
  const raw = String(fd.get("back") ?? "");
  const base = raw.startsWith(PATH) ? raw : PATH;
  const url = new URL(base, "http://local");
  url.searchParams.delete("edit");
  url.searchParams.delete("msg");
  url.searchParams.delete("error");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  redirect(`${url.pathname}?${url.searchParams.toString()}`);
}

async function audit(
  ctx: Ctx,
  action: string,
  entityId: string | null,
  metadata: Record<string, unknown>,
) {
  try {
    await logAudit(createAdminClient(), {
      actorId: ctx.userId,
      sectorId: ctx.sectorId,
      action,
      entityType: "sector_roster_rows",
      entityId,
      metadata,
    });
  } catch {
    // تجاهل فشل السجل
  }
}

/** القطاع المستهدف: مدير النظام يختار، وغيره قطاعه فقط */
function targetSector(ctx: Ctx, fd: FormData): string {
  if (ctx.isSuperAdmin) {
    const chosen = str(fd, "sector_id");
    if (!chosen) back(fd, { error: "اختر القطاع أولًا." });
    return chosen;
  }
  if (!ctx.sectorId) back(fd, { error: "لا يوجد قطاع مرتبط بهذا الحساب." });
  return ctx.sectorId;
}

export async function saveRosterRow(fd: FormData): Promise<void> {
  const ctx = await requirePermission("roster.write");
  const admin = createAdminClient();
  const sectorId = targetSector(ctx, fd);

  const id = str(fd, "id");
  const fullName = str(fd, "full_name");
  if (!fullName) back(fd, { error: "اسم العنصر مطلوب." });

  const { data: fieldsData } = await admin
    .from("sector_roster_fields")
    .select("*")
    .eq("sector_id", sectorId);
  const fields = (fieldsData ?? []) as RosterField[];

  const extras: Record<string, string | boolean> = {};
  for (const field of fields) {
    if (field.kind === "bool") {
      extras[field.id] = fd.get(`f_${field.id}`) === "on";
    } else {
      const value = str(fd, `f_${field.id}`);
      if (value) extras[field.id] = value;
    }
  }

  const payload = {
    sector_id: sectorId,
    code: nullable(str(fd, "code")),
    employee_no: nullable(str(fd, "employee_no")),
    full_name: fullName,
    level: nullable(str(fd, "level")),
    rank_title: nullable(str(fd, "rank_title")),
    job_arc: nullable(str(fd, "job_arc")),
    notes: nullable(str(fd, "notes")),
    status: nullable(str(fd, "status")),
    extras,
  };

  if (id) {
    const { error } = await admin
      .from("sector_roster_rows")
      .update(payload)
      .eq("id", id)
      .eq("sector_id", sectorId);
    if (error) back(fd, { error: `تعذّر التحديث: ${error.message}` });
    await audit(ctx, "roster.row.update", id, { full_name: fullName });
    revalidatePath(PATH);
    back(fd, { msg: "تم تحديث الصف." });
  }

  const { data: last } = await admin
    .from("sector_roster_rows")
    .select("position")
    .eq("sector_id", sectorId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await admin
    .from("sector_roster_rows")
    .insert({ ...payload, position: (last?.position ?? 0) + 1 })
    .select("id")
    .single();
  if (error) back(fd, { error: `تعذّرت الإضافة: ${error.message}` });
  await audit(ctx, "roster.row.create", data?.id ?? null, { full_name: fullName });
  revalidatePath(PATH);
  back(fd, { msg: "تمت إضافة العنصر." });
}

export async function deleteRosterRow(fd: FormData): Promise<void> {
  const ctx = await requirePermission("roster.write");
  const admin = createAdminClient();
  const sectorId = targetSector(ctx, fd);
  const id = str(fd, "id");
  if (!id) back(fd, { error: "الصف غير موجود." });

  const { error } = await admin
    .from("sector_roster_rows")
    .delete()
    .eq("id", id)
    .eq("sector_id", sectorId);
  if (error) back(fd, { error: `تعذّر الحذف: ${error.message}` });
  await audit(ctx, "roster.row.delete", id, {});
  revalidatePath(PATH);
  back(fd, { msg: "تم حذف الصف." });
}

export async function saveRosterField(fd: FormData): Promise<void> {
  const ctx = await requirePermission("roster.write");
  const admin = createAdminClient();
  const sectorId = targetSector(ctx, fd);

  const label = str(fd, "label");
  const kind = str(fd, "kind") === "text" ? "text" : "bool";
  if (!label) back(fd, { error: "اسم الحقل مطلوب." });

  const { data: last } = await admin
    .from("sector_roster_fields")
    .select("position")
    .eq("sector_id", sectorId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await admin
    .from("sector_roster_fields")
    .insert({ sector_id: sectorId, label, kind, position: (last?.position ?? 0) + 1 })
    .select("id")
    .single();
  if (error) {
    back(
      fd,
      { error: error.code === "23505" ? "هذا الحقل موجود في القطاع بالفعل." : `تعذّرت الإضافة: ${error.message}` },
    );
  }
  await audit(ctx, "roster.field.create", data?.id ?? null, { label, kind });
  revalidatePath(PATH);
  back(fd, { msg: "تمت إضافة الحقل." });
}

export async function deleteRosterField(fd: FormData): Promise<void> {
  const ctx = await requirePermission("roster.write");
  const admin = createAdminClient();
  const sectorId = targetSector(ctx, fd);
  const id = str(fd, "id");
  if (!id) back(fd, { error: "الحقل غير موجود." });

  const { error } = await admin
    .from("sector_roster_fields")
    .delete()
    .eq("id", id)
    .eq("sector_id", sectorId);
  if (error) back(fd, { error: `تعذّر الحذف: ${error.message}` });
  await audit(ctx, "roster.field.delete", id, {});
  revalidatePath(PATH);
  back(fd, { msg: "تم حذف الحقل." });
}
