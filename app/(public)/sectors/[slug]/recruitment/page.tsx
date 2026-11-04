import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SectorHeader from "@/components/SectorHeader";
import { getRecruitment, getSectorBySlug, getTests } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sector = await getSectorBySlug(slug);
  return { title: `التوظيف — ${sector?.name ?? ""}` };
}

export default async function RecruitmentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sector = await getSectorBySlug(slug);
  if (!sector) notFound();

  const [recruitment, tests] = await Promise.all([getRecruitment(sector), getTests(sector)]);
  const recruitmentTest = tests.find((t) => t.type === "recruitment");
  const base = `/sectors/${sector.slug}`;

  return (
    <>
      <SectorHeader sector={sector} activeTab="recruitment" />

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_290px]">
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5 sm:p-7">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-extrabold">💼 منصة التوظيف</h2>
              <span className={`badge ${recruitment.is_open ? "badge-success" : "badge-muted"}`}>
                {recruitment.is_open ? "التقديم مفتوح" : "التقديم مغلق"}
              </span>
            </div>

            <p className="text-sm leading-relaxed text-[#cbd5e1]">
              {recruitment.description ||
                "اقرأ الدليل الشامل للقطاع أولًا، ثم اجتَز اختبار التوظيف للانضمام."}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {recruitment.guide.length > 0 && (
                <Link href={`${base}/recruitment/guide`} className="btn btn-ghost text-xs">
                  📘 الدليل الشامل
                </Link>
              )}
              {recruitmentTest ? (
                <Link href={`/test/${recruitmentTest.id}`} className="btn btn-primary text-xs">
                  ✍️ ابدأ اختبار التوظيف
                </Link>
              ) : (
                <span className="badge badge-warn">اختبار التوظيف غير مهيّأ بعد</span>
              )}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <h3 className="mb-3 text-sm font-extrabold">شروط التقديم</h3>
            {recruitment.conditions.length === 0 ? (
              <p className="text-xs text-[#94a3b8]">
                لم تُحدد شروط بعد. تُضاف من لوحة الإدارة ضمن بيانات التوظيف.
              </p>
            ) : (
              <ul className="space-y-2">
                {recruitment.conditions.map((c, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs leading-relaxed"
                  >
                    <span className="text-[var(--sector-light)]" aria-hidden="true">
                      ✓
                    </span>
                    {c}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <aside className="space-y-3">
          <div className="glass-panel rounded-2xl p-4">
            <h3 className="mb-2 text-sm font-extrabold">كيف أقدّم؟</h3>
            <ol className="space-y-2 text-[11px] leading-relaxed text-[#94a3b8]">
              <li>1. اقرأ الدليل الشامل للقطاع كاملًا.</li>
              <li>2. ابدأ اختبار التوظيف وعبّئ بياناتك بدقة.</li>
              <li>3. إن اجتزت بنسبة 70% أو أكثر تصدر شهادتك فورًا.</li>
              <li>4. انتظر رد القطاع عبر ديسكورد.</li>
            </ol>
          </div>
          <div className="glass-panel rounded-2xl p-4 text-[11px] leading-relaxed text-[#94a3b8]">
            <p className="mb-1 font-bold text-white">تنبيه</p>
            الرجاء كتابة الاسم الحقيقي في المحافظة واسم ديسكورد بدقة، لأن البيانات تُطبع على
            الشهادة كما تُدخل.
          </div>
        </aside>
      </div>
    </>
  );
}
