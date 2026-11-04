import { notFound } from "next/navigation";
import { themeStyle } from "@/lib/data";
import { getSectorBySlug } from "@/lib/data";

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
