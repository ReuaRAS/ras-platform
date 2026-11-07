import { getSectorMeta } from "@/lib/sectors";
import type { Sector } from "@/lib/types";

/**
 * الشعار الرسمي للقطاع (من `sectors.logo_url` أو من `lib/sectors.ts`).
 * لا يُستخدم أي رمز تعبيري بديلًا عن الشعار: عند غياب الشعار تُعرض شارة كود القطاع.
 */
export default function SectorLogo({
  sector,
  size = 64,
  className = "",
}: {
  sector: Sector;
  size?: number;
  className?: string;
}) {
  const meta = getSectorMeta(sector.slug);
  const src = sector.logo_url || meta?.logo || null;

  if (!src) {
    return (
      <span
        aria-hidden="true"
        className={`flex shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-black/30 font-extrabold text-white ${className}`}
        style={{ width: size, height: size, fontSize: Math.round(size * 0.26) }}
      >
        {sector.sector_code}
      </span>
    );
  }

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* الشعار بخلفية شفافة: لا صندوق أبيض خلفه، وظل خفيف يفصله عن الخلفية الداكنة */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`شعار ${sector.name}`}
        width={size}
        height={size}
        className="h-full w-full object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)]"
        loading="lazy"
      />
    </span>
  );
}
