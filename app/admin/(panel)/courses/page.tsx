import Link from "next/link";
import { deleteCourse, saveCourse } from "@/lib/admin/actions";
import { requirePermission } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Course } from "@/lib/types";
import {
  Alert,
  Badge,
  DangerButton,
  EmptyState,
  Field,
  PageHeader,
  Panel,
  SubmitButton,
  inputCls,
} from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; error?: string }>;
}) {
  const ctx = await requirePermission("courses.write");
  const sp = await searchParams;
  const admin = createAdminClient();

  const base = admin.from("courses").select("*");
  const { data } = await (ctx.isSuperAdmin ? base : base.eq("sector_id", ctx.sectorId!)).order(
    "created_at",
  );
  const courses = (data ?? []) as Course[];

  return (
    <div className="space-y-4">
      <PageHeader
        title="الدورات"
        description="كل دورة لها رمز شهادة مستقل (مثل RCA-SUP-M) ويُستخدم في ترقيم الشهادات. سلايدات الدورة تُحرَّر من صفحة الدورة."
      />

      {sp.msg ? <Alert tone="success">{sp.msg}</Alert> : null}
      {sp.error ? <Alert tone="error">{sp.error}</Alert> : null}

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Panel title={`الدورات (${courses.length})`}>
          {courses.length === 0 ? (
            <EmptyState>
              لا توجد دورات في قاعدة البيانات. أضف دورة من النموذج المجاور، أو اعتمد محتوى
              `content/` المهيّأ بالانتقال إلى نسخ المحتوى إلى القاعدة.
            </EmptyState>
          ) : (
            <ul className="space-y-2">
              {courses.map((course) => (
                <li
                  key={course.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-[#0b0b0c] px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[11px] font-bold">{course.title}</span>
                      <Badge tone={course.is_active ? "success" : "muted"}>
                        {course.is_active ? "نشطة" : "معطّلة"}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-[10px] text-[#64748b]" dir="ltr">
                      {course.slug} · {course.certificate_prefix} · {course.pass_score}% ·{" "}
                      {course.questions_per_attempt} سؤال
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/courses/${course.id}`}
                      className="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-bold text-[#cbd5e1] hover:bg-white/5"
                    >
                      تحرير
                    </Link>
                    <form action={deleteCourse}>
                      <input type="hidden" name="id" value={course.id} />
                      <DangerButton>حذف</DangerButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="xl:sticky xl:top-4 xl:self-start">
          <Panel title="إضافة دورة">
            {ctx.sectorId ? (
              <form action={saveCourse} className="space-y-2">
                <Field label="عنوان الدورة">
                  <input name="title" required className={inputCls} />
                </Field>
                <Field label="المعرّف (slug)" hint="أحرف إنجليزية صغيرة وأرقام وشرطات">
                  <input name="slug" required className={inputCls} dir="ltr" placeholder="supervisor-basics" />
                </Field>
                <Field label="رمز الشهادة">
                  <input
                    name="certificate_prefix"
                    required
                    className={inputCls}
                    dir="ltr"
                    placeholder="RCA-SUP-M"
                  />
                </Field>
                <Field label="الوصف">
                  <textarea name="description" rows={3} className={inputCls} />
                </Field>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="النجاح %">
                    <input name="pass_score" type="number" min={1} max={100} defaultValue={70} className={inputCls} />
                  </Field>
                  <Field label="الدقائق">
                    <input
                      name="time_limit_minutes"
                      type="number"
                      min={1}
                      max={240}
                      defaultValue={20}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="الأسئلة">
                    <input
                      name="questions_per_attempt"
                      type="number"
                      min={1}
                      max={100}
                      defaultValue={10}
                      className={inputCls}
                    />
                  </Field>
                </div>
                <Field label="صلاحية الشهادة بالأيام (اختياري)">
                  <input name="duration_days" type="number" min={1} className={inputCls} />
                </Field>
                <label className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2 text-[11px]">
                  <input type="checkbox" name="is_active" defaultChecked />
                  نشطة (تظهر للعامة)
                </label>
                <SubmitButton className="!w-full">إضافة الدورة</SubmitButton>
              </form>
            ) : (
              <EmptyState>هذا الحساب غير مرتبط بقطاع.</EmptyState>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
