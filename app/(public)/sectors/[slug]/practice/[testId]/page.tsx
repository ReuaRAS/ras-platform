import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PracticeRunner from "@/components/PracticeRunner";
import SectorHeader from "@/components/SectorHeader";
import { getSectorBySlug, isContentId } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PublicQuestion } from "@/lib/test-types";

/** كل جلسة تسحب أسئلة عشوائية، فلا تُخزَّن. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تدريب",
  robots: { index: false, follow: false },
};

type QuestionRow = {
  id: string;
  question_text: string;
  points: number | null;
  choices: { id: string; choice_text: string }[] | null;
};

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default async function PracticeTestPage({
  params,
}: {
  params: Promise<{ slug: string; testId: string }>;
}) {
  const { slug, testId } = await params;
  const sector = await getSectorBySlug(slug);
  if (!sector) notFound();

  if (isContentId(sector.id)) notFound();
  // نفس سبب صفحة القائمة: قراءة الاختبار والأسئلة تتطلب صلاحية الخدمة.
  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch {
    notFound();
  }

  const { data: test } = await supabase
    .from("tests")
    .select("id, sector_id, title, time_limit_minutes, questions_per_attempt, is_active")
    .eq("id", testId)
    .maybeSingle();

  if (!test || !test.is_active || test.sector_id !== sector.id) notFound();

  const { data: rows } = await supabase
    .from("questions")
    .select("id, question_text, points, choices(id, choice_text)")
    .eq("test_id", test.id)
    .eq("is_active", true);

  const questions: PublicQuestion[] = shuffle((rows ?? []) as QuestionRow[])
    .filter((q) => (q.choices?.length ?? 0) > 1)
    .slice(0, test.questions_per_attempt)
    .map((q) => ({
      id: q.id,
      question_text: q.question_text,
      points: q.points ?? 1,
      choices: shuffle(q.choices ?? []),
    }));

  if (questions.length === 0) {
    return (
      <>
        <SectorHeader sector={sector} activeTab="practice" />
        <div className="glass-panel mt-6 rounded-2xl border border-dashed border-white/15 p-8 text-center">
          <p className="text-2xl" aria-hidden="true">
            🚧
          </p>
          <h2 className="mt-2 text-sm font-extrabold">هذا الاختبار لا يحتوي أسئلة كافية</h2>
          <p className="mt-1 text-xs text-[#94a3b8]">
            يلزم سؤالان بخيارين على الأقل لكل سؤال لبدء التدريب.
          </p>
          <Link href={`/sectors/${sector.slug}/practice`} className="btn btn-ghost mt-4 text-xs">
            رجوع
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <SectorHeader sector={sector} activeTab="practice" />
      <PracticeRunner
        testId={test.id}
        testTitle={test.title}
        timeLimitMinutes={test.time_limit_minutes}
        sectorSlug={sector.slug}
        questions={questions}
      />
    </>
  );
}
