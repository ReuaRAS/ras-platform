import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SectorHeader from "@/components/SectorHeader";
import { getSectorBySlug } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import type { StoreItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sector = await getSectorBySlug(slug);
  return { title: `المتجر — ${sector?.name ?? ""}` };
}

export default async function StorePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ discord?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const sector = await getSectorBySlug(slug);
  if (!sector) notFound();

  let items: StoreItem[] = [];
  const supabase = await createServerSupabase();
  if (supabase) {
    const { data } = await supabase
      .from("store_items")
      .select("*")
      .eq("sector_id", sector.id)
      .eq("is_active", true)
      .order("price");
    items = (data ?? []) as StoreItem[];
  }

  // رصيد اختياري عند تمرير معرّف Discord في الرابط
  let balance: number | null = null;
  let level: number | null = null;
  const discord = (sp.discord ?? "").trim();
  if (discord) {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from("member_xp")
        .select("total_xp, level")
        .eq("discord_id", discord)
        .maybeSingle();
      balance = data ? Number(data.total_xp) : 0;
      level = data ? Number(data.level) : 1;
    } catch {
      balance = null;
    }
  }

  return (
    <>
      <SectorHeader sector={sector} activeTab="store" />

      <div className="mt-6">
        <div className="mb-4">
          <h2 className="text-lg font-extrabold">🛒 متجر النقاط</h2>
          <p className="mt-1 text-xs text-[#94a3b8]">
            استبدل نقاط XP بمزايا داخل {sector.name}. الشراء يُنفَّذ من قيادة القطاع بعد التحقق.
          </p>
        </div>

        <form method="get" className="mb-4 flex flex-wrap items-end gap-2">
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold text-[#94a3b8]">اعرض رصيدك</span>
            <input
              name="discord"
              defaultValue={discord}
              dir="ltr"
              placeholder="Discord ID"
              className="rounded-xl border border-white/[0.08] bg-[#0b0b0c] px-3 py-2 text-xs text-white outline-none focus:border-[var(--sector-main)]"
            />
          </label>
          <button type="submit" className="btn btn-primary !px-4 !py-2 text-xs">
            عرض الرصيد
          </button>
        </form>

        {discord ? (
          balance === null ? (
            <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] font-bold text-amber-300">
              تعذّر قراءة الرصيد حاليًا.
            </p>
          ) : (
            <p className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11px] font-bold text-emerald-300">
              رصيدك: {balance} نقطة — المستوى {level ?? 1}
            </p>
          )
        ) : null}

        {items.length === 0 ? (
          <div className="glass-panel rounded-2xl border border-dashed border-white/15 p-8 text-center">
            <p className="text-2xl" aria-hidden="true">
              📭
            </p>
            <h3 className="mt-2 text-sm font-extrabold">المتجر فارغ حاليًا</h3>
            <p className="mt-1 text-xs text-[#94a3b8]">تُضاف العناصر من لوحة الإدارة ← متجر النقاط.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((item) => (
              <article key={item.id} className="glass-card rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-extrabold">{item.name}</h3>
                  <span className="shrink-0 rounded-full bg-[color-mix(in_srgb,var(--sector-main)_20%,transparent)] px-2 py-0.5 text-[10px] font-black text-[var(--sector-light)]">
                    {item.price} XP
                  </span>
                </div>
                {item.description ? (
                  <p className="mt-1.5 text-[11px] leading-relaxed text-[#94a3b8]">{item.description}</p>
                ) : null}
                <p className="mt-2 text-[10px] text-[#64748b]">
                  {item.stock === null ? "متوفر" : item.stock > 0 ? `المتوفر: ${item.stock}` : "نفد المخزون"}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
