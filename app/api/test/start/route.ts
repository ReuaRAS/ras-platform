import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientIp, verifyTurnstile } from "@/lib/turnstile";
import { firstError, startAttemptSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** خلط عشوائي آمن (Fisher–Yates) */
function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

type QuestionRow = { id: string; question_text: string; points: number | null };

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
  const parsed = startAttemptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  }
  const input = parsed.data;
  const ip = getClientIp(req);

  // 1) Turnstile
  const turnstile = await verifyTurnstile(input.turnstileToken, ip);
  if (!turnstile.ok) {
    return NextResponse.json({ error: turnstile.error }, { status: 400 });
  }

  // 2) الاختبار
  const { data: test } = await admin
    .from("tests")
    .select(
      "id, sector_id, course_id, type, title, pass_score, time_limit_minutes, questions_per_attempt, is_active",
    )
    .eq("id", input.testId)
    .maybeSingle();

  if (!test || !test.is_active) {
    return NextResponse.json({ error: "الاختبار غير متاح." }, { status: 404 });
  }

  // 3) معدّل المحاولات: 3 في الساعة لكل معرّف ديسكورد
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("test_attempts")
    .select("id", { count: "exact", head: true })
    .eq("discord_id", input.discordId)
    .gte("started_at", hourAgo);

  if ((count ?? 0) >= 3) {
    return NextResponse.json(
      { error: "تجاوزت الحد المسموح (3 محاولات في الساعة). حاول لاحقًا." },
      { status: 429 },
    );
  }

  // 4) منع تكرار الاجتياز لنفس الاختبار
  const { data: passedAttempt } = await admin
    .from("test_attempts")
    .select("id")
    .eq("discord_id", input.discordId)
    .eq("test_id", test.id)
    .eq("passed", true)
    .limit(1);

  if (passedAttempt && passedAttempt.length > 0) {
    return NextResponse.json(
      { error: "لقد اجتزت هذا الاختبار بالفعل ولديك شهادة صادرة." },
      { status: 409 },
    );
  }

  // TODO: Phase 9 — منع محاولة جديدة خلال 24 ساعة لنفس الاختبار.

  // 5) بنك الأسئلة
  const { data: bank } = await admin
    .from("questions")
    .select("id, question_text, points")
    .eq("test_id", test.id)
    .eq("is_active", true);

  const questions = (bank ?? []) as QuestionRow[];
  if (questions.length === 0) {
    return NextResponse.json(
      { error: "بنك أسئلة هذا الاختبار فارغ. يُضاف من لوحة الإدارة." },
      { status: 503 },
    );
  }

  const perAttempt = Math.max(1, Math.min(Number(test.questions_per_attempt ?? 10), questions.length));
  const selected = shuffle(questions).slice(0, perAttempt);
  const selectedIds = selected.map((q) => q.id);

  // 6) إنشاء المحاولة
  const { data: attempt, error: attemptError } = await admin
    .from("test_attempts")
    .insert({
      sector_id: test.sector_id,
      test_id: test.id,
      course_id: test.course_id,
      test_type: test.type,
      trainee_name: input.traineeName,
      discord_username: input.discordUsername,
      discord_id: input.discordId,
      real_age: input.realAge,
      current_rank: input.currentRank,
      selected_question_ids: selectedIds,
      total_points: selected.reduce((sum, q) => sum + Number(q.points ?? 1), 0),
      ip_address: ip,
    })
    .select("id")
    .single();

  if (attemptError || !attempt) {
    return NextResponse.json(
      { error: `تعذّر بدء المحاولة: ${attemptError?.message ?? "unknown"}` },
      { status: 500 },
    );
  }

  // 7) الخيارات (بدون is_correct) — بترتيب عشوائي أيضًا
  const { data: choices } = await admin
    .from("choices")
    .select("id, question_id, choice_text")
    .in("question_id", selectedIds);

  const byQuestion = new Map<string, { id: string; choice_text: string }[]>();
  for (const c of choices ?? []) {
    const list = byQuestion.get(c.question_id) ?? [];
    list.push({ id: c.id, choice_text: c.choice_text });
    byQuestion.set(c.question_id, list);
  }

  return NextResponse.json({
    attemptId: attempt.id,
    testTitle: test.title,
    passScore: Number(test.pass_score ?? 70),
    timeLimitMinutes: Number(test.time_limit_minutes ?? 20),
    questions: selected.map((q) => ({
      id: q.id,
      question_text: q.question_text,
      points: Number(q.points ?? 1),
      choices: shuffle(byQuestion.get(q.id) ?? []),
    })),
  });
}
