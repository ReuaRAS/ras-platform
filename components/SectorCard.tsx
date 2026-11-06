import Link from "next/link";
import { getSectorMeta } from "@/lib/sectors";
import type { Sector } from "@/lib/types";

export default function SectorCard({ sector }: { sector: Sector }) {
  const meta = getSectorMeta(sector.slug);
  const color = sector.primary_color || meta?.primary_color || "#c62828";

  return (
    <Link
      href={`/sectors/${sector.slug}`}
      className="glass-card glass-card-hover group relative flex flex-col gap-3 overflow-hidden rounded-2xl p-5"
      style={
        {
          "--sector-main": color,
          "--sector-light": meta?.primary_color_light ?? color,
          "--sector-dark": meta?.primary_color_dark ?? color,
        } as React.CSSProperties
      }
    >
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
      />
      <div className="flex items-start justify-between">
        {meta?.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={meta.logo}
            alt={`شعار ${sector.name}`}
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)]"
            loading="lazy"
          />
        ) : (
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
            style={{ background: `color-mix(in srgb, ${color} 18%, transparent)` }}
            aria-hidden="true"
          >
            {meta?.icon ?? "🏛️"}
          </span>
        )}
        <span
          className="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold"
          style={{
            background: `color-mix(in srgb, ${color} 16%, transparent)`,
            color,
            border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`,
          }}
        >
          {sector.sector_code}
        </span>
      </div>

      <h3 className="text-lg font-extrabold">{sector.name}</h3>
      <p className="line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-[#94a3b8]">
        {sector.description || "قطاع في محافظة الرس"}
      </p>

      <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold" style={{ color }}>
        دخول القطاع
        <span className="transition-transform group-hover:-translate-x-1">←</span>
      </span>
    </Link>
  );
}
