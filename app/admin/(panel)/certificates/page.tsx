import Link from "next/link";
import { reactivateCertificate, revokeCertificate } from "@/lib/admin/actions";
import { requirePermission } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Certificate } from "@/lib/types";
import { Alert, Badge, EmptyState, PageHeader, Panel, inputCls } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; tone: "success" | "danger" | "muted" }> = {
  valid: { label: "صالحة", tone: "success" },
  revoked: { label: "ملغاة", tone: "danger" },
  expired: { label: "منتهية", tone: "muted" },
};

export default async function AdminCertificatesPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; error?: string; status?: string; q?: string }>;
}) {
  const ctx = await requirePermission("certificates.read");
  const sp = await searchParams;
  const status = sp.status ?? "all";
  const q = (sp.q ?? "").trim();
  const admin = createAdminClient();

  let query = admin
    .from("certificates")
    .select(
      "id, certificate_no, trainee_name, discord_username, course_title, percentage, status, issued_at, expires_at, revoked_reason, pdf_url",
    );
  if (!ctx.isSuperAdmin && ctx.sectorId) query = query.eq("sector_id", ctx.sectorId);
  if (status !== "all") query = query.eq("status", status);
  if (q) query = query.or(`certificate_no.ilike.%${q}%,trainee_name.ilike.%${q}%`);

  const { data, error } = await query.order("issued_at", { ascending: false }).limit(100);
  const certificates = (data ?? []) as Certificate[];

  const canRevoke = ctx.role === "sector_admin" || ctx.isSuperAdmin;

  return (
    <div className="space-y-4">
      <PageHeader
        title="الشهادات"
        description="إلغاء الشهادة يوقف التحقق العام فورًا ويُسجّل السبب في سجل العمليات. لا يُحذف الملف من التخزين."
      />

      {sp.msg ? <Alert tone="success">{sp.msg}</Alert> : null}
      {sp.error ? <Alert tone="error">{sp.error}</Alert> : null}
      {error ? <Alert tone="error">{error.message}</Alert> : null}

      <form className="flex flex-wrap items-end gap-2 rounded-2xl border border-white/[0.06] bg-[#141416] p-3">
        <label className="min-w-[160px] flex-1">
          <span className="mb-1 block text-[10px] font-bold text-[#94a3b8]">بحث برقم الشهادة أو الاسم</span>
          <input name="q" defaultValue={q} className={inputCls} dir="ltr" placeholder="RCA-SUP-M-2026-0001" />
        </label>
        <label>
          <span className="mb-1 block text-[10px] font-bold text-[#94a3b8]">الحالة</span>
          <select name="status" defaultValue={status} className={inputCls}>
            <option value="all">الكل</option>
            <option value="valid">صالحة</option>
            <option value="revoked">ملغاة</option>
            <option value="expired">منتهية</option>
          </select>
        </label>
        <button type="submit" className="btn btn-primary !px-4 !py-2 text-xs">
          تطبيق
        </button>
      </form>

      <Panel title={`الشهادات (${certificates.length})`}>
        {certificates.length === 0 ? (
          <EmptyState>لا توجد شهادات مطابقة.</EmptyState>
        ) : (
          <ul className="space-y-2">
            {certificates.map((cert) => {
              const meta = STATUS[cert.status] ?? STATUS.valid;
              return (
                <li key={cert.id} className="rounded-xl border border-white/[0.06] bg-[#0b0b0c] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/verify/${cert.certificate_no}`}
                          className="text-[11px] font-bold text-[var(--sector-main)] hover:underline"
                          dir="ltr"
                        >
                          {cert.certificate_no}
                        </Link>
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                        <span className="text-[10px] text-[#94a3b8]">{cert.percentage}%</span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-[#94a3b8]">
                        {cert.trainee_name} · {cert.course_title}
                      </p>
                      <p className="text-[10px] text-[#475569]" dir="ltr">
                        {cert.discord_username} ·{" "}
                        {new Date(cert.issued_at).toLocaleDateString("ar-SA")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {cert.pdf_url ? (
                        <a
                          href={cert.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-bold text-[#cbd5e1] hover:bg-white/5"
                        >
                          PDF ↗
                        </a>
                      ) : null}
                      {canRevoke ? (
                        <details className="relative">
                          <summary
                            className={`cursor-pointer rounded-lg border px-2 py-1 text-[10px] font-bold ${
                              cert.status === "revoked"
                                ? "border-emerald-500/30 text-emerald-300"
                                : "border-red-500/30 text-red-300"
                            }`}
                          >
                            {cert.status === "revoked" ? "إعادة تفعيل" : "إلغاء"}
                          </summary>
                          <div className="mt-2 w-64 rounded-xl border border-white/10 bg-[#141416] p-3">
                            {cert.status === "revoked" ? (
                              <form action={reactivateCertificate} className="space-y-2">
                                <input type="hidden" name="id" value={cert.id} />
                                <p className="text-[10px] text-[#94a3b8]">
                                  السبب المسجّل: {cert.revoked_reason ?? "—"}
                                </p>
                                <button type="submit" className="btn btn-primary !w-full !py-1.5 text-[10px]">
                                  تأكيد إعادة التفعيل
                                </button>
                              </form>
                            ) : (
                              <form action={revokeCertificate} className="space-y-2">
                                <input type="hidden" name="id" value={cert.id} />
                                <label className="block">
                                  <span className="mb-1 block text-[10px] font-bold text-[#94a3b8]">
                                    سبب الإلغاء (إلزامي)
                                  </span>
                                  <textarea
                                    name="reason"
                                    rows={2}
                                    required
                                    minLength={5}
                                    className={inputCls}
                                  />
                                </label>
                                <button
                                  type="submit"
                                  className="w-full rounded-lg border border-red-500/40 py-1.5 text-[10px] font-bold text-red-300 hover:bg-red-500/10"
                                >
                                  تأكيد الإلغاء
                                </button>
                              </form>
                            )}
                          </div>
                        </details>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
