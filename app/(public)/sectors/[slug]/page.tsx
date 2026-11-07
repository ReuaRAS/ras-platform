import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase, FileText, GraduationCap, Trophy } from "lucide-react";
import { GlassLinkCard } from "@/components/GlassCard";
import SectorHeader from "@/components/SectorHeader";
import {
  getCourses,
  getLaws,
  getRecruitment,
  getRewards,
  getSchedules,
  getSectorBySlug,
} from "@/lib/data";

/** ISR: يُخزَّن HTML ويُحدَّث تلقائيًا كل 5 دقائق أو فورًا بعد أي تعديل إداري. */
export const revalidate = 300;

export default async function SectorOverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sector = await getSectorBySlug(slug);
  if (!sector) notFound();

  const [laws, rewards, courses, recruitment, schedules] = await Promise.all([
    getLaws(sector),
    getRewards(sector),
    getCourses(sector),
    getRecruitment(sector),
    getSchedules(sector),
  ]);

  const base = `/sectors/${sector.slug}`;

  const cards = [
    {
      href: `${base}/laws`,
      icon: FileText,
      title: "القوانين",
      count: `${laws.length} قانون`,
      desc: "اللوائح والأنظمة والمخالفات والعقوبات المعتمدة.",
    },
    {
      href: `${base}/recruitment`,
      icon: Briefcase,
      title: "التوظيف",
      count: recruitment.is_open ? "مفتوح" : "مغلق حاليًا",
      desc: "الدليل الشامل وشروط التقديم واختبار التوظيف.",
    },
    {
      href: `${base}/courses`,
      icon: GraduationCap,
      title: "الدورات",
      count: `${courses.length} دورة`,
      desc: "سلايدات الدورات واختباراتها وشهاداتها.",
    },
    {
      href: `${base}/rewards`,
      icon: Trophy,
      title: "المكافآت",
      count: `${rewards.length} مكافأة`,
      desc: "آليات التقدير والحوافز داخل القطاع.",
    },
  ];

  return (
    <>
      <SectorHeader sector={sector} activeTab="" />

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <GlassLinkCard key={c.href} href={c.href} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]"
                aria-hidden="true"
              >
                <c.icon className="h-[18px] w-[18px] text-[var(--sector-light)]" />
              </span>
              <span className="text-[10px] font-bold text-[var(--sector-light)]">{c.count}</span>
            </div>
            <h2 className="text-base font-extrabold">{c.title}</h2>
            <p className="text-xs leading-relaxed text-[#94a3b8]">{c.desc}</p>
          </GlassLinkCard>
        ))}
      </section>

      {laws.length === 0 && courses.length === 0 && rewards.length === 0 && (
        <section className="glass-panel mt-6 rounded-2xl border border-dashed border-white/15 p-8 text-center">
          <p className="text-2xl" aria-hidden="true">
            🚧
          </p>
          <h2 className="mt-2 text-base font-extrabold">المحتوى قيد الإعداد</h2>
          <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-[#94a3b8]">
            لم يُضف محتوى لهذا القطاع بعد. تُدار القوانين والدورات والمكافآت بالكامل من لوحة
            الإدارة، وتظهر هنا مباشرة بعد إضافتها.
          </p>
          <Link href="/admin" className="btn btn-ghost mt-4 text-xs">
            الدخول إلى لوحة الإدارة
          </Link>
        </section>
      )}

      {/* الجدول (مثل جدول الميكانيك) */}
      {schedules.length > 0 && (
        <section className="mt-6">
          {schedules.map((s) => (
            <div key={s.id} className="glass-card rounded-2xl p-5">
              <h2 className="mb-1 text-base font-extrabold">{s.title}</h2>
              <p className="mb-4 text-[11px] text-[#94a3b8]">
                {s.rows.length} صف · {s.columns.length} عمود
              </p>
              <div className="max-h-72 overflow-auto rounded-xl border border-white/10">
                <table className="w-full text-right text-[11px]">
                  <thead className="sticky top-0 bg-[#141416]">
                    <tr>
                      {s.columns.map((c) => (
                        <th key={c.key} className="whitespace-nowrap px-2.5 py-2 font-extrabold">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {s.rows.slice(0, 50).map((row, i) => (
                      <tr key={i} className="border-t border-white/[0.06]">
                        {s.columns.map((c) => (
                          <td key={c.key} className="whitespace-nowrap px-2.5 py-1.5 text-[#cbd5e1]">
                            {row[c.key] || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Link href={`${base}/schedule`} className="btn btn-ghost mt-3 text-xs">
                عرض الجدول كاملًا
              </Link>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
