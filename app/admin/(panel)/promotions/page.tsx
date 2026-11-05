import { decidePromotion, deleteRank, requestPromotion, saveRank } from "@/lib/admin/actions-members";
import { requirePermission } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Promotion, Rank } from "@/lib/types";
import {
  Alert,
  Badge,
  DangerButton,
  EmptyState,
  Field,
  PageHeader,
  Panel,
  SubmitButton,
  inputCls,
} from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<Promotion["status"], string> = {
  pending: "قيد المراجعة",
  approved: "معتمد",
  rejected: "مرفوض",
};

const STATUS_TONE: Record<Promotion["status"], "warning" | "success" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

function RankFields({ rank }: { rank?: Rank }) {
  return (
    <>
      {rank ? <input type="hidden" name="id" value={rank.id} /> : null}
      <div className="grid grid-cols-2 gap-2">
        <Field label="كود الرتبة">
          <input name="code" defaultValue={rank?.code ?? ""} required dir="ltr" className={inputCls} placeholder="R1" />
        </Field>
        <Field label="الترتيب">
          <input name="sort_order" type="number" defaultValue={rank?.sort_order ?? 0} className={inputCls} />
        </Field>
      </div>
      <Field label="اسم الرتبة">
        <input name="title" defaultValue={rank?.title ?? ""} required className={inputCls} />
      </Field>
      <Field label="أقل نقاط XP">
        <input name="min_xp" type="number" min={0} defaultValue={rank?.min_xp ?? 0} className={inputCls} />
      </Field>
      <SubmitButton className="!w-full">{rank ? "تحديث الرتبة" : "إضافة الرتبة"}</SubmitButton>
    </>
  );
}

