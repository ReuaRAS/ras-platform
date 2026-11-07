import Link from "next/link";
import { getSectorMeta } from "@/lib/sectors";
import { getTheme, themeStyle } from "@/lib/data";
import type { Sector } from "@/lib/types";

const TABS = [
  { key: "", label: "نظرة عامة" },
  { key: "laws", label: "القوانين" },
  { key: "recruitment", label: "التوظيف" },
  { key: "courses", label: "الدورات" },
  { key: "rewards", label: "المكافآت" },
  { key: "announcements", label: "الإعلانات" },
  { key: "leaderboard", label: "الصدارة" },
  { key: "help", label: "الأسئلة" },
];

export default function SectorHeader({
  sector,
  activeTab = "",
}: {
  sector: Sector;
  activeTab?: string;
}) {
  const meta = getSectorMeta(sector.slug);
  const theme = getTheme(sector);
  const base = `/sectors/${sector.slug}`;

  return (
    <div style={themeStyle(sector)}>
      <div className="sector-gradient relative overflow-hidden rounded-3xl px-6 py-8 sm:px-10">
        <div
          aria-hidden="true"
          className="absolute -left-10 -top-10 h-40 w-40 rounded-full opacity-20 blur-2xl"
          style={{ background: theme.light }}
        />
        <div className="relative flex flex-wrap items-center gap-4">
          {meta?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={meta.logo}
              alt={`شعار ${sector.name}`}
              width={64}
              height={64}
              className="h-16 w-16 shrink-0 object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.5)]"
            />
          ) : (
            <span
              className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-black/25 text-3xl"
              aria-hidden="true"
            >
              {meta?.icon ?? "🏛️"}
            </span>
          )}
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-[11px] font-bold text-white/70">
              <span className="rounded-full bg-black/25 px-2 py-0.5">{sector.sector_code}</span>
              <span>محافظة الرس</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white sm:text-3xl">{sector.name}</h1>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/80 sm:text-sm">
              {sector.description || meta?.description}
            </p>
          </div>
        </div>
      </div>

      <nav className="mt-4 flex gap-1 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const href = tab.key ? `${base}/${tab.key}` : base;
          const active = activeTab === tab.key;
          return (
            <Link
              key={tab.key || "overview"}
              href={href}
              className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                active
                  ? "sector-gradient text-white shadow-lg"
                  : "border border-white/[0.08] bg-white/[0.03] text-[#94a3b8] hover:bg-white/[0.07] hover:text-white"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
