import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Medal } from "lucide-react";
import SectorHeader from "@/components/SectorHeader";
import { getSectorBySlug } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MemberXp, XpLevel } from "@/lib/types";

/** ISR: يُخزَّن HTML ويُحدَّث تلقائيًا كل 5 دقائق أو فورًا بعد أي تعديل إداري. */
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sector = await getSectorBySlug(slug);
  return { title: `لوحة الصدارة — ${sector?.name ?? ""}`, description: "أعلى أعضاء القطاع نقاطًا." };
}

/** إخفاء معظم معرّف Discord في العرض العام */
function maskId(id: string) {
  if (id.length <= 4) return "••••";
  return `••••${id.slice(-4)}`;
}

export default async function SectorLeaderboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sector = await getSectorBySlug(slug);
  if (!sector) notFound();

  let rows: MemberXp[] = [];
  let levels: XpLevel[] = [];
  try {
    const admin = createAdminClient();
    const [{ data: xpData }, { data: levelData }] = await Promise.all([
      admin
        .from("member_xp")
        .select("*")
        .eq("sector_id", sector.id)
        .order("total_xp", { ascending: false })
        .limit(50),
      admin.from("xp_levels").select("*").order("min_xp"),
    ]);
    rows = (xpData ?? []) as MemberXp[];
    levels = (levelData ?? []) as XpLevel[];
  } catch {
    rows = [];
  }

  const levelTitle = (level: number) =>
    levels.find((l) => l.level === level)?.title ?? `مستوى ${level}`;

  return (
    <>
      <SectorHeader sector={sector} activeTab="leaderboard" />

      <div className="mt-6">
        <div className="mb-4">
          <h2 className="flex items-center gap-2 text-lg font-extrabold">
            <Medal className="h-5 w-5 text-[var(--sector-light)]" aria-hidden="true" />
            لوحة الصدارة
          </h2>
          <p className="mt-1 text-xs text-[#94a3b8]">
            أعلى {rows.length > 0 ? Math.min(rows.length, 50) : 20} عضوًا نقاطًا في {sector.name}.
            تُعرض المعرّفات مختصرة حفاظًا على الخصوصية.
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="glass-panel rounded-2xl border border-dashed border-white/15 p-8 text-center">
            <p className="text-2xl" aria-hidden="true">
              📭
            </p>
            <h3 className="mt-2 text-sm font-extrabold">لا توجد نقاط مسجّلة بعد</h3>
            <p className="mt-1 text-xs text-[#94a3b8]">
              تظهر الأسماء بعد أول شهادة تُصدر أو أول تعديل نقاط من لوحة الإدارة.
            </p>
          </div>
        ) : (
          <ol className="space-y-2">
            {rows.map((row, i) => (
              <li
                key={row.id}
                className="glass-card flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-black ${
                      i < 3
                        ? "bg-[color-mix(in_srgb,var(--sector-main)_25%,transparent)] text-[var(--sector-light)]"
                        : "bg-black/30 text-[#64748b]"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-mono text-xs text-[#e2e8f0]" dir="ltr">
                      {maskId(row.discord_id)}
                    </p>
                    <p className="text-[10px] text-[#64748b]">{levelTitle(row.level)}</p>
                  </div>
                </div>
                <span className="text-sm font-extrabold text-[var(--sector-light)]">
                  {row.total_xp} <span className="text-[10px] font-bold text-[#64748b]">XP</span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </>
  );
}
