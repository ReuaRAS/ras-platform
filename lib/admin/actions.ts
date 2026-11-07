"use server";

import { revalidatePath } from "next/cache";
import { revalidatePublic } from "@/lib/revalidate";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guard";
import type { Permission } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { firstError, courseSchema, lawSchema, rewardSchema } from "@/lib/validation";

/* ------------------------------------------------------------------ */
/* أدوات مساعدة                                                        */
/* ------------------------------------------------------------------ */

type Ctx = Awaited<ReturnType<typeof requirePermission>>;

function back(path: string, params: Record<string, string>): never {
  const qs = new URLSearchParams(params).toString();
  redirect(`${path}${qs ? `?${qs}` : ""}`);
}

async function audit(
  ctx: Ctx,
  action: string,
  entityType: string,
  entityId: string | null,
  metadata: Record<string, unknown> = {},
) {
  try {
    const admin = createAdminClient();
    await logAudit(admin, {
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

function sectorOrFail(ctx: Ctx, path: string): string {
  if (!ctx.sectorId) back(path, { error: "لا يوجد قطاع مرتبط بهذا الحساب." });
  return ctx.sectorId;
}

function adminClient(path: string) {
  try {
    return createAdminClient();
  } catch {
    back(path, { error: "قاعدة البيانات غير مهيّأة (مفاتيح Supabase)." });
  }
}

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const nullable = (v: string) => (v.length ? v : null);

/* ------------------------------------------------------------------ */
/* القوانين                                                            */
/* ------------------------------------------------------------------ */

export async function saveLaw(fd: FormData): Promise<void> {
  const path = "/admin/laws";
  const ctx = await requirePermission("laws.write");
  const sectorId = sectorOrFail(ctx, path);

  const parsed = lawSchema.safeParse({
    id: nullable(str(fd, "id")) ?? undefined,
    law_code: str(fd, "law_code"),
    title: str(fd, "title"),
    penalty: str(fd, "penalty"),
    additional_penalty: nullable(str(fd, "additional_penalty")),
    category: str(fd, "category") === "common" ? "common" : "main",
    notes: nullable(str(fd, "notes")),
    sort_order: str(fd, "sort_order") || 0,
  });

  if (!parsed.success) back(path, { error: firstError(parsed.error) });
  const { id, ...payload } = parsed.data;
  const admin = adminClient(path);

  const { error } = id
    ? await admin.from("sector_laws").update(payload).eq("id", id).eq("sector_id", sectorId)
    : await admin.from("sector_laws").insert({ ...payload, sector_id: sectorId });

  if (error) back(path, { error: error.message });

  await audit(ctx, id ? "law.update" : "law.create", "sector_law", id ?? payload.law_code, {
    law_code: payload.law_code,
  });
  revalidatePath(path);
  revalidatePublic();
  back(path, { msg: id ? "تم تحديث القانون." : "تم إضافة القانون." });
}

export async function deleteLaw(fd: FormData): Promise<void> {
  const path = "/admin/laws";
  const ctx = await requirePermission("laws.delete");
  const sectorId = sectorOrFail(ctx, path);
  const id = str(fd, "id");
  const admin = adminClient(path);

  const { error } = await admin
    .from("sector_laws")
    .delete()
    .eq("id", id)
    .eq("sector_id", sectorId);
  if (error) back(path, { error: error.message });

  await audit(ctx, "law.delete", "sector_law", id);
  revalidatePath(path);
  revalidatePublic();
  back(path, { msg: "تم حذف القانون." });
}

/** نسخ القوانين والمكافآت من قطاع مرجعي (seed_sector_defaults) */
export async function seedSectorDefaults(fd: FormData): Promise<void> {
  const path = String(fd.get("redirect_to") ?? "/admin/laws");
  const ctx = await requirePermission("sector.seed");
  const sectorId = sectorOrFail(ctx, path);
  const source = str(fd, "source_slug") || "red-crescent";
  const admin = adminClient(path);

  const { error } = await admin.rpc("seed_sector_defaults", {
    p_sector_id: sectorId,
    p_source_sector_slug: source,
  });

  if (error) back(path, { error: `تعذّر النسخ: ${error.message}` });

  await audit(ctx, "sector.seed", "sector", sectorId, { source });
  revalidatePath(path);
  revalidatePublic();
  back(path, { msg: "تم نسخ القوانين والمكافآت من القطاع المرجعي." });
}

/* ------------------------------------------------------------------ */
/* المكافآت                                                            */
/* ------------------------------------------------------------------ */

export async function saveReward(fd: FormData): Promise<void> {
  const path = "/admin/rewards";
  const ctx = await requirePermission("rewards.write");
  const sectorId = sectorOrFail(ctx, path);

  const parsed = rewardSchema.safeParse({
    id: nullable(str(fd, "id")) ?? undefined,
    reward_code: str(fd, "reward_code"),
    title: str(fd, "title"),
    reward_value: str(fd, "reward_value"),
    conditions: nullable(str(fd, "conditions")),
    sort_order: str(fd, "sort_order") || 0,
  });
  if (!parsed.success) back(path, { error: firstError(parsed.error) });

  const { id, ...payload } = parsed.data;
  const admin = adminClient(path);

  const { error } = id
    ? await admin.from("sector_rewards").update(payload).eq("id", id).eq("sector_id", sectorId)
    : await admin.from("sector_rewards").insert({ ...payload, sector_id: sectorId });

  if (error) back(path, { error: error.message });

  await audit(ctx, id ? "reward.update" : "reward.create", "sector_reward", id ?? payload.reward_code);
  revalidatePath(path);
  revalidatePublic();
  back(path, { msg: id ? "تم تحديث المكافأة." : "تم إضافة المكافأة." });
}

export async function deleteReward(fd: FormData): Promise<void> {
  const path = "/admin/rewards";
  const ctx = await requirePermission("rewards.write");
  const sectorId = sectorOrFail(ctx, path);
  const id = str(fd, "id");
  const admin = adminClient(path);

  const { error } = await admin
    .from("sector_rewards")
    .delete()
    .eq("id", id)
    .eq("sector_id", sectorId);
  if (error) back(path, { error: error.message });

  await audit(ctx, "reward.delete", "sector_reward", id);
  revalidatePath(path);
  revalidatePublic();
  back(path, { msg: "تم حذف المكافأة." });
}

/* ------------------------------------------------------------------ */
/* التوظيف                                                            */
/* ------------------------------------------------------------------ */

export async function saveRecruitment(fd: FormData): Promise<void> {
  const path = "/admin/recruitment";
  const ctx = await requirePermission("recruitment.write");
  const sectorId = sectorOrFail(ctx, path);
  const admin = adminClient(path);

  let slides: unknown = [];
  const slidesRaw = str(fd, "guide_slides");
  if (slidesRaw) {
    try {
      slides = JSON.parse(slidesRaw);
    } catch {
      back(path, { error: "صيغة السلايدات غير صحيحة (JSON)." });
    }
  }

  const conditions = str(fd, "conditions")
    .split("\n")
    .map((c) => c.trim())
    .filter(Boolean);

  const payload = {
    sector_id: sectorId,
    description: nullable(str(fd, "description")),
    is_open: str(fd, "is_open") === "on" || str(fd, "is_open") === "true",
    guide_content: { slides, conditions, pdf_url: nullable(str(fd, "pdf_url")) },
    updated_at: new Date().toISOString(),
  };

  const { error } = await admin
    .from("recruitment_info")
    .upsert(payload, { onConflict: "sector_id" });

  if (error) back(path, { error: error.message });

  await audit(ctx, "recruitment.update", "recruitment_info", sectorId);
  revalidatePath(path);
  revalidatePublic();
  back(path, { msg: "تم حفظ بيانات التوظيف." });
}

/* ------------------------------------------------------------------ */
/* الدورات                                                            */
/* ------------------------------------------------------------------ */

export async function saveCourse(fd: FormData): Promise<void> {
  const path = "/admin/courses";
  const ctx = await requirePermission("courses.write");
  const sectorId = sectorOrFail(ctx, path);

  const parsed = courseSchema.safeParse({
    id: nullable(str(fd, "id")) ?? undefined,
    title: str(fd, "title"),
    slug: str(fd, "slug"),
    description: nullable(str(fd, "description")),
    certificate_prefix: str(fd, "certificate_prefix"),
    pass_score: str(fd, "pass_score") || 70,
    time_limit_minutes: str(fd, "time_limit_minutes") || 20,
    questions_per_attempt: str(fd, "questions_per_attempt") || 10,
    duration_days: str(fd, "duration_days") ? str(fd, "duration_days") : null,
    is_active: str(fd, "is_active") === "on",
  });

  if (!parsed.success) back(path, { error: firstError(parsed.error) });
  const { id, slides_json, is_active, ...payload } = parsed.data;
  void slides_json;

  const admin = adminClient(path);
  const row = {
    ...payload,
    sector_id: sectorId,
    is_active,
    duration_days: payload.duration_days ?? null,
  };

  const { error } = id
    ? await admin.from("courses").update(row).eq("id", id).eq("sector_id", sectorId)
    : await admin.from("courses").insert(row);

  if (error) back(path, { error: error.message });

  await audit(ctx, id ? "course.update" : "course.create", "course", id ?? payload.slug);
  revalidatePath(path);
  revalidatePublic();
  back(path, { msg: id ? "تم تحديث الدورة." : "تم إضافة الدورة." });
}

export async function deleteCourse(fd: FormData): Promise<void> {
  const path = "/admin/courses";
  const ctx = await requirePermission("courses.write");
  const sectorId = sectorOrFail(ctx, path);
  const id = str(fd, "id");
  const admin = adminClient(path);

  const { error } = await admin.from("courses").delete().eq("id", id).eq("sector_id", sectorId);
  if (error) back(path, { error: error.message });

  await audit(ctx, "course.delete", "course", id);
  revalidatePath(path);
  revalidatePublic();
  back(path, { msg: "تم حذف الدورة." });
}

export async function saveCourseSlides(fd: FormData): Promise<void> {
  const id = str(fd, "id");
  const path = `/admin/courses/${id}`;
  const ctx = await requirePermission("courses.write");
  const sectorId = sectorOrFail(ctx, path);
  const admin = adminClient(path);

  let slides: unknown = [];
  try {
    slides = JSON.parse(str(fd, "slides") || "[]");
  } catch {
    back(path, { error: "صيغة السلايدات غير صحيحة (JSON)." });
  }

  const { error } = await admin
    .from("courses")
    .update({ slides_content: { slides } })
    .eq("id", id)
    .eq("sector_id", sectorId);

  if (error) back(path, { error: error.message });

  await audit(ctx, "course.slides_update", "course", id);
  revalidatePath(path);
  revalidatePublic();
  back(path, { msg: "تم حفظ السلايدات." });
}

/* ------------------------------------------------------------------ */
/* الاختبارات وبنك الأسئلة                                             */
/* ------------------------------------------------------------------ */

export async function saveTest(fd: FormData): Promise<void> {
  const path = "/admin/tests";
  const ctx = await requirePermission("tests.write");
  const sectorId = sectorOrFail(ctx, path);
  const admin = adminClient(path);

  const id = nullable(str(fd, "id"));
  const row = {
    sector_id: sectorId,
    course_id: nullable(str(fd, "course_id")),
    type: str(fd, "type") === "recruitment" ? "recruitment" : "course",
    title: str(fd, "title"),
    description: nullable(str(fd, "description")),
    pass_score: Number(str(fd, "pass_score") || 70),
    time_limit_minutes: Number(str(fd, "time_limit_minutes") || 20),
    questions_per_attempt: Number(str(fd, "questions_per_attempt") || 10),
    is_active: str(fd, "is_active") === "on",
  };

  if (!row.title) back(path, { error: "عنوان الاختبار مطلوب." });

  const { error } = id
    ? await admin.from("tests").update(row).eq("id", id).eq("sector_id", sectorId)
    : await admin.from("tests").insert(row);

  if (error) back(path, { error: error.message });

  await audit(ctx, id ? "test.update" : "test.create", "test", id ?? row.title);
  revalidatePath(path);
  revalidatePublic();
  back(path, { msg: id ? "تم تحديث الاختبار." : "تم إضافة الاختبار." });
}

export async function deleteTest(fd: FormData): Promise<void> {
  const path = "/admin/tests";
  const ctx = await requirePermission("tests.write");
  const sectorId = sectorOrFail(ctx, path);
  const id = str(fd, "id");
  const admin = adminClient(path);

  const { error } = await admin.from("tests").delete().eq("id", id).eq("sector_id", sectorId);
  if (error) back(path, { error: error.message });

  await audit(ctx, "test.delete", "test", id);
  revalidatePath(path);
  revalidatePublic();
  back(path, { msg: "تم حذف الاختبار." });
}

export async function saveQuestion(fd: FormData): Promise<void> {
  const testId = str(fd, "test_id");
  const path = `/admin/tests/${testId}`;
  const ctx = await requirePermission("questions.write");
  const sectorId = sectorOrFail(ctx, path);
  const admin = adminClient(path);

  const id = nullable(str(fd, "id"));
  const questionText = str(fd, "question_text");
  const rawPoints = Number(str(fd, "points") || 1);
  const points = Math.min(10, Math.max(1, Number.isFinite(rawPoints) ? rawPoints : 1));
  const correctIndex = Number(str(fd, "correct") || 0);
  const choices = [1, 2, 3, 4]
    .map((i) => ({
      id: nullable(str(fd, `choice_id_${i}`)),
      text: str(fd, `choice_${i}`),
      index: i - 1,
    }))
    .filter((c) => c.text.length > 0);

  if (questionText.length < 3) back(path, { error: "نص السؤال مطلوب." });
  if (choices.length < 2) back(path, { error: "أضف خيارين على الأقل." });
  if (!choices.some((c) => c.index === correctIndex))
    back(path, { error: "حدد الخيار الصحيح." });

  // الاختبار نفسه يجب أن يكون داخل قطاع المشرف
  const { data: scopeTest } = await admin
    .from("tests")
    .select("id")
    .eq("id", testId)
    .eq("sector_id", sectorId)
    .maybeSingle();
  if (!scopeTest) back(path, { error: "الاختبار غير موجود في قطاعك." });

  if (id) {
    const { data: existing } = await admin
      .from("questions")
      .select("id")
      .eq("id", id)
      .eq("test_id", testId)
      .maybeSingle();
    if (!existing) back(path, { error: "السؤال غير موجود داخل هذا الاختبار." });

    const { error: updateError } = await admin
      .from("questions")
      .update({ question_text: questionText, points })
      .eq("id", id)
      .eq("test_id", testId);
    if (updateError) back(path, { error: updateError.message });

    // الخيارات تبقى بمعرّفاتها حتى لا تنكسر إجابات المحاولات السابقة
    const { data: currentChoices } = await admin
      .from("choices")
      .select("id")
      .eq("question_id", id);
    const kept = new Set(choices.map((c) => c.id).filter((cid): cid is string => Boolean(cid)));

    for (const choice of choices) {
      const payload = { choice_text: choice.text, is_correct: choice.index === correctIndex };
      const { error } = choice.id
        ? await admin.from("choices").update(payload).eq("id", choice.id).eq("question_id", id)
        : await admin.from("choices").insert({ question_id: id, ...payload });
      if (error) back(path, { error: error.message });
    }

    const stale = (currentChoices ?? [])
      .map((c) => c.id as string)
      .filter((cid) => !kept.has(cid));
    if (stale.length) {
      const { error } = await admin
        .from("choices")
        .delete()
        .in("id", stale)
        .eq("question_id", id);
      if (error) back(path, { error: error.message });
    }

    await audit(ctx, "question.update", "question", id, { test_id: testId });
    revalidatePath(path);
    revalidatePublic();
    back(path, { msg: "تم تحديث السؤال." });
  }

  const { data: question, error } = await admin
    .from("questions")
    .insert({ test_id: testId, question_text: questionText, points })
    .select("id")
    .single();

  if (error || !question) back(path, { error: error?.message ?? "تعذّر حفظ السؤال." });

  const { error: choicesError } = await admin.from("choices").insert(
    choices.map((c) => ({
      question_id: question.id,
      choice_text: c.text,
      is_correct: c.index === correctIndex,
    })),
  );

  if (choicesError) back(path, { error: choicesError.message });

  await audit(ctx, "question.create", "question", question.id, { test_id: testId });
  revalidatePath(path);
  revalidatePublic();
  back(path, { msg: "تم إضافة السؤال." });
}

export async function deleteQuestion(fd: FormData): Promise<void> {
  const testId = str(fd, "test_id");
  const path = `/admin/tests/${testId}`;
  const ctx = await requirePermission("questions.write");
  sectorOrFail(ctx, path);
  const admin = adminClient(path);
  const id = str(fd, "id");

  const { error } = await admin.from("questions").delete().eq("id", id);
  if (error) back(path, { error: error.message });

  await audit(ctx, "question.delete", "question", id);
  revalidatePath(path);
  revalidatePublic();
  back(path, { msg: "تم حذف السؤال." });
}

/* ------------------------------------------------------------------ */
/* نتائج الاختبارات                                                    */
/* ------------------------------------------------------------------ */

/** قبول/رفض نتيجة مشبوهة — مراجعة يدوية (visibilitychange لا يلغي تلقائيًا) */
export async function reviewAttempt(fd: FormData): Promise<void> {
  const path = "/admin/test-results";
  const ctx = await requirePermission("results.review");
  const sectorId = sectorOrFail(ctx, path);
  const id = str(fd, "id");
  const decision = str(fd, "decision");
  const admin = adminClient(path);

  const { data: attempt } = await admin
    .from("test_attempts")
    .select("id, passed, percentage, suspicion_flags")
    .eq("id", id)
    .eq("sector_id", sectorId)
    .maybeSingle();

  if (!attempt) back(path, { error: "المحاولة غير موجودة." });

  const flags = Array.isArray(attempt.suspicion_flags) ? attempt.suspicion_flags : [];
  const nextFlags = [
    ...flags,
    { type: decision === "accept" ? "reviewed-accepted" : "reviewed-rejected", at: new Date().toISOString() },
  ];

  const passed = decision === "accept" ? true : false;

  const { error } = await admin
    .from("test_attempts")
    .update({ suspicion_flags: nextFlags, passed })
    .eq("id", id)
    .eq("sector_id", sectorId);

  if (error) back(path, { error: error.message });

  await audit(ctx, `attempt.review_${decision}`, "test_attempt", id, { percentage: attempt.percentage });
  revalidatePath(path);
  revalidatePublic();
  back(path, { msg: decision === "accept" ? "تم اعتماد النتيجة." : "تم رفض النتيجة." });
}

/* ------------------------------------------------------------------ */
/* الشهادات                                                           */
/* ------------------------------------------------------------------ */

export async function revokeCertificate(fd: FormData): Promise<void> {
  const path = "/admin/certificates";
  const ctx = await requirePermission("certificates.revoke");
  const sectorId = sectorOrFail(ctx, path);
  const id = str(fd, "id");
  const reason = str(fd, "reason");
  const admin = adminClient(path);

  if (reason.length < 5) back(path, { error: "سبب الإلغاء مطلوب (5 أحرف على الأقل)." });

  const { error } = await admin
    .from("certificates")
    .update({
      status: "revoked",
      revoked_at: new Date().toISOString(),
      revoked_by: ctx.userId,
      revoked_reason: reason,
    })
    .eq("id", id)
    .eq("sector_id", sectorId);

  if (error) back(path, { error: error.message });

  await audit(ctx, "certificate.revoke", "certificate", id, { reason });
  revalidatePath(path);
  revalidatePublic();
  back(path, { msg: "تم إلغاء الشهادة." });
}

export async function reactivateCertificate(fd: FormData): Promise<void> {
  const path = "/admin/certificates";
  const ctx = await requirePermission("certificates.revoke");
  const sectorId = sectorOrFail(ctx, path);
  const id = str(fd, "id");
  const admin = adminClient(path);

  const { error } = await admin
    .from("certificates")
    .update({ status: "valid", revoked_at: null, revoked_by: null, revoked_reason: null })
    .eq("id", id)
    .eq("sector_id", sectorId);

  if (error) back(path, { error: error.message });

  await audit(ctx, "certificate.reactivate", "certificate", id);
  revalidatePath(path);
  revalidatePublic();
  back(path, { msg: "تمت إعادة تفعيل الشهادة." });
}

/* ------------------------------------------------------------------ */
/* الجدول                                                             */
/* ------------------------------------------------------------------ */

export async function saveSchedule(fd: FormData): Promise<void> {
  const path = "/admin/schedule";
  const ctx = await requirePermission("schedule.write");
  const sectorId = sectorOrFail(ctx, path);
  const admin = adminClient(path);

  const id = nullable(str(fd, "id"));
  const title = str(fd, "title") || "جدول القطاع";

  let columns: unknown = [];
  let rows: unknown = [];
  try {
    columns = JSON.parse(str(fd, "columns") || "[]");
    rows = JSON.parse(str(fd, "rows") || "[]");
  } catch {
    back(path, { error: "صيغة الأعمدة أو الصفوف غير صحيحة (JSON)." });
  }

  let imageUrl: string | null = nullable(str(fd, "image_url"));
  const file = fd.get("image");
  if (file instanceof File && file.size > 0) {
    if (file.size > 4 * 1024 * 1024) back(path, { error: "حجم الصورة يجب أن يكون أقل من 4MB." });
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const uploadPath = `${sectorId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await admin.storage
      .from("schedule-images")
      .upload(uploadPath, Buffer.from(await file.arrayBuffer()), {
        contentType: file.type || "image/png",
        upsert: true,
      });
    if (uploadError) back(path, { error: `تعذّر رفع الصورة: ${uploadError.message}` });
    const { data: pub } = admin.storage.from("schedule-images").getPublicUrl(uploadPath);
    imageUrl = pub.publicUrl;
  }

  const payload = {
    sector_id: sectorId,
    title,
    columns,
    rows,
    image_url: imageUrl,
    notes: nullable(str(fd, "notes")),
    is_published: str(fd, "is_published") === "on",
    updated_by: ctx.userId,
    updated_at: new Date().toISOString(),
  };

  const { error } = id
    ? await admin.from("sector_schedules").update(payload).eq("id", id).eq("sector_id", sectorId)
    : await admin.from("sector_schedules").insert(payload);

  if (error) back(path, { error: error.message });

  await audit(ctx, id ? "schedule.update" : "schedule.create", "sector_schedule", id ?? title);
  revalidatePath(path);
  revalidatePublic();
  back(path, { msg: "تم حفظ الجدول." });
}

export async function deleteSchedule(fd: FormData): Promise<void> {
  const path = "/admin/schedule";
  const ctx = await requirePermission("schedule.write");
  const sectorId = sectorOrFail(ctx, path);
  const id = str(fd, "id");
  const admin = adminClient(path);

  const { error } = await admin
    .from("sector_schedules")
    .delete()
    .eq("id", id)
    .eq("sector_id", sectorId);
  if (error) back(path, { error: error.message });

  await audit(ctx, "schedule.delete", "sector_schedule", id);
  revalidatePath(path);
  revalidatePublic();
  back(path, { msg: "تم حذف الجدول." });
}

export type { Permission };
