import { adjustXp } from "@/lib/admin/actions-members";
import { requirePermission } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MemberXp, Sector, XpEvent, XpLevel } from "@/lib/types";
import {
  Alert,
  Badge,
  EmptyState,
  Field,
  PageHeader,
  Panel,
  SubmitButton,
  inputCls,
} from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; error?: string }>;
}) {
  const ctx = await requirePermission("members.read");
  const sp = await searchParams;
  const admin = createAdminClient();

  const base = admin
    .from("member_xp")
    .select("*")
    .order("total_xp", { ascending: false })
    .limit(200);
  const { data } = await (ctx.isSuperAdmin ? base : base.eq("sector_id", ctx.sectorId!));
  const members = (data ?? []) as MemberXp[];

  const { data: levelsData } = await admin.from("xp_levels").select("*").order("min_xp");
  const levels = (levelsData ?? []) as XpLevel[];

  const { data: eventsData } = await admin
    .from("xp_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(12);
  const events = (eventsData ?? []) as XpEvent[];

  const { data: sectorsData } = await admin.from("sectors").select("id, name");
  const sectors = (sectorsData ?? []) as Pick<Sector, "id" | "name">[];
  const sectorName = (id: string | null) => sectors.find((s) => s.id === id)?.name ?? "—";
  const levelTitle = (level: number) => levels.find((l) => l.level === level)?.title ?? `مستوى ${level}`;

  const canWrite = ctx.isSuperAdmin || ["sector_admin", "sector_vice"].includes(ctx.role);

  return (
    <div className="space-y-4">
      <PageHeader
        title="الأعضاء والنقاط (XP)"
        description="رصيد النقاط والمستوى لكل عضو. النقاط تُضاف تلقائيًا عند إصدار شهادة، ويمكن تعديلها يدويًا بسبب إلزامي يُسجَّل في سجل العمليات."
      >
        <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold text-[#94a3b8]">
          {members.length} عضو
        </span>
      </PageHeader>

      {sp.msg ? <Alert tone="success">{sp.msg}</Alert> : null}
      {sp.error ? <Alert tone="error">{sp.error}</Alert> : null}

      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <Panel title="ترتيب الأعضاء">
          {members.length === 0 ? (
            <EmptyState>
              لا يوجد أعضاء بعد. يظهر العضو تلقائيًا عند إصدار أول شهادة له، أو بإضافة نقاط يدويًا.
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-[11px]">
                <thead className="text-[#94a3b8]">
                  <tr>
                    <th className="px-2 py-2 font-bold">#</th>
                    <th className="px-2 py-2 font-bold">العضو</th>
                    <th className="px-2 py-2 font-bold">القطاع</th>
                    <th className="px-2 py-2 font-bold">النقاط</th>
                    <th className="px-2 py-2 font-bold">المستوى</th>
                    <th className="px-2 py-2 font-bold">آخر تحديث</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m, i) => (
                    <tr key={m.id} className="border-t border-white/[0.06]">
                      <td className="px-2 py-2 text-[#64748b]">{i + 1}</td>
                      <td className="px-2 py-2 font-mono text-[10px]" dir="ltr">
                        {m.discord_id}
                      </td>
                      <td className="px-2 py-2 text-[#94a3b8]">{sectorName(m.sector_id)}</td>
                      <td className="px-2 py-2 font-extrabold">{m.total_xp}</td>
                      <td className="px-2 py-2">
                        <Badge tone="main">{levelTitle(m.level)}</Badge>
                      </td>
                      <td className="px-2 py-2 text-[10px] text-[#64748b]">
                        {new Date(m.updated_at).toLocaleDateString("ar-SA")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <div className="space-y-4">
          {canWrite && ctx.sectorId ? (
            <Panel
              title="تعديل نقاط عضو"
              description="أدخل قيمة موجبة للإضافة أو سالبة للخصم. السبب إلزامي ويُسجَّل في سجل العمليات."
            >
              <form action={adjustXp} className="space-y-2">
                <Field label="معرّف Discord">
                  <input
                    name="discord_id"
                    required
                    dir="ltr"
                    className={inputCls}
                    placeholder="123456789012345678"
                  />
                </Field>
                <Field label="عدد النقاط (سالب للخصم)">
                  <input name="amount" type="number" required className={inputCls} placeholder="-100" />
                </Field>
                <Field label="السبب">
                  <input name="reason" required minLength={3} className={inputCls} placeholder="مكافأة مهمة ميدانية" />
                </Field>
                <SubmitButton className="!w-full">تنفيذ التعديل</SubmitButton>
              </form>
            </Panel>
          ) : (
            <Panel title="تعديل النقاط">
              <EmptyState>لا تملك صلاحية تعديل النقاط، أو أن حسابك غير مرتبط بقطاع.</EmptyState>
            </Panel>
          )}

          <Panel title="سلّم المستويات">
            <ul className="space-y-1.5 text-[11px]">
              {levels.map((l) => (
                <li key={l.level} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-2.5 py-1.5">
                  <span className="font-bold">{l.title}</span>
                  <span className="text-[10px] text-[#94a3b8]">{l.min_xp} نقطة</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <Panel title="أحدث حركات النقاط">
        {events.length === 0 ? (
          <EmptyState>لا توجد حركات مسجّلة بعد.</EmptyState>
        ) : (
          <ul className="space-y-1.5 text-[11px]">
            {events.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/[0.03] px-2.5 py-1.5"
              >
                <span className="font-mono text-[10px]" dir="ltr">
                  {e.discord_id}
                </span>
                <span className={e.amount >= 0 ? "font-bold text-emerald-300" : "font-bold text-red-300"}>
                  {e.amount >= 0 ? `+${e.amount}` : e.amount}
                </span>
                <span className="text-[#94a3b8]">{e.reason ?? "—"}</span>
                <span className="text-[10px] text-[#64748b]">
                  {new Date(e.created_at).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
