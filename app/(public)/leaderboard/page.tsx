import Link from "next/link";
import type { Metadata } from "next";
import { getSectors } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MemberXp, Sector, XpLevel } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "لوحة الصدارة",
  description: "أعلى الأعضاء نقاطًا في كل قطاع من قطاعات محافظة الرس.",
};

/** إخفاء معظم معرّف Discord في العرض العام */
function maskId(id: string) {
  if (id.length <= 4) return "••••";
  return `••••${id.slice(-4)}`;
}

export default async function LeaderboardPage() {
  const sectors = await getSectors();

  let rows: MemberXp[] = [];
  let levels: XpLevel[] = [];
  try {
    const admin = createAdminClient();
    const [{ data: xpData }, { data: levelData }] = await Promise.all([
      admin
        .from("member_xp")
        .select("*")
        .order("total_xp", { ascending: false })
        .limit(300),
      admin.from("xp_levels").select("*").order("min_xp"),
    ]);
    rows = (xpData ?? []) as MemberXp[];
    levels = (levelData ?? []) as XpLevel[];
  } catch {
    rows = [];
  }

  const levelTitle = (level: number) => levels.find((l) => l.level === level)?.title ?? `مستوى ${level}`;

  return (
    <div className="mx-auto max-w-4xl">
      <header className="glass-panel rounded-3xl p-6 text-center">
        <h1 className="text-2xl font-extrabold">🏅 لوحة الصدارة</h1>
        <p className="mt-2 text-xs leading-relaxed text-[#94a3b8]">
          أعلى الأعضاء نقاطًا في كل قطاع. تُضاف النقاط تلقائيًا عند إصدار الشهادات، وتُعدَّل يدويًا من
          قيادة القطاع. تُعرض المعرّفات مختصرة حفاظًا على الخصوصية.
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-white/15 p-8 text-center">
          <p className="text-2xl" aria-hidden="true">
            📭
          </p>
          <h2 className="mt-2 text-sm font-extrabold">لا توجد نقاط مسجّلة بعد</h2>
          <p className="mt-1 text-xs text-[#94a3b8]">
            تظهر الأسماء بعد أول شهادة تُصدر أو أول تعديل نقاط من لوحة الإدارة.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {sectors.map((sector: Sector) => {
            const top = rows.filter((r) => r.sector_id === sector.id).slice(0, 20);
            return (
              <section key={sector.id} className="glass-card rounded-2xl p-4">
                <header className="mb-2 flex items-center justify-between gap-2">
                  <h2 className="text-sm font-extrabold">{sector.name}</h2>
                  <Link
                    href={`/sectors/${sector.slug}`}
                    className="text-[10px] font-bold text-[var(--sector-light)]"
                  >
                    القطاع ←
                  </Link>
                </header>
                {top.length === 0 ? (
                  <p className="rounded-lg bg-black/25 px-2.5 py-2 text-[11px] text-[#64748b]">
                    لا نقاط في هذا القطاع بعد.
                  </p>
                ) : (
                  <ol className="space-y-1">
                    {top.map((row, i) => (
                      <li
                        key={row.id}
                        className="flex items-center justify-between gap-2 rounded-lg bg-black/25 px-2.5 py-1.5 text-[11px]"
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-5 text-center font-black text-[var(--sector-light)]">
                            {i + 1}
                          </span>
                          <span className="font-mono text-[10px] text-[#cbd5e1]" dir="ltr">
                            {maskId(row.discord_id)}
                          </span>
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="text-[10px] text-[#64748b]">{levelTitle(row.level)}</span>
                          <span className="font-extrabold">{row.total_xp}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
