import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SectorHeader from "@/components/SectorHeader";
import { getSectorBySlug } from "@/lib/data";
import { createPublicSupabase } from "@/lib/supabase/public";
import type { Rank } from "@/lib/types";

/** ISR: يُخزَّن HTML ويُحدَّث تلقائيًا كل 5 دقائق أو فورًا بعد أي تعديل إداري. */
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sector = await getSectorBySlug(slug);
  return { title: `الرتب — ${sector?.name ?? ""}` };
}

export default async function RanksPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sector = await getSectorBySlug(slug);
  if (!sector) notFound();

  let ranks: Rank[] = [];
  const supabase = createPublicSupabase();
  if (supabase) {
    const { data } = await supabase
      .from("ranks")
      .select("*")
      .eq("sector_id", sector.id)
      .order("sort_order");
    ranks = (data ?? []) as Rank[];
  }

  return (
    <>
      <SectorHeader sector={sector} activeTab="ranks" />

      <div className="mt-6">
        <div className="mb-4">
          <h2 className="text-lg font-extrabold">🎖️ سلّم الرتب</h2>
          <p className="mt-1 text-xs text-[#94a3b8]">
            رتب {sector.name} مرتبة تصاعديًا ومتطلبات النقاط لكل رتبة.
          </p>
        </div>

        {ranks.length === 0 ? (
          <div className="glass-panel rounded-2xl border border-dashed border-white/15 p-8 text-center">
            <p className="text-2xl" aria-hidden="true">
              📭
            </p>
            <h3 className="mt-2 text-sm font-extrabold">لا توجد رتب معرّفة</h3>
            <p className="mt-1 text-xs text-[#94a3b8]">تُضاف الرتب من لوحة الإدارة ← الترقيات والرتب.</p>
          </div>
        ) : (
          <ol className="space-y-2">
            {ranks.map((rank, i) => (
              <li key={rank.id} className="glass-card rounded-2xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--sector-main)_20%,transparent)] text-[11px] font-black text-[var(--sector-light)]">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-extrabold">{rank.title}</h3>
                      <p className="text-[10px] text-[#64748b]" dir="ltr">
                        {rank.code}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-black/30 px-2.5 py-1 text-[10px] font-bold text-[#94a3b8]">
                    {rank.min_xp} XP
                  </span>
                </div>
                {rank.requirements && Object.keys(rank.requirements).length > 0 ? (
                  <pre
                    dir="ltr"
                    className="mt-2 overflow-x-auto rounded-lg bg-black/30 p-2 text-[10px] text-[#94a3b8]"
                  >
                    {JSON.stringify(rank.requirements, null, 2)}
                  </pre>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </div>
    </>
  );
}
