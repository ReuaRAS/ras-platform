import { requirePermission } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { Alert, Badge, EmptyState, PageHeader, Panel, inputCls } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

type AuditRow = {
  id: string;
  actor_id: string | null;
  sector_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; error?: string }>;
}) {
  const ctx = await requirePermission("audit.read");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const admin = createAdminClient();

  let query = admin
    .from("audit_logs")
    .select("id, actor_id, sector_id, action, entity_type, entity_id, metadata, ip_address, user_agent, created_at");

  if (!ctx.isSuperAdmin && ctx.sectorId) query = query.eq("sector_id", ctx.sectorId);
  if (q) query = query.ilike("action", `%${q}%`);

  const { data, error } = await query.order("created_at", { ascending: false }).limit(150);
  const rows = (data ?? []) as AuditRow[];

  return (
    <div className="space-y-4">
      <PageHeader
        title="سجل العمليات"
        description="كل تعديل إداري يُسجّل هنا: من فعله، على أي كيان، ومتى. السجل للقراءة فقط ولا يُحذف من اللوحة."
      />

      {error ? <Alert tone="error">{error.message}</Alert> : null}
      {sp.error ? <Alert tone="error">{sp.error}</Alert> : null}
      {!ctx.isSuperAdmin ? (
        <Alert tone="info">السجل الكامل متاح للمدير العام فقط؛ القطاعات ترى سجل قطاعها.</Alert>
      ) : null}

      <form className="flex flex-wrap items-end gap-2 rounded-2xl border border-white/[0.06] bg-[#141416] p-3">
        <label className="min-w-[180px] flex-1">
          <span className="mb-1 block text-[10px] font-bold text-[#94a3b8]">تصفية بالإجراء</span>
          <input name="q" defaultValue={q} className={inputCls} dir="ltr" placeholder="certificate.revoke" />
        </label>
        <button type="submit" className="btn btn-primary !px-4 !py-2 text-xs">
          تصفية
        </button>
      </form>

      <Panel title={`أحدث ${rows.length} عملية`}>
        {rows.length === 0 ? (
          <EmptyState>لا توجد عمليات مسجّلة بعد.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-right text-[11px]">
              <thead className="text-[10px] text-[#94a3b8]">
                <tr>
                  <th className="pb-2 font-bold">التاريخ</th>
                  <th className="pb-2 font-bold">الإجراء</th>
                  <th className="pb-2 font-bold">الكيان</th>
                  <th className="pb-2 font-bold">المستخدم</th>
                  <th className="pb-2 font-bold">تفاصيل</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-white/[0.06] align-top">
                    <td className="py-2 text-[10px] text-[#94a3b8]">
                      {new Date(row.created_at).toLocaleString("ar-SA", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="py-2">
                      <Badge tone="main">{row.action}</Badge>
                    </td>
                    <td className="py-2 text-[10px] text-[#cbd5e1]">
                      {row.entity_type}
                      {row.entity_id ? (
                        <span className="block text-[9px] text-[#475569]" dir="ltr">
                          {row.entity_id}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2 text-[9px] text-[#64748b]" dir="ltr">
                      {row.actor_id ? row.actor_id.slice(0, 8) : "system"}
                    </td>
                    <td className="py-2 text-[9px] text-[#64748b]">
                      {row.metadata && Object.keys(row.metadata).length ? (
                        <code dir="ltr" className="block max-w-[280px] truncate">
                          {JSON.stringify(row.metadata)}
                        </code>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
