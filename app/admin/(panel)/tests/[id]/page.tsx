import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteQuestion, saveQuestion } from "@/lib/admin/actions";
import { requirePermission } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Test } from "@/lib/types";
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

type QuestionRow = {
  id: string;
  question_text: string;
  points: number;
  choices: { id: string; choice_text: string; is_correct: boolean }[];
};

export default async function AdminTestBankPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string; error?: string }>;
}) {
  const ctx = await requirePermission("tests.write");
  const { id } = await params;
  const sp = await searchParams;
  const admin = createAdminClient();

  const { data } = await admin
    .from("tests")
    .select("id, sector_id, title, description, pass_score, time_limit_minutes, questions_per_attempt, type, is_active, course_id")
    .eq("id", id)
    .maybeSingle();
  const test = data as Test | null;
  if (!test) notFound();
  if (!ctx.isSuperAdmin && ctx.sectorId !== test.sector_id) notFound();

  const { data: questionsData } = await admin
    .from("questions")
    .select("id, question_text, points, choices(id, choice_text, is_correct)")
    .eq("test_id", id)
    .order("created_at");

  const questions = (questionsData ?? []) as QuestionRow[];
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);

  return (
    <div className="space-y-4">
      <PageHeader title={test.title} description="بنك الأسئلة — كل محاولة تسحب أسئلة عشوائية من هنا.">
        <Link href="/admin/tests" className="text-[11px] font-bold text-[#94a3b8]">
          ← كل الاختبارات
        </Link>
      </PageHeader>

      {sp.msg ? <Alert tone="success">{sp.msg}</Alert> : null}
      {sp.error ? <Alert tone="error">{sp.error}</Alert> : null}

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/[0.06] bg-[#141416] px-3 py-2 text-[10px] text-[#94a3b8]">
        <Badge tone="main">{questions.length} سؤال</Badge>
        <Badge tone="muted">{totalPoints} نقطة</Badge>
        <Badge tone="muted">نجاح {test.pass_score}%</Badge>
        <Badge tone="muted">
          {Math.min(test.questions_per_attempt, questions.length)} سؤال لكل محاولة
        </Badge>
        {questions.length < test.questions_per_attempt ? (
          <span className="text-amber-300">
            عدد الأسئلة أقل من المطلوب لكل محاولة — أضف المزيد.
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-2">
          {questions.length === 0 ? (
            <EmptyState>
              بنك الأسئلة فارغ. لن يبدأ أي متقدم محاولة قبل إضافة أسئلة (يُرجع النظام 503 برسالة
              واضحة).
            </EmptyState>
          ) : (
            questions.map((q, index) => (
              <div key={q.id} className="rounded-2xl border border-white/[0.06] bg-[#141416] p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-bold leading-relaxed">
                    <span className="text-[#64748b]">{index + 1}. </span>
                    {q.question_text}
                  </p>
                  <Badge tone="muted">{q.points} ن</Badge>
                </div>
                <ul className="mt-2 space-y-1">
                  {(q.choices ?? []).map((c) => (
                    <li
                      key={c.id}
                      className={`rounded-lg px-2 py-1 text-[10px] ${
                        c.is_correct
                          ? "bg-emerald-500/10 text-emerald-300"
                          : "text-[#94a3b8]"
                      }`}
                    >
                      {c.is_correct ? "✓ " : "• "}
                      {c.choice_text}
                    </li>
                  ))}
                </ul>
                <form action={deleteQuestion} className="mt-2">
                  <input type="hidden" name="test_id" value={test.id} />
                  <input type="hidden" name="id" value={q.id} />
                  <DangerButton>حذف السؤال</DangerButton>
                </form>
              </div>
            ))
          )}
        </div>

        <div className="xl:sticky xl:top-4 xl:self-start">
          <Panel title="إضافة سؤال" description="حدد الخيار الصحيح من القائمة.">
            <form action={saveQuestion} className="space-y-2">
              <input type="hidden" name="test_id" value={test.id} />
              <Field label="نص السؤال">
                <textarea name="question_text" rows={3} required className={inputCls} />
              </Field>
              {[1, 2, 3, 4].map((i) => (
                <Field key={i} label={`الخيار ${i}`}>
                  <input name={`choice_${i}`} className={inputCls} required={i <= 2} />
                </Field>
              ))}
              <div className="grid grid-cols-2 gap-2">
                <Field label="الخيار الصحيح">
                  <select name="correct" className={inputCls} defaultValue="0">
                    <option value="0">الأول</option>
                    <option value="1">الثاني</option>
                    <option value="2">الثالث</option>
                    <option value="3">الرابع</option>
                  </select>
                </Field>
                <Field label="النقاط">
                  <input name="points" type="number" min={1} max={10} defaultValue={1} className={inputCls} />
                </Field>
              </div>
              <SubmitButton className="!w-full">إضافة السؤال</SubmitButton>
            </form>
          </Panel>
        </div>
      </div>
    </div>
  );
}
