import { deleteReward, saveReward } from "@/lib/admin/actions";
import { requirePermission } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Reward } from "@/lib/types";
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

function RewardFields({ reward }: { reward?: Reward }) {
  return (
    <>
      {reward ? <input type="hidden" name="id" value={reward.id} /> : null}
      <Field label="كود المكافأة">
        <input
          name="reward_code"
          defaultValue={reward?.reward_code ?? ""}
          required
          className={inputCls}
          placeholder="RW-01"
        />
      </Field>
      <Field label="العنوان">
        <input name="title" defaultValue={reward?.title ?? ""} required className={inputCls} />
      </Field>
      <Field label="قيمة المكافأة">
        <input
          name="reward_value"
          defaultValue={reward?.reward_value ?? ""}
          required
          className={inputCls}
        />
      </Field>
      <Field label="الشروط (اختياري)">
        <textarea name="conditions" defaultValue={reward?.conditions ?? ""} rows={2} className={inputCls} />
      </Field>
      <Field label="الترتيب">
        <input
          name="sort_order"
          type="number"
          min={0}
          defaultValue={reward?.sort_order ?? 0}
          className={inputCls}
        />
      </Field>
      <SubmitButton className="!w-full">{reward ? "تحديث المكافأة" : "إضافة المكافأة"}</SubmitButton>
    </>
  );
}

export default async function AdminRewardsPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; error?: string }>;
}) {
  const ctx = await requirePermission("rewards.write");
  const sp = await searchParams;
  const admin = createAdminClient();

  const base = admin.from("sector_rewards").select("*");
  const { data } = await (ctx.isSuperAdmin ? base : base.eq("sector_id", ctx.sectorId!)).order(
    "sort_order",
  );
  const rewards = (data ?? []) as Reward[];

  return (
    <div className="space-y-4">
      <PageHeader
        title="المكافآت"
        description="تُعرض في صفحة المكافآت العامة. اكتب الشروط بوضوح لأنها مرجع للمدربين."
      >
        <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold text-[#94a3b8]">
          {rewards.length} مكافأة
        </span>
      </PageHeader>

      {sp.msg ? <Alert tone="success">{sp.msg}</Alert> : null}
      {sp.error ? <Alert tone="error">{sp.error}</Alert> : null}

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="القائمة">
          {rewards.length === 0 ? (
            <EmptyState>لا توجد مكافآت بعد.</EmptyState>
          ) : (
            <ul className="space-y-2">
              {rewards.map((reward) => (
                <li key={reward.id} className="rounded-xl border border-white/[0.06] bg-[#0b0b0c]">
                  <details>
                    <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2">
                      <span className="flex min-w-0 items-center gap-2">
                        <Badge tone="main">{reward.reward_code}</Badge>
                        <span className="truncate text-[11px] font-bold">{reward.title}</span>
                      </span>
                      <span className="shrink-0 text-[10px] text-[#94a3b8]">
                        {reward.reward_value}
                      </span>
                    </summary>
                    <div className="space-y-2 border-t border-white/[0.06] px-3 py-3">
                      {reward.conditions ? (
                        <p className="text-[10px] leading-relaxed text-[#94a3b8]">
                          {reward.conditions}
                        </p>
                      ) : null}
                      <form action={saveReward} className="space-y-2">
                        <RewardFields reward={reward} />
                      </form>
                      <form action={deleteReward}>
                        <input type="hidden" name="id" value={reward.id} />
                        <DangerButton>حذف نهائي</DangerButton>
                      </form>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="xl:sticky xl:top-4 xl:self-start">
          <Panel title="إضافة مكافأة">
            {ctx.sectorId ? (
              <form action={saveReward} className="space-y-2">
                <RewardFields />
              </form>
            ) : (
              <EmptyState>هذا الحساب غير مرتبط بقطاع.</EmptyState>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
