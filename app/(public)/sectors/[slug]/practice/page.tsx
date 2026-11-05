import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import SectorHeader from "@/components/SectorHeader";
import { getSectorBySlug, isContentId } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Test } from "@/lib/types";

/** ISR: يُخزَّن HTML ويُحدَّث تلقائيًا كل 5 دقائق أو فورًا بعد أي تعديل إداري. */
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sector = await getSectorBySlug(slug);
  return {
    title: `وضع التدريب — ${sector?.name ?? ""}`,
    description: "تدرّب على أسئلة القطاع بلا شهادة ولا نقاط، مع تصحيح فوري.",
  };
}

export default async function SectorPracticePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sector = await getSectorBySlug(slug);
  if (!sector) notFound();

  let tests: Test[] = [];
  const counts = new Map<string, number>();

  if (!isContentId(sector.id)) {
    // بنك الأسئلة غير مقروء لـ anon (RLS)، فيُقرأ على السيرفر بصلاحية الخدمة.
    let supabase: ReturnType<typeof createAdminClient> | null = null;
    try {
      supabase = createAdminClient();
    } catch {
      supabase = null;
    }
    if (supabase) {
      const { data } = await supabase
        .from("tests")
        .select("*")
        .eq("sector_id", sector.id)
        .eq("is_active", true)
        .order("created_at");
      tests = (data ?? []) as Test[];

      if (tests.length > 0) {
        const { data: questions } = await supabase
          .from("questions")
          .select("id, test_id")
          .in(
            "test_id",
            tests.map((t) => t.id),
          )
          .eq("is_active", true);
        for (const q of (questions ?? []) as { id: string; test_id: string }[]) {
          counts.set(q.test_id, (counts.get(q.test_id) ?? 0) + 1);
        }
      }
    }
  }

  const ready = tests.filter((t) => (counts.get(t.id) ?? 0) > 0);

  return (
    <>
      <SectorHeader sector={sector} activeTab="practice" />

      <div className="mt-6">
        <div className="mb-4">
          <h2 className="text-lg font-extrabold">🎯 وضع التدريب</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#94a3b8]">
            تدرّب على أسئلة {sector.name} كما تشاء: تصحيح فوري، إظهار الإجابة الصحيحة بعد
            التسليم، وبلا شهادة ولا نقاط — الشهادات تُصدر من الاختبار الرسمي فقط.
          </p>
        </div>

        {ready.length === 0 ? (
          <div className="glass-panel rounded-2xl border border-dashed border-white/15 p-8 text-center">
            <p className="text-2xl" aria-hidden="true">
              🚧
            </p>
            <h3 className="mt-2 text-sm font-extrabold">لا يوجد بنك أسئلة جاهز للتدريب بعد</h3>
            <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-[#94a3b8]">
              تُضاف الأسئلة من لوحة الإدارة ← الاختبارات. يظهر كل اختبار هنا تلقائيًا بمجرد
              إضافة أسئلة إليه.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {ready.map((test) => (
              <article key={test.id} className="glass-card flex flex-col gap-3 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-extrabold">{test.title}</h3>
                  <span className="badge badge-warn shrink-0">
                    {counts.get(test.id)} سؤال
                  </span>
                </div>
                {test.description && (
                  <p className="text-xs leading-relaxed text-[#94a3b8]">{test.description}</p>
                )}
                <p className="text-[11px] text-[#64748b]">
                  {Math.min(test.questions_per_attempt, counts.get(test.id) ?? 0)} سؤالًا لكل
                  جلسة · {test.time_limit_minutes} دقيقة · نسبة النجاح {test.pass_score}%
                </p>
                <Link
                  href={`/sectors/${sector.slug}/practice/${test.id}`}
                  className="btn btn-primary mt-auto text-xs"
                >
                  ابدأ التدريب
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
