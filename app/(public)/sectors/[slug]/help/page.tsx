import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SectorHeader from "@/components/SectorHeader";
import { getSectorBySlug } from "@/lib/data";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Faq } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sector = await getSectorBySlug(slug);
  return { title: `الأسئلة الشائعة — ${sector?.name ?? ""}` };
}

export default async function SectorHelpPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sector = await getSectorBySlug(slug);
  if (!sector) notFound();

  let items: Faq[] = [];
  const supabase = await createServerSupabase();
  if (supabase) {
    const { data } = await supabase
      .from("faq")
      .select("*")
      .eq("sector_id", sector.id)
      .eq("is_published", true)
      .order("sort_order");
    items = (data ?? []) as Faq[];
  }

  return (
    <>
      <SectorHeader sector={sector} activeTab="help" />

      <div className="mt-6">
        <div className="mb-4">
          <h2 className="text-lg font-extrabold">❓ الأسئلة الشائعة</h2>
          <p className="mt-1 text-xs text-[#94a3b8]">
            أجوبة {sector.name} على أكثر ما يُسأل عنه. لم تجد إجابتك؟ تواصل مع قيادة القطاع عبر ديسكورد.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="glass-panel rounded-2xl border border-dashed border-white/15 p-8 text-center">
            <p className="text-2xl" aria-hidden="true">
              📭
            </p>
            <h3 className="mt-2 text-sm font-extrabold">لا توجد أسئلة شائعة بعد</h3>
            <p className="mt-1 text-xs text-[#94a3b8]">تُضاف من لوحة الإدارة ← الأسئلة الشائعة.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="glass-card rounded-2xl">
                <details className="group p-4">
                  <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-bold">
                    <span>{item.question}</span>
                    <span
                      aria-hidden="true"
                      className="text-[var(--sector-light)] transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 whitespace-pre-line border-t border-white/[0.06] pt-3 text-xs leading-relaxed text-[#cbd5e1]">
                    {item.answer}
                  </p>
                </details>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
