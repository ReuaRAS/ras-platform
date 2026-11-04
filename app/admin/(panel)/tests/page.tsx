import Link from "next/link";
import { deleteTest, saveTest } from "@/lib/admin/actions";
import { requirePermission } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Course, Test } from "@/lib/types";
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

export default async function AdminTestsPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; error?: string }>;
}) {
  const ctx = await requirePermission("tests.write");
  const sp = await searchParams;
  const admin = createAdminClient();

  const testsQuery = admin.from("tests").select("*");
  const { data } = await (
    ctx.isSuperAdmin || !ctx.sectorId ? testsQuery : testsQuery.eq("sector_id", ctx.sectorId)
  ).order("created_at");
  const tests = (data ?? []) as Test[];

  const coursesQuery = admin.from("courses").select("id, title, slug");
  const { data: coursesData } = await (
    ctx.isSuperAdmin || !ctx.sectorId ? coursesQuery : coursesQuery.eq("sector_id", ctx.sectorId)
  ).order("created_at");
  const courses = (coursesData ?? []) as Pick<Course, "id" | "title" | "slug">[];

  const { data: countsData } = await admin
    .from("questions")
    .select("test_id")
    .in("test_id", tests.length ? tests.map((t) => t.id) : ["00000000-0000-0000-0000-000000000000"]);

  const counts = new Map<string, number>();
  for (const row of (countsData ?? []) as { test_id: string }[]) {
    counts.set(row.test_id, (counts.get(row.test_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="الاختبارات"
        description="أنشئ اختبارًا ثم أضف أسئلته في بنك الأسئلة. الاختبار بدون أسئلة لا يسمح ببدء محاولة (503) لحماية المتقدمين من اختبار فارغ."
      />

      {sp.msg ? <Alert tone="success">{sp.msg}</Alert> : null}
      {sp.error ? <Alert tone="error">{sp.error}</Alert> : null}

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Panel title={`الاختبارات (${tests.length})`}>
          {tests.length === 0 ? (
            <EmptyState>لا توجد اختبارات بعد.</EmptyState>
          ) : (
            <ul className="space-y-2">
              {tests.map((test) => {
                const qCount = counts.get(test.id) ?? 0;
                return (
                  <li
                    key={test.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-[#0b0b0c] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold">{test.title}</span>
                        <Badge tone={test.is_active ? "success" : "muted"}>
                          {test.is_active ? "نشط" : "معطّل"}
                        </Badge>
                        <Badge tone={test.type === "recruitment" ? "warning" : "main"}>
                          {test.type === "recruitment" ? "توظيف" : "دورة"}
                        </Badge>
                        {qCount === 0 ? <Badge tone="danger">بنك فارغ</Badge> : null}
                      </div>
                      <p className="mt-0.5 text-[10px] text-[#64748b]">
                        {qCount} سؤال · نجاح {test.pass_score}% · {test.time_limit_minutes} دقيقة ·{" "}
                        {test.questions_per_attempt} سؤال لكل محاولة
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/tests/${test.id}`}
                        className="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-bold text-[#cbd5e1] hover:bg-white/5"
                      >
                        الأسئلة
                      </Link>
                      <form action={deleteTest}>
                        <input type="hidden" name="id" value={test.id} />
                        <DangerButton>حذف</DangerButton>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <div className="xl:sticky xl:top-4 xl:self-start">
          <Panel title="إضافة اختبار">
            {ctx.sectorId ? (
              <form action={saveTest} className="space-y-2">
                <Field label="العنوان">
                  <input name="title" required className={inputCls} />
                </Field>
                <Field label="النوع">
                  <select name="type" className={inputCls} defaultValue="course">
                    <option value="course">اختبار دورة</option>
                    <option value="recruitment">اختبار توظيف</option>
                  </select>
                </Field>
                <Field label="الدورة المرتبطة (اختياري)">
                  <select name="course_id" className={inputCls} defaultValue="">
                    <option value="">— بدون ربط —</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="الوصف">
                  <textarea name="description" rows={2} className={inputCls} />
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
                <label className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2 text-[11px]">
                  <input type="checkbox" name="is_active" defaultChecked />
                  نشط
                </label>
                <SubmitButton className="!w-full">إضافة الاختبار</SubmitButton>
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
