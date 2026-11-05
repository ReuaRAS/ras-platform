import { notFound } from "next/navigation";
import { themeStyle } from "@/lib/data";
import { getSectorBySlug } from "@/lib/data";
import { SECTORS } from "@/lib/sectors";

/**
 * القطاعات خمسة ثابتة، فتُبنى صفحاتها مسبقًا وتُخزَّن مع بقية الموقع (ISR)
 * بدل تصييرها في كل زيارة.
 */
export function generateStaticParams() {
  return SECTORS.map((sector) => ({ slug: sector.slug }));
}

export default async function SectorLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sector = await getSectorBySlug(slug);
  if (!sector) notFound();

  return (
    <div style={themeStyle(sector)} className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6">
      {children}
    </div>
  );
}
