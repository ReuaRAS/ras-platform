import {
  markAllNotificationsRead,
  markNotificationRead,
  sendNotification,
} from "@/lib/admin/actions-store";
import { requireStaff } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import type { NotificationRow, Sector } from "@/lib/types";
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

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; error?: string }>;
}) {
  const ctx = await requireStaff();
  const sp = await searchParams;
  const admin = createAdminClient();
  const canSend = ctx.isSuperAdmin || hasPermission(ctx.role, "notifications.write");

  const { data: mineData } = await admin
    .from("notifications")
    .select("*")
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false })
    .limit(50);
  const mine = (mineData ?? []) as NotificationRow[];

  const { data: sectorsData } = await admin.from("sectors").select("id, name, sector_code").order("name");
  const sectors = (sectorsData ?? []) as Pick<Sector, "id" | "name" | "sector_code">[];

  const unread = mine.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-4">
      <PageHeader
        title="الإشعارات"
        description="إشعارات داخل المنصة لكل طاقم قطاع. تُنشأ يدويًا من هنا، أو تلقائيًا من الأحداث (شهادة، ترقية، تسليم طلب)."
      >
        <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold text-[#94a3b8]">
          {unread} غير مقروء
        </span>
      </PageHeader>

      {sp.msg ? <Alert tone="success">{sp.msg}</Alert> : null}
      {sp.error ? <Alert tone="error">{sp.error}</Alert> : null}

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Panel
          title={`إشعاراتي (${mine.length})`}
          description="لكل مستخدم إشعاراته الخاصة؛ لا يرى أحد إشعارات غيره."
        >
          {mine.length === 0 ? (
            <EmptyState>لا توجد إشعارات لك حتى الآن.</EmptyState>
          ) : (
            <>
              <form action={markAllNotificationsRead} className="mb-2">
                <input type="hidden" name="redirect_to" value="/admin/notifications" />
                <button
                  type="submit"
                  className="rounded-lg border border-white/10 px-2.5 py-1 text-[10px] font-bold text-[#94a3b8] hover:bg-white/5"
                >
                  تحديد الكل كمقروء
                </button>
              </form>
              <ul className="max-h-[26rem] space-y-1.5 overflow-y-auto">
                {mine.map((n) => (
                  <li
                    key={n.id}
                    className={`rounded-xl border px-3 py-2 ${
                      n.is_read
                        ? "border-white/[0.06] bg-[#0b0b0c]"
                        : "border-[color-mix(in_srgb,var(--sector-main)_40%,transparent)] bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold">{n.title}</p>
                        {n.body ? (
                          <p className="mt-0.5 text-[10px] leading-relaxed text-[#94a3b8]">{n.body}</p>
                        ) : null}
                      </div>
                      {!n.is_read ? <Badge tone="main">جديد</Badge> : null}
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-[#64748b]">
                        {new Date(n.created_at).toLocaleString("ar-SA", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                      <div className="flex items-center gap-2">
                        {n.href ? (
                          <a href={n.href} className="text-[10px] font-bold text-[var(--sector-light)]">
                            فتح
                          </a>
                        ) : null}
                        {!n.is_read ? (
                          <form action={markNotificationRead}>
                            <input type="hidden" name="id" value={n.id} />
                            <input type="hidden" name="redirect_to" value="/admin/notifications" />
                            <button
                              type="submit"
                              className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] font-bold text-[#94a3b8] hover:bg-white/5"
                            >
                              مقروء
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>

        {canSend ? (
          <Panel title="إرسال إشعار" description="يُرسل لكل حسابات الطاقم في القطاع المحدد.">
            <form action={sendNotification} className="space-y-2">
              <Field label="القطاع المستهدف">
                <select name="sector_id" defaultValue={ctx.sectorId ?? "__all__"} className={inputCls}>
                  {ctx.sectorId ? null : <option value="__all__">كل القطاعات</option>}
                  {sectors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.sector_code})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="العنوان">
                <input name="title" required minLength={3} className={inputCls} />
              </Field>
              <Field label="النص (اختياري)">
                <textarea name="body" rows={3} className={inputCls} />
              </Field>
              <Field label="الرابط (اختياري)" hint="مثال: /admin/promotions">
                <input name="href" dir="ltr" className={inputCls} placeholder="/admin/tests" />
              </Field>
              <SubmitButton className="!w-full">إرسال</SubmitButton>
            </form>
          </Panel>
        ) : (
          <Panel title="إرسال إشعار">
            <EmptyState>لا تملك صلاحية إرسال الإشعارات.</EmptyState>
          </Panel>
        )}
      </div>
    </div>
  );
}
