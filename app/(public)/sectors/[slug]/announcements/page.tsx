import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Megaphone } from "lucide-react";
import EventCountdown from "@/components/EventCountdown";
import SectorHeader from "@/components/SectorHeader";
import { getSectorBySlug } from "@/lib/data";
import { createPublicSupabase } from "@/lib/supabase/public";
import type { Announcement } from "@/lib/types";

/** ISR: يُخزَّن HTML ويُحدَّث تلقائيًا كل 5 دقائق أو فورًا بعد أي تعديل إداري. */
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sector = await getSectorBySlug(slug);
  return { title: `الإعلانات — ${sector?.name ?? ""}` };
}

export default async function SectorAnnouncementsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sector = await getSectorBySlug(slug);
  if (!sector) notFound();

  let items: Announcement[] = [];
  const supabase = createPublicSupabase();
  if (supabase) {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .eq("sector_id", sector.id)
      .eq("is_published", true)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });
    items = (data ?? []) as Announcement[];
  }

  const now = Date.now();

  return (
    <>
      <SectorHeader sector={sector} activeTab="announcements" />

      <div className="mt-6">
        <div className="mb-4">
          <h2 className="flex items-center gap-2 text-lg font-extrabold">
            <Megaphone className="h-5 w-5 text-[var(--sector-light)]" aria-hidden="true" />
            الإعلانات
          </h2>
          <p className="mt-1 text-xs text-[#94a3b8]">
            آخر إعلانات وفعاليات {sector.name}. تُحدَّث من لوحة الإدارة.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="glass-panel rounded-2xl border border-dashed border-white/15 p-8 text-center">
            <p className="text-2xl" aria-hidden="true">
              📭
            </p>
            <h3 className="mt-2 text-sm font-extrabold">لا توجد إعلانات بعد</h3>
            <p className="mt-1 text-xs text-[#94a3b8]">تُضاف من لوحة الإدارة ← الإعلانات.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => {
              const upcoming = item.event_date ? new Date(item.event_date).getTime() > now : false;
              return (
                <li key={item.id} className="glass-card rounded-2xl p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-extrabold">{item.title}</h3>
                    {item.is_pinned ? (
                      <span className="rounded-full bg-[var(--sector-main)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--sector-light)]">
                        مثبّت
                      </span>
                    ) : null}
                    <span className="text-[10px] text-[#64748b]">
                      {new Date(item.created_at).toLocaleDateString("ar-SA")}
                    </span>
                  </div>

                  {item.content ? (
                    <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-[#cbd5e1]">
                      {item.content}
                    </p>
                  ) : null}

                  {item.event_date ? (
                    <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-white/[0.06] pt-3">
                      <span className="text-[10px] font-bold text-[#94a3b8]">
                        الموعد: {new Date(item.event_date).toLocaleString("ar-SA")}
                      </span>
                      {upcoming ? <EventCountdown target={item.event_date} /> : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
