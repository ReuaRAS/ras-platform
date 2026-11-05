import { NextResponse } from "next/server";
import { revalidatePublic } from "@/lib/revalidate";
import { issueCertificate } from "@/lib/certificates";
import { logAudit } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_URL } from "@/lib/supabase/env";
import { getClientIp } from "@/lib/turnstile";
import { firstError, submitAttemptSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "الاختبارات غير مهيّأة على هذا السيرفر (Supabase غير مضبوط)." },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = submitAttemptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  }
  const { attemptId, answers, suspicionFlags } = parsed.data;
  const ip = getClientIp(req);

  // 1) المحاولة
  const { data: attempt } = await admin
    .from("test_attempts")
    .select(
      "id, sector_id, test_id, course_id, test_type, trainee_name, discord_username, discord_id, selected_question_ids, submitted_at, passed",
    )
    .eq("id", attemptId)
    .maybeSingle();

  if (!attempt) {
    return NextResponse.json({ error: "المحاولة غير موجودة." }, { status: 404 });
  }
  if (attempt.submitted_at) {
    return NextResponse.json({ error: "تم تسليم هذه المحاولة مسبقًا." }, { status: 409 });
  }

  // 2) الاختبار
  const { data: test } = await admin
    .from("tests")
    .select("id, title, pass_score, type")
    .eq("id", attempt.test_id)
    .maybeSingle();

  if (!test) {
    return NextResponse.json({ error: "الاختبار غير موجود." }, { status: 404 });
  }

  // 3) التصحيح
  const questionIds: string[] = attempt.selected_question_ids ?? [];
  if (questionIds.length === 0) {
    return NextResponse.json({ error: "لا توجد أسئلة في هذه المحاولة." }, { status: 400 });
  }

  const { data: questions } = await admin
    .from("questions")
    .select("id, points")
    .in("id", questionIds);

  const { data: choices } = await admin
    .from("choices")
    .select("id, question_id, is_correct")
    .in("question_id", questionIds);

  const pointsByQuestion = new Map<string, number>();
  for (const q of questions ?? []) pointsByQuestion.set(q.id, Number(q.points ?? 1));

  const correctChoice = new Map<string, string>();
  for (const c of choices ?? []) {
    if (c.is_correct) correctChoice.set(c.question_id, c.id);
  }

  const answerRows: {
    attempt_id: string;
    question_id: string;
    choice_id: string | null;
    is_correct: boolean;
    points_earned: number;
  }[] = [];

  let score = 0;
  for (const qid of questionIds) {
    const given = answers.find((a) => a.questionId === qid)?.choiceId ?? null;
    const expected = correctChoice.get(qid) ?? null;
    const isCorrect = Boolean(given && expected && given === expected);
    const points = pointsByQuestion.get(qid) ?? 1;
    if (isCorrect) score += points;

    answerRows.push({
      attempt_id: attemptId,
      question_id: qid,
      choice_id: given,
      is_correct: isCorrect,
      points_earned: isCorrect ? points : 0,
    });
  }

  const totalPoints = questionIds.reduce((sum, id) => sum + (pointsByQuestion.get(id) ?? 1), 0);
  const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 10000) / 100 : 0;
  const passScore = Number(test.pass_score ?? 70);
  const passed = percentage >= passScore;

  // 4) تحديث المحاولة + حفظ الإجابات
  const { error: updateError } = await admin
    .from("test_attempts")
    .update({
      score,
      total_points: totalPoints,
      percentage,
      passed,
      submitted_at: new Date().toISOString(),
      suspicion_flags: suspicionFlags ?? [],
    })
    .eq("id", attemptId);

  if (updateError) {
    return NextResponse.json(
      { error: `تعذّر حفظ النتيجة: ${updateError.message}` },
      { status: 500 },
    );
  }

  await admin.from("test_answers").insert(answerRows);

  // 5) الشهادة عند النجاح
  let certificate: { certificateNo: string; verifyUrl: string; pdfUrl: string | null } | null = null;
  let warning: string | undefined;

  if (passed) {
    const [{ data: sector }, { data: course }] = await Promise.all([
      admin
        .from("sectors")
        .select("id, name, sector_code, primary_color")
        .eq("id", attempt.sector_id)
        .maybeSingle(),
      attempt.course_id
        ? admin
            .from("courses")
            .select("title, certificate_prefix, duration_days")
            .eq("id", attempt.course_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    if (sector) {
      try {
        const result = await issueCertificate({
          admin,
          attemptId,
          attempt: {
            id: attempt.id,
            sector_id: attempt.sector_id,
            course_id: attempt.course_id,
            trainee_name: attempt.trainee_name,
            discord_username: attempt.discord_username,
            discord_id: attempt.discord_id,
            score,
            percentage,
          },
          course: course ?? null,
          sector,
          appUrl: APP_URL,
          testTitle: test.title,
          ip,
        });

        certificate = {
          certificateNo: result.certificateNo,
          verifyUrl: result.verifyUrl,
          pdfUrl: result.pdfUrl,
        };
        warning = result.warning;
      } catch (err) {
        warning = err instanceof Error ? err.message : "تعذّر إصدار الشهادة.";
      }
    }
  }

  await logAudit(admin, {
    sectorId: attempt.sector_id,
    action: passed ? "test.pass" : "test.fail",
    entityType: "test_attempt",
    entityId: attemptId,
    metadata: {
      test: test.title,
      score,
      total_points: totalPoints,
      percentage,
      suspicion: suspicionFlags?.length ?? 0,
    },
    ipAddress: ip,
  });

  // شهادة/نقاط جديدة ⇒ الصفحات المخزَّنة (الشهادات والصدارة) صارت قديمة.
  revalidatePublic();

  return NextResponse.json({
    score,
    totalPoints,
    percentage,
    passed,
    passScore,
    certificate,
    warning,
  });
}
