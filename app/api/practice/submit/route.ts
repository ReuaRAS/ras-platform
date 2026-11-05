import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { firstError, practiceSubmitSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChoiceRow = { id: string; question_id: string; choice_text: string; is_correct: boolean };

/**
 * تصحيح وضع التدريب.
 *
 * لا يصدر شهادة ولا يمنح XP ولا يحفظ بيانات شخصية — يُسجّل فقط درجة محاولة
 * تدريبية في `practice_attempts` ليظهر للقيادة حجم التدريب.
 */
export async function POST(req: Request) {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "التدريب غير مهيّأ على هذا السيرفر." }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const parsed = practiceSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  }
  const { testId, answers } = parsed.data;

  const { data: test } = await admin
    .from("tests")
    .select("id, sector_id, title, is_active, pass_score")
    .eq("id", testId)
    .maybeSingle();

  if (!test || !test.is_active) {
    return NextResponse.json({ error: "الاختبار غير متاح للتدريب." }, { status: 404 });
  }

  const questionIds = answers.map((a) => a.questionId);
  const { data: questions } = await admin
    .from("questions")
    .select("id, points")
    .in("id", questionIds)
    .eq("test_id", testId)
    .eq("is_active", true);

  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: "لا توجد أسئلة صالحة في هذه المحاولة." }, { status: 400 });
  }

  const pointsOf = new Map(
    (questions as { id: string; points: number }[]).map((q) => [q.id, q.points ?? 1]),
  );

  const { data: choices } = await admin
    .from("choices")
    .select("id, question_id, choice_text, is_correct")
    .in("question_id", [...pointsOf.keys()]);

  const correctByQuestion = new Map<string, ChoiceRow>();
  for (const choice of (choices ?? []) as ChoiceRow[]) {
    if (choice.is_correct) correctByQuestion.set(choice.question_id, choice);
  }

  let score = 0;
  let totalPoints = 0;
  const results = answers.map((answer) => {
    const points = pointsOf.get(answer.questionId) ?? 0;
    totalPoints += points;
    const correct = correctByQuestion.get(answer.questionId) ?? null;
    const isCorrect = Boolean(correct && answer.choiceId === correct.id);
    if (isCorrect) score += points;
    return {
      questionId: answer.questionId,
      isCorrect,
      correctChoiceId: correct?.id ?? null,
      correctText: correct?.choice_text ?? null,
    };
  });

  const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 10000) / 100 : 0;

  // سجل تدريبي بلا معرّف شخصي؛ فشل التسجيل لا يُفشل التصحيح.
  try {
    await admin.from("practice_attempts").insert({
      sector_id: test.sector_id,
      test_id: test.id,
      score,
      percentage,
    });
  } catch {
    // تجاهل: النتيجة تُعاد للزائر على أي حال.
  }

  return NextResponse.json({
    score,
    totalPoints,
    percentage,
    passed: percentage >= (test.pass_score ?? 70),
    results,
  });
}
