import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SectorHeader from "@/components/SectorHeader";
import { getSchedules, getSectorBySlug } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sector = await getSectorBySlug(slug);
  return { title: `الجدول — ${sector?.name ?? ""}` };
}

export default async function SchedulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sector = await getSectorBySlug(slug);
  if (!sector) notFound();

  const schedules = await getSchedules(sector);

  return (
    <>
      <SectorHeader sector={sector} activeTab="" />

      <div className="mt-6 space-y-5">
        {schedules.length === 0 ? (
          <div className="glass-panel rounded-2xl border border-dashed border-white/15 p-8 text-center">
            <p className="text-2xl" aria-hidden="true">
              📅
            </p>
            <h2 className="mt-2 text-sm font-extrabold">لا يوجد جدول منشور</h2>
            <p className="mt-1 text-xs text-[#94a3b8]">يُضاف الجدول من لوحة الإدارة.</p>
          </div>
        ) : (
          schedules.map((s) => (
            <section key={s.id} className="glass-card rounded-2xl p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-extrabold">{s.title}</h2>
                <span className="badge badge-muted">
                  {s.rows.length} صف · {s.columns.length} عمود
                </span>
              </div>

              {s.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.image_url}
                  alt={s.title}
                  className="mb-4 w-full rounded-xl border border-white/10"
                />
              )}

              <div className="max-h-[65vh] overflow-auto rounded-xl border border-white/10">
                <table className="w-full text-right text-[11px]">
                  <thead className="sticky top-0 bg-[#141416]">
                    <tr>
                      {s.columns.map((c) => (
                        <th key={c.key} className="whitespace-nowrap px-3 py-2 font-extrabold">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {s.rows.map((row, i) => (
                      <tr key={i} className="border-t border-white/[0.06] hover:bg-white/[0.03]">
                        {s.columns.map((c) => (
                          <td
                            key={c.key}
                            className="whitespace-nowrap px-3 py-1.5 text-[#cbd5e1]"
                          >
                            {row[c.key] || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {s.notes && <p className="mt-3 text-[11px] text-[#94a3b8]">{s.notes}</p>}
            </section>
          ))
        )}
      </div>
    </>
  );
}
