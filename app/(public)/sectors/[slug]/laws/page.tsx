import { notFound } from "next/navigation";
import type { Metadata } from "next";
import LawsList from "@/components/LawsList";
import SectorHeader from "@/components/SectorHeader";
import { getLaws, getSectorBySlug } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sector = await getSectorBySlug(slug);
  return { title: `القوانين — ${sector?.name ?? ""}` };
}

export default async function LawsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sector = await getSectorBySlug(slug);
  if (!sector) notFound();

  const laws = await getLaws(sector);

  return (
    <>
      <SectorHeader sector={sector} activeTab="laws" />

      <div className="mt-6">
        <div className="mb-4">
          <h2 className="text-lg font-extrabold">📜 قوانين {sector.name}</h2>
          <p className="mt-1 text-xs text-[#94a3b8]">
            {laws.length} قانونًا — اللوائح والعقوبات المعتمدة داخل القطاع.
          </p>
        </div>

        {laws.length === 0 ? (
          <div className="glass-panel rounded-2xl border border-dashed border-white/15 p-8 text-center">
            <p className="text-2xl" aria-hidden="true">
              📭
            </p>
            <h3 className="mt-2 text-sm font-extrabold">لا توجد قوانين منشورة</h3>
            <p className="mt-1 text-xs text-[#94a3b8]">
              تُضاف القوانين من لوحة الإدارة، ويمكن نسخ القوانين الأساسية من قطاع مرجعي.
            </p>
          </div>
        ) : (
          <LawsList laws={laws} />
        )}
      </div>
    </>
  );
}
