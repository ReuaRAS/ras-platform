import Link from "next/link";
import { clearAttendance, markAttendance } from "@/lib/admin/actions-members";
import { requirePermission } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AttendanceRecord, AttendanceStatus, MemberXp, Sector } from "@/lib/types";
import {
  Alert,
  EmptyState,
  Field,
  PageHeader,
  Panel,
  SubmitButton,
  inputCls,
} from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: "حاضر",
  late: "متأخر",
  absent: "غائب",
  excused: "بعذر",
};

const STATUS_CELL: Record<AttendanceStatus, { text: string; cls: string }> = {
  present: { text: "ح", cls: "bg-emerald-500/20 text-emerald-300" },
  late: { text: "ت", cls: "bg-amber-500/20 text-amber-300" },
  absent: { text: "غ", cls: "bg-red-500/20 text-red-300" },
  excused: { text: "ع", cls: "bg-sky-500/20 text-sky-300" },
};

function monthBounds(month: string) {
  const [y, m] = month.split("-").map(Number);
  const days = new Date(y, m, 0).getDate();
  return { days, start: `${month}-01`, end: `${month}-${String(days).padStart(2, "0")}` };
}

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; error?: string; month?: string; sector?: string }>;
}) {
  const ctx = await requirePermission("attendance.read");
  const sp = await searchParams;
  const admin = createAdminClient();

  const { data: sectorsData } = await admin.from("sectors").select("id, name, sector_code").order("name");
  const sectors = (sectorsData ?? []) as Pick<Sector, "id" | "name" | "sector_code">[];

  const targetSectorId = ctx.sectorId ?? sp.sector ?? sectors[0]?.id ?? null;
  const targetSector = sectors.find((s) => s.id === targetSectorId) ?? null;

  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(sp.month ?? "")
    ? (sp.month as string)
    : new Date().toISOString().slice(0, 7);
  const { days, start, end } = monthBounds(month);

  const [{ data: xpData }, { data: attData }] = await Promise.all([
    admin
      .from("member_xp")
      .select("discord_id")
      .eq("sector_id", targetSectorId ?? "")
      .limit(300),
    admin
      .from("attendance_records")
      .select("*")
      .eq("sector_id", targetSectorId ?? "")
      .gte("attendance_date", start)
      .lte("attendance_date", end),
  ]);

  const records = (attData ?? []) as AttendanceRecord[];
  const roster = Array.from(
    new Set([
      ...((xpData ?? []) as Pick<MemberXp, "discord_id">[]).map((m) => m.discord_id),
      ...records.map((r) => r.discord_id),
    ]),
  ).sort();

  const cellKey = (discordId: string, date: string) => `${discordId}|${date}`;
  const byCell = new Map<string, AttendanceRecord>();
  for (const r of records) byCell.set(cellKey(r.discord_id, r.attendance_date), r);

  const dayList = Array.from({ length: days }, (_, i) => String(i + 1).padStart(2, "0"));
  const canWrite = ctx.isSuperAdmin || ["sector_admin", "sector_vice", "sector_trainer"].includes(ctx.role);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <PageHeader
        title="الحضور والانصراف"
        description="شبكة شهرية (عضو × يوم). الخلايا الملوّنة تعرض الحالة المسجّلة، والتسجيل يتم من النموذج أو تلقائيًا من Discord في المرحلة 12."
      >
        <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold text-[#94a3b8]">
          {records.length} سجل
        </span>
      </PageHeader>

      {sp.msg ? <Alert tone="success">{sp.msg}</Alert> : null}
      {sp.error ? <Alert tone="error">{sp.error}</Alert> : null}

      <form className="flex flex-wrap items-end gap-2" method="get">
        <Field label="الشهر">
          <input type="month" name="month" defaultValue={month} className={inputCls} />
        </Field>
        {ctx.isSuperAdmin ? (
          <Field label="القطاع">
            <select name="sector" defaultValue={targetSectorId ?? ""} className={inputCls}>
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.sector_code})
                </option>
              ))}
            </select>
          </Field>
        ) : null}
        <SubmitButton className="!px-4">تحديث العرض</SubmitButton>
        <Link
          href={`/api/admin/attendance/export?month=${month}${targetSectorId ? `&sector=${targetSectorId}` : ""}`}
          className="rounded-lg border border-white/10 px-3 py-2 text-[11px] font-bold text-[#94a3b8] hover:bg-white/5"
        >
          تصدير CSV
        </Link>
      </form>

      <Panel
        title={`شبكة الحضور — ${targetSector?.name ?? "—"} / ${month}`}
        description="ح = حاضر · ت = متأخر · غ = غائب · ع = بعذر"
      >
        {roster.length === 0 ? (
          <EmptyState>
            لا يوجد أعضاء في هذا القطاع بعد. يظهر العضو عند إضافة نقاط له أو عند تسجيل حضوره.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-center text-[10px]">
              <thead>
                <tr className="text-[#94a3b8]">
                  <th className="sticky right-0 z-10 bg-[#141416] px-2 py-1 text-right font-bold">العضو</th>
                  {dayList.map((d) => (
                    <th key={d} className="px-1 py-1 font-bold">
                      {Number(d)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roster.map((discordId) => (
                  <tr key={discordId} className="border-t border-white/[0.06]">
                    <td
                      className="sticky right-0 z-10 max-w-[140px] truncate bg-[#141416] px-2 py-1 text-right font-mono text-[9px]"
                      dir="ltr"
                    >
                      {discordId}
                    </td>
                    {dayList.map((d) => {
                      const date = `${month}-${d}`;
                      const rec = byCell.get(cellKey(discordId, date));
                      return (
                        <td key={d} className="px-0.5 py-0.5">
                          {rec ? (
                            <span
                              title={`${STATUS_LABEL[rec.status]}${rec.note ? ` — ${rec.note}` : ""}`}
                              className={`inline-flex h-5 w-5 items-center justify-center rounded font-bold ${STATUS_CELL[rec.status].cls}`}
                            >
                              {STATUS_CELL[rec.status].text}
                            </span>
                          ) : (
                            <span className="inline-block h-5 w-5 rounded bg-white/[0.02]" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        {canWrite && targetSectorId ? (
          <Panel title="تسجيل حضور">
            <form action={markAttendance} className="grid gap-2 sm:grid-cols-2">
              <input type="hidden" name="sector_id" value={targetSectorId} />
              <Field label="معرّف Discord">
                <input name="discord_id" required dir="ltr" list="roster" className={inputCls} />
              </Field>
              <datalist id="roster">
                {roster.map((id) => (
                  <option key={id} value={id} />
                ))}
              </datalist>
              <Field label="التاريخ">
                <input type="date" name="date" required defaultValue={today} className={inputCls} />
              </Field>
              <Field label="الحالة">
                <select name="status" defaultValue="present" className={inputCls}>
                  {(Object.keys(STATUS_LABEL) as AttendanceStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="ملاحظة (اختياري)">
                  <input name="note" className={inputCls} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <SubmitButton className="!w-full">تسجيل / تحديث</SubmitButton>
              </div>
              <p className="sm:col-span-2 text-[10px] leading-relaxed text-[#64748b]">
                تسجيل اليوم نفسه مرتين يُحدّث الحالة بدل إنشاء سجل مكرر.
              </p>
            </form>
          </Panel>
        ) : (
          <Panel title="تسجيل حضور">
            <EmptyState>لا تملك صلاحية تسجيل الحضور لهذا القطاع.</EmptyState>
          </Panel>
        )}

        <Panel title="آخر السجلات" description="يمكن حذف السجل الخاطئ ثم إعادة تسجيله.">
          {records.length === 0 ? (
            <EmptyState>لا توجد سجلات في هذا الشهر.</EmptyState>
          ) : (
            <ul className="max-h-72 space-y-1 overflow-y-auto text-[11px]">
              {[...records]
                .sort((a, b) => (a.attendance_date < b.attendance_date ? 1 : -1))
                .slice(0, 40)
                .map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.03] px-2 py-1"
                  >
                    <span className="font-mono text-[10px]" dir="ltr">
                      {r.discord_id}
                    </span>
                    <span className="text-[#94a3b8]">{r.attendance_date}</span>
                    <span className="font-bold">{STATUS_LABEL[r.status]}</span>
                    {canWrite ? (
                      <form action={clearAttendance}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="sector_id" value={targetSectorId ?? ""} />
                        <button
                          type="submit"
                          className="rounded border border-red-500/30 px-1.5 py-0.5 text-[10px] font-bold text-red-300 hover:bg-red-500/10"
                        >
                          حذف
                        </button>
                      </form>
                    ) : null}
                  </li>
                ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
