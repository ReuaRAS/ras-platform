import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SectorHeader from "@/components/SectorHeader";
import { getRewards, getSectorBySlug } from "@/lib/data";

/** ISR: يُخزَّن HTML ويُحدَّث تلقائيًا كل 5 دقائق أو فورًا بعد أي تعديل إداري. */
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sector = await getSectorBySlug(slug);
  return { title: `المكافآت — ${sector?.name ?? ""}` };
}

export default async function RewardsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sector = await getSectorBySlug(slug);
  if (!sector) notFound();

  const rewards = await getRewards(sector);

  return (
    <>
      <SectorHeader sector={sector} activeTab="rewards" />

      <div className="mt-6">
        <div className="mb-4">
          <h2 className="text-lg font-extrabold">🏆 نظام المكافآت</h2>
          <p className="mt-1 text-xs text-[#94a3b8]">
            الحوافز وآليات التقدير داخل {sector.name} — {rewards.length} مكافأة.
          </p>
        </div>

        {rewards.length === 0 ? (
          <div className="glass-panel rounded-2xl border border-dashed border-white/15 p-8 text-center">
            <p className="text-2xl" aria-hidden="true">
              📭
            </p>
            <h3 className="mt-2 text-sm font-extrabold">لا توجد مكافآت منشورة</h3>
            <p className="mt-1 text-xs text-[#94a3b8]">تُضاف المكافآت من لوحة الإدارة.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {rewards.map((r) => (
                <article key={r.id} className="glass-card glass-card-hover rounded-2xl p-4">
                  <div className="mb-2 flex items-start gap-2.5">
                    <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--sector-main)_20%,transparent)] px-1.5 text-[11px] font-black text-[var(--sector-light)]">
                      #{r.reward_code.replace(/\D/g, "").slice(-2)}
                    </span>
                    <h3 className="text-sm font-extrabold leading-snug">{r.title}</h3>
                  </div>
                  <p className="text-xs font-bold text-[#4ade80]">
                    <span aria-hidden="true">🎁</span> {r.reward_value}
                  </p>
                  {r.conditions && (
                    <p className="mt-2 rounded-lg bg-black/30 px-2.5 py-1.5 text-[11px] leading-relaxed text-[#94a3b8]">
                      {r.conditions}
                    </p>
                  )}
                </article>
              ))}
            </div>
            <p className="mt-6 text-center text-[11px] text-[#64748b]">
              جميع المكافآت قابلة للتعديل حسب تقدير القيادة.
            </p>
          </>
        )}
      </div>
    </>
  );
}