export default async function AdminPromotionsPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; error?: string }>;
}) {
  const ctx = await requirePermission("promotions.read");
  const sp = await searchParams;
  const admin = createAdminClient();

  const canWrite = ctx.isSuperAdmin || hasPromotionWrite(ctx.role);

  const ranksQuery = admin.from("ranks").select("*").order("sort_order");
  const { data: ranksData } = await (ctx.isSuperAdmin
    ? ranksQuery
    : ranksQuery.eq("sector_id", ctx.sectorId!));
  const ranks = (ranksData ?? []) as Rank[];

  const promosQuery = admin.from("promotions").select("*").order("created_at", { ascending: false }).limit(60);
  const { data: promosData } = await (ctx.isSuperAdmin
    ? promosQuery
    : promosQuery.eq("sector_id", ctx.sectorId!));
  const promotions = (promosData ?? []) as Promotion[];

  const pending = promotions.filter((p) => p.status === "pending");
  const decided = promotions.filter((p) => p.status !== "pending");

  return (
    <div className="space-y-4">
      <PageHeader
        title="الترقيات والرتب"
        description="مسار الترقية: طلب → مراجعة → اعتماد. الاعتماد يمنح العضو الرتبة ويُرسل إشعارًا لطاقم القطاع."
      >
        <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold text-[#94a3b8]">
          {pending.length} طلب معلّق
        </span>
      </PageHeader>

      {sp.msg ? <Alert tone="success">{sp.msg}</Alert> : null}
      {sp.error ? <Alert tone="error">{sp.error}</Alert> : null}

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <Panel title={`طلبات الترقية المعلّقة (${pending.length})`}>
            {pending.length === 0 ? (
              <EmptyState>لا توجد طلبات ترقية معلّقة.</EmptyState>
            ) : (
              <ul className="space-y-2">
                {pending.map((p) => (
                  <li key={p.id} className="rounded-xl border border-white/[0.06] bg-[#0b0b0c] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-[11px]" dir="ltr">
                        {p.discord_id}
                      </span>
                      <Badge tone="warning">{STATUS_LABEL[p.status]}</Badge>
                    </div>
                    <p className="mt-1 text-[11px] text-[#94a3b8]">
                      {p.from_rank ? `${p.from_rank} → ` : ""}
                      <span className="font-bold text-white">{p.to_rank}</span>
                    </p>
                    {p.note ? <p className="mt-1 text-[10px] text-[#64748b]">{p.note}</p> : null}

                    {canWrite ? (
                      <form action={decidePromotion} className="mt-2 flex flex-wrap items-end gap-2">
                        <input type="hidden" name="id" value={p.id} />
                        <label className="block">
                          <span className="mb-1 block text-[10px] font-bold text-[#94a3b8]">القرار</span>
                          <select name="decision" defaultValue="approve" className={inputCls}>
                            <option value="approve">اعتماد</option>
                            <option value="reject">رفض</option>
                          </select>
                        </label>
                        <label className="block flex-1">
                          <span className="mb-1 block text-[10px] font-bold text-[#94a3b8]">ملاحظة (اختياري)</span>
                          <input name="note" className={inputCls} />
                        </label>
                        <SubmitButton className="!px-3">تنفيذ القرار</SubmitButton>
                      </form>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="سجل القرارات">
            {decided.length === 0 ? (
              <EmptyState>لا توجد قرارات سابقة.</EmptyState>
            ) : (
              <ul className="max-h-80 space-y-1.5 overflow-y-auto text-[11px]">
                {decided.map((p) => (
                  <li key={p.id} className="rounded-lg bg-white/[0.03] px-2.5 py-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-[10px]" dir="ltr">
                        {p.discord_id}
                      </span>
                      <Badge tone={STATUS_TONE[p.status]}>{STATUS_LABEL[p.status]}</Badge>
                    </div>
                    <p className="mt-0.5 text-[10px] text-[#94a3b8]">
                      {p.to_rank}
                      {p.decided_at ? ` — ${new Date(p.decided_at).toLocaleDateString("ar-SA")}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          {canWrite && ctx.sectorId ? (
            <Panel title="طلب ترقية جديد">
              <form action={requestPromotion} className="space-y-2">
                <Field label="معرّف Discord">
                  <input name="discord_id" required dir="ltr" className={inputCls} />
                </Field>
                <Field label="الرتبة الحالية (اختياري)">
                  <input name="from_rank" className={inputCls} />
                </Field>
                <Field label="الرتبة المستهدفة">
                  {ranks.length ? (
                    <select name="to_rank" className={inputCls} defaultValue={ranks[0]?.code}>
                      {ranks.map((r) => (
                        <option key={r.id} value={r.code}>
                          {r.title} ({r.code})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input name="to_rank" required className={inputCls} placeholder="أضف رتبة أولًا" />
                  )}
                </Field>
                <Field label="ملاحظة">
                  <textarea name="note" rows={2} className={inputCls} />
                </Field>
                <SubmitButton className="!w-full">تسجيل الطلب</SubmitButton>
              </form>
            </Panel>
          ) : (
            <Panel title="طلب ترقية جديد">
              <EmptyState>لا تملك صلاحية تسجيل أو اعتماد الترقيات.</EmptyState>
            </Panel>
          )}

          <Panel
            title={`سلّم الرتب (${ranks.length})`}
            description="يظهر للعامة في صفحة رتب القطاع."
          >
            {ranks.length === 0 ? (
              <EmptyState>لا توجد رتب معرّفة لهذا القطاع.</EmptyState>
            ) : (
              <ul className="space-y-2">
                {ranks.map((r) => (
                  <li key={r.id} className="rounded-xl border border-white/[0.06] bg-[#0b0b0c]">
                    <details>
                      <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2">
                        <span className="flex items-center gap-2">
                          <Badge tone="main">{r.code}</Badge>
                          <span className="text-[11px] font-bold">{r.title}</span>
                        </span>
                        <span className="text-[10px] text-[#94a3b8]">{r.min_xp} XP</span>
                      </summary>
                      <div className="space-y-2 border-t border-white/[0.06] px-3 py-3">
                        {canWrite ? (
                          <>
                            <form action={saveRank} className="space-y-2">
                              <RankFields rank={r} />
                            </form>
                            <form action={deleteRank}>
                              <input type="hidden" name="id" value={r.id} />
                              <DangerButton>حذف الرتبة</DangerButton>
                            </form>
                          </>
                        ) : (
                          <p className="text-[10px] text-[#64748b]">عرض فقط.</p>
                        )}
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {canWrite && ctx.sectorId ? (
            <Panel title="إضافة رتبة">
              <form action={saveRank} className="space-y-2">
                <RankFields />
              </form>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function hasPromotionWrite(role: string) {
  return role === "sector_admin";
}
