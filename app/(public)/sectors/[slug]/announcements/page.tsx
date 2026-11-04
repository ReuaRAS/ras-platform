import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SectorHeader from "@/components/SectorHeader";
import { formatDateTime } from "@/lib/utils";
import { getAnnouncements, getSectorBySlug } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sector = await getSectorBySlug(slug);
  return { title: `الإعلانات — ${sector?.name ?? ""}` };
}

export default async function AnnouncementsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sector = await getSectorBySlug(slug);
  if (!sector) notFound();

  const announcements = await getAnnouncements(sector);

  return (
    <>
      <SectorHeader sector={sector} activeTab="announcements" />

      <div className="mt-6">
        <h2 className="mb-4 text-lg font-extrabold">📣 إعلانات {sector.name}</h2>

        {announcements.length === 0 ? (
          <div className="glass-panel rounded-2xl border border-dashed border-white/15 p-8 text-center">
            <p className="text-2xl" aria-hidden="true">
              📭
            </p>
            <h3 className="mt-2 text-sm font-extrabold">لا توجد إعلانات</h3>
            <p className="mt-1 text-xs text-[#94a3b8]">
              تُنشر الإعلانات والفعاليات من لوحة الإدارة.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => (
              <article key={a.id} className="glass-card rounded-2xl p-5">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {a.is_pinned && <span className="badge badge-warn">مثبّت</span>}
                  <h3 className="text-sm font-extrabold">{a.title}</h3>
                  <span className="text-[10px] text-[#64748b]">
                    {formatDateTime(a.created_at)}
                  </span>
                </div>
                {a.content && (
                  <p className="whitespace-pre-line text-xs leading-relaxed text-[#cbd5e1]">
                    {a.content}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
