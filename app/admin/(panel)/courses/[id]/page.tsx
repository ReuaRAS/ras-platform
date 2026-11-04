import Link from "next/link";
import { notFound } from "next/navigation";
import { saveCourse, saveCourseSlides } from "@/lib/admin/actions";
import { requirePermission } from "@/lib/auth/guard";
import { parseSlides } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Course, Test } from "@/lib/types";
import {
  Alert,
  Badge,
  EmptyState,
  Field,
  PageHeader,
  Panel,
  SubmitButton,
  inputCls,
} from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminCourseEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string; error?: string }>;
}) {
  const ctx = await requirePermission("courses.write");
  const { id } = await params;
  const sp = await searchParams;
  const admin = createAdminClient();

  const { data } = await admin.from("courses").select("*").eq("id", id).maybeSingle();
  const course = data as Course | null;
  if (!course) notFound();
  if (!ctx.isSuperAdmin && ctx.sectorId !== course.sector_id) notFound();

  const { data: testsData } = await admin
    .from("tests")
    .select("id, title, is_active")
    .eq("course_id", id);
  const tests = (testsData ?? []) as Pick<Test, "id" | "title" | "is_active">[];

  const slides = parseSlides(course).slides;
  const slidesJson = JSON.stringify(slides, null, 2);

  return (
    <div className="space-y-4">
      <PageHeader title={course.title} description={`المعرّف: ${course.slug}`}>
        <Link href="/admin/courses" className="text-[11px] font-bold text-[#94a3b8]">
          ← كل الدورات
        </Link>
        <Link
          href={`/sectors/${ctx.sector?.slug ?? ""}/courses/${course.slug}`}
          className="text-[11px] font-bold text-[var(--sector-main)]"
        >
          معاينة عامة ↗
        </Link>
      </PageHeader>

      {sp.msg ? <Alert tone="success">{sp.msg}</Alert> : null}
      {sp.error ? <Alert tone="error">{sp.error}</Alert> : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_1.3fr]">
        <Panel title="إعدادات الدورة">
          <form action={saveCourse} className="space-y-2">
            <input type="hidden" name="id" value={course.id} />
            <Field label="العنوان">
              <input name="title" defaultValue={course.title} required className={inputCls} />
            </Field>
            <Field label="المعرّف (slug)">
              <input name="slug" defaultValue={course.slug} required className={inputCls} dir="ltr" />
            </Field>
            <Field label="رمز الشهادة">
              <input
                name="certificate_prefix"
                defaultValue={course.certificate_prefix}
                required
                className={inputCls}
                dir="ltr"
              />
            </Field>
            <Field label="الوصف">
              <textarea name="description" defaultValue={course.description ?? ""} rows={3} className={inputCls} />
            </Field>
            <div className="grid grid-cols-3 gap-2">
              <Field label="النجاح %">
                <input
                  name="pass_score"
                  type="number"
                  min={1}
                  max={100}
                  defaultValue={course.pass_score}
                  className={inputCls}
                />
              </Field>
              <Field label="الدقائق">
                <input
                  name="time_limit_minutes"
                  type="number"
                  min={1}
                  max={240}
                  defaultValue={course.time_limit_minutes}
                  className={inputCls}
                />
              </Field>
              <Field label="الأسئلة">
                <input
                  name="questions_per_attempt"
                  type="number"
                  min={1}
                  max={100}
                  defaultValue={course.questions_per_attempt}
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="صلاحية الشهادة بالأيام (اختياري)">
              <input
                name="duration_days"
                type="number"
                min={1}
                defaultValue={course.duration_days ?? ""}
                className={inputCls}
              />
            </Field>
            <label className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2 text-[11px]">
              <input type="checkbox" name="is_active" defaultChecked={course.is_active} />
              نشطة
            </label>
            <SubmitButton className="!w-full">حفظ الإعدادات</SubmitButton>
          </form>

          <div className="mt-3 border-t border-white/[0.06] pt-3">
            <p className="mb-1 text-[10px] font-bold text-[#94a3b8]">اختبارات الدورة</p>
            {tests.length === 0 ? (
              <p className="text-[10px] text-[#64748b]">لا يوجد اختبار مربوط بهذه الدورة بعد.</p>
            ) : (
              <ul className="space-y-1">
                {tests.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2 text-[11px]">
                    <Link href={`/admin/tests/${t.id}`} className="font-bold hover:underline">
                      {t.title}
                    </Link>
                    <Badge tone={t.is_active ? "success" : "muted"}>{t.is_active ? "نشط" : "معطّل"}</Badge>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/admin/tests"
              className="mt-2 inline-block text-[10px] font-bold text-[var(--sector-main)]"
            >
              إدارة الاختبارات ←
            </Link>
          </div>
        </Panel>

        <Panel
          title={`السلايدات (${slides.length})`}
          description="JSON. الحقول المتاحة لكل سلايد: title, content, image. اترك content نصًا عربيًا واضحًا."
        >
          <form action={saveCourseSlides} className="space-y-2">
            <input type="hidden" name="id" value={course.id} />
            <textarea
              name="slides"
              rows={22}
              defaultValue={slidesJson}
              className={`${inputCls} font-mono text-[11px]`}
              dir="ltr"
            />
            <SubmitButton>حفظ السلايدات</SubmitButton>
          </form>
          {slides.length === 0 ? (
            <div className="mt-3">
              <EmptyState>
                لا توجد سلايدات محفوظة في القاعدة. يمكنك نسخ سلايدات المحتوى المهيّأ من ملفات
                `content/` أو لصق JSON جديد أعلاه.
              </EmptyState>
            </div>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}
