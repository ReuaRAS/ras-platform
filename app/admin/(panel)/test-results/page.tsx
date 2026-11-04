import Link from "next/link";
import { reviewAttempt } from "@/lib/admin/actions";
import { requirePermission } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TestAttempt } from "@/lib/types";
import { Alert, Badge, EmptyState, PageHeader, Panel, inputCls } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "all", label: "الكل" },
  { value: "passed", label: "الناجحون" },
  { value: "failed", label: "الراسبون" },
  { value: "suspicious", label: "المشبوهة" },
] as const;

export default async function AdminTestResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; error?: string; filter?: string; q?: string }>;
}) {
  const ctx = await requirePermission("results.read");
  const sp = await searchParams;
  const filter = (sp.filter ?? "all") as (typeof FILTERS)[number]["value"];
  const q = (sp.q ?? "").trim();
  const admin = createAdminClient();

  let query = admin
    .from("test_attempts")
    .select(
      "id, trainee_name, discord_username, discord_id, test_type, score, total_points, percentage, passed, suspicion_flags, is_practice, started_at, submitted_at",
    );

  if (!ctx.isSuperAdmin && ctx.sectorId) query = query.eq("sector_id", ctx.sectorId);
  if (filter === "passed") query = query.eq("passed", true);
  if (filter === "failed") query = query.eq("passed", false);
  if (q) query = query.or(`trainee_name.ilike.%${q}%,discord_username.ilike.%${q}%`);

  const { data, error } = await query.order("started_at", { ascending: false }).limit(100);
  let attempts = (data ?? []) as TestAttempt[];
  if (filter === "suspicious") {
    attempts = attempts.filter((a) => (a.suspicion_flags?.length ?? 0) >= 3);
  }

  const attemptIds = attempts.map((a) => a.id);
  const { data: certsData } = await admin
    .from("certificates")
    .select("certificate_no, test_attempt_id, status")
    .in("test_attempt_id", attemptIds.length ? attemptIds : ["00000000-0000-0000-0000-000000000000"]);
  const certMap = new Map(
    ((certsData ?? []) as { certificate_no: string; test_attempt_id: string; status: string }[]).map(
      (c) => [c.test_attempt_id, c],
    ),
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="نتائج الاختبارات"
        description="التحذيرات تُسجّل عند ترك الصفحة أثناء الاختبار أو محاولة النسخ. 3 تحذيرات أو أكثر = مراجعة يدوية قبل اعتماد الشهادة."
      />

      {sp.msg ? <Alert tone="success">{sp.msg}</Alert> : null}
      {sp.error ? <Alert tone="error">{sp.error}</Alert> : null}
      {error ? <Alert tone="error">{error.message}</Alert> : null}

      <form className="flex flex-wrap items-end gap-2 rounded-2xl border border-white/[0.06] bg-[#141416] p-3">
        <label className="min-w-[160px] flex-1">
          <span className="mb-1 block text-[10px] font-bold text-[#94a3b8]">بحث بالاسم أو ديسكورد</span>
          <input name="q" defaultValue={q} className={inputCls} placeholder="اسم المتدرب / username" />
        </label>
        <label>
          <span className="mb-1 block text-[10px] font-bold text-[#94a3b8]">التصفية</span>
          <select name="filter" defaultValue={filter} className={inputCls}>
            {FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn-primary !px-4 !py-2 text-xs">
          تطبيق
        </button>
      </form>

      <Panel title={`المحاولات (${attempts.length})`}>
        {attempts.length === 0 ? (
          <EmptyState>لا توجد نتائج مطابقة.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-right text-[11px]">
              <thead className="text-[10px] text-[#94a3b8]">
                <tr>
                  <th className="pb-2 font-bold">المتدرّب</th>
                  <th className="pb-2 font-bold">ديسكورد</th>
                  <th className="pb-2 font-bold">النوع</th>
                  <th className="pb-2 font-bold">الدرجة</th>
                  <th className="pb-2 font-bold">الحالة</th>
                  <th className="pb-2 font-bold">التحذيرات</th>
                  <th className="pb-2 font-bold">الشهادة</th>
                  <th className="pb-2 font-bold">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt) => {
                  const flags = Array.isArray(attempt.suspicion_flags)
                    ? attempt.suspicion_flags.length
                    : 0;
                  const cert = certMap.get(attempt.id);
                  const suspicious = flags >= 3;
                  return (
                    <tr key={attempt.id} className="border-t border-white/[0.06] align-top">
                      <td className="py-2">
                        <p className="font-bold">{attempt.trainee_name}</p>
                        <p className="text-[10px] text-[#64748b]">
                          {new Date(attempt.started_at).toLocaleString("ar-SA", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </p>
                      </td>
                      <td className="py-2 text-[10px] text-[#94a3b8]" dir="ltr">
                        {attempt.discord_username}
                        <br />
                        <span className="text-[#475569]">{attempt.discord_id}</span>
                      </td>
                      <td className="py-2 text-[10px]">
                        {attempt.test_type === "recruitment" ? "توظيف" : "دورة"}
                      </td>
                      <td className="py-2">
                        <p className="font-bold">{Math.round(attempt.percentage)}%</p>
                        <p className="text-[10px] text-[#64748b]">
                          {attempt.score}/{attempt.total_points}
                        </p>
                      </td>
                      <td className="py-2">
                        {attempt.is_practice ? (
                          <Badge tone="muted">تجريبي</Badge>
                        ) : attempt.passed ? (
                          <Badge tone="success">ناجح</Badge>
                        ) : (
                          <Badge tone="danger">راسب</Badge>
                        )}
                      </td>
                      <td className="py-2">
                        {suspicious ? (
                          <Badge tone="warning">{flags} مشبوه</Badge>
                        ) : (
                          <span className="text-[10px] text-[#64748b]">{flags}</span>
                        )}
                      </td>
                      <td className="py-2">
                        {cert ? (
                          <Link
                            href={`/verify/${cert.certificate_no}`}
                            className="text-[10px] font-bold text-[var(--sector-main)] hover:underline"
                            dir="ltr"
                          >
                            {cert.certificate_no}
                          </Link>
                        ) : (
                          <span className="text-[10px] text-[#475569]">—</span>
                        )}
                      </td>
                      <td className="py-2">
                        {suspicious ? (
                          <div className="flex gap-1">
                            <form action={reviewAttempt}>
                              <input type="hidden" name="id" value={attempt.id} />
                              <input type="hidden" name="decision" value="accept" />
                              <button
                                type="submit"
                                className="rounded-lg border border-emerald-500/30 px-2 py-1 text-[10px] font-bold text-emerald-300 hover:bg-emerald-500/10"
                              >
                                اعتماد
                              </button>
                            </form>
                            <form action={reviewAttempt}>
                              <input type="hidden" name="id" value={attempt.id} />
                              <input type="hidden" name="decision" value="reject" />
                              <button
                                type="submit"
                                className="rounded-lg border border-red-500/30 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/10"
                              >
                                رفض
                              </button>
                            </form>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#475569]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
