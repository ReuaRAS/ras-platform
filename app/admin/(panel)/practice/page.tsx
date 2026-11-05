import { requirePermission } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { Alert, Badge, EmptyState, PageHeader, Panel } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

/** سقف المحاولات المحلَّلة في الصفحة (يكفي للإحصاء الشهري بلا تحميل القاعدة كاملة) */
const WINDOW = 2000;

type Row = {
  id: string;
  test_id: string | null;
  sector_id: string | null;
  percentage: number | string | null;
  score: number | null;
  submitted_at: string;
  tests: { title: string; pass_score: number | null } | null;
  sectors: { name: string; slug: string } | null;
};

type Group = {
  key: string;
  label: string;
  attempts: number;
  avg: number;
  best: number;
  passed: number;
  last: string;
};

function toNumber(value: number | string | null | undefined) {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function buildGroups(
  rows: Row[],
  keyOf: (row: Row) => { key: string; label: string } | null,
  passOf?: (row: Row) => number,
): Group[] {
  const map = new Map<string, Group>();

  for (const row of rows) {
    const target = keyOf(row);
    if (!target) continue;
    const pct = toNumber(row.percentage);
    const current =
      map.get(target.key) ??
      ({
        key: target.key,
        label: target.label,
        attempts: 0,
        avg: 0,
        best: 0,
        passed: 0,
        last: row.submitted_at,
      } satisfies Group);

    current.attempts += 1;
    current.avg += pct;
    current.best = Math.max(current.best, pct);
    if (pct >= (passOf ? passOf(row) : 70)) current.passed += 1;
    if (new Date(row.submitted_at) > new Date(current.last)) current.last = row.submitted_at;

    map.set(target.key, current);
  }

  return [...map.values()]
    .map((g) => ({ ...g, avg: Math.round((g.avg / g.attempts) * 10) / 10 }))
    .sort((a, b) => b.attempts - a.attempts);
}

function fmt(date: string) {
  return new Date(date).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" });
}

export default async function AdminPracticeStatsPage() {
  const ctx = await requirePermission("results.read");
  const admin = createAdminClient();

  let query = admin
    .from("practice_attempts")
    .select(
      "id, test_id, sector_id, percentage, score, submitted_at, tests(title, pass_score), sectors(name, slug)",
    );

  if (!ctx.isSuperAdmin && ctx.sectorId) query = query.eq("sector_id", ctx.sectorId);

  const { data, error } = await query.order("submitted_at", { ascending: false }).limit(WINDOW);
  const rows = (data ?? []) as unknown as Row[];

  const totals = {
    attempts: rows.length,
    avg:
      rows.length > 0
        ? Math.round((rows.reduce((sum, r) => sum + toNumber(r.percentage), 0) / rows.length) * 10) / 10
        : 0,
    tests: new Set(rows.map((r) => r.test_id).filter(Boolean)).size,
    last: rows[0]?.submitted_at ?? null,
  };

  const byTest = buildGroups(
    rows,
    (row) => ({
      key: row.test_id ?? "deleted",
      label: row.tests?.title ?? "اختبار محذوف",
    }),
    (row) => row.tests?.pass_score ?? 70,
  );

  const bySector = buildGroups(rows, (row) =>
    row.sectors
      ? { key: row.sectors.slug, label: row.sectors.name }
      : { key: "unknown", label: "قطاع غير معروف" },
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="إحصاءات التدريب"
        description="محاولات وضع التدريب فقط — لا تُصدر شهادة ولا تمنح نقاطًا. تُحلَّل آخر 2000 محاولة."
      />

      {error ? <Alert tone="error">{error.message}</Alert> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "محاولات التدريب", value: totals.attempts.toLocaleString("ar-SA") },
          { label: "متوسط الدرجات", value: `${totals.avg}%` },
          { label: "اختبارات مُتدرَّب عليها", value: totals.tests.toLocaleString("ar-SA") },
          { label: "آخر محاولة", value: totals.last ? fmt(totals.last) : "—" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-white/[0.06] bg-[#141416] p-4"
          >
            <p className="text-[10px] font-bold text-[#94a3b8]">{card.label}</p>
            <p className="mt-1 text-lg font-black text-[var(--sector-light)]">{card.value}</p>
          </div>
        ))}
      </div>

      <Panel
        title="حسب الاختبار"
        description="نسبة الاجتياز هنا تعني بلوغ درجة النجاح المعرَّفة في الاختبار — مجرد مؤشر تدريبي."
      >
        {byTest.length === 0 ? (
          <EmptyState>لا توجد محاولات تدريب بعد. تُسجّل تلقائيًا عند تسليم أي جلسة تدريب.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-right text-[11px]">
              <thead className="text-[10px] text-[#94a3b8]">
                <tr>
                  <th className="pb-2 font-bold">الاختبار</th>
                  <th className="pb-2 font-bold">المحاولات</th>
                  <th className="pb-2 font-bold">المتوسط</th>
                  <th className="pb-2 font-bold">أعلى درجة</th>
                  <th className="pb-2 font-bold">بلغوا النجاح</th>
                  <th className="pb-2 font-bold">آخر محاولة</th>
                </tr>
              </thead>
              <tbody>
                {byTest.map((group) => (
                  <tr key={group.key} className="border-t border-white/[0.06]">
                    <td className="py-2 font-bold">{group.label}</td>
                    <td className="py-2">{group.attempts}</td>
                    <td className="py-2">{group.avg}%</td>
                    <td className="py-2">{Math.round(group.best)}%</td>
                    <td className="py-2">
                      <Badge tone={group.passed > 0 ? "success" : "muted"}>
                        {group.passed} / {group.attempts}
                      </Badge>
                    </td>
                    <td className="py-2 text-[10px] text-[#64748b]">{fmt(group.last)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {ctx.isSuperAdmin ? (
        <Panel title="حسب القطاع">
          {bySector.length === 0 ? (
            <EmptyState>لا توجد بيانات قطاعات بعد.</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-right text-[11px]">
                <thead className="text-[10px] text-[#94a3b8]">
                  <tr>
                    <th className="pb-2 font-bold">القطاع</th>
                    <th className="pb-2 font-bold">المحاولات</th>
                    <th className="pb-2 font-bold">المتوسط</th>
                    <th className="pb-2 font-bold">أعلى درجة</th>
                    <th className="pb-2 font-bold">آخر محاولة</th>
                  </tr>
                </thead>
                <tbody>
                  {bySector.map((group) => (
                    <tr key={group.key} className="border-t border-white/[0.06]">
                      <td className="py-2 font-bold">{group.label}</td>
                      <td className="py-2">{group.attempts}</td>
                      <td className="py-2">{group.avg}%</td>
                      <td className="py-2">{Math.round(group.best)}%</td>
                      <td className="py-2 text-[10px] text-[#64748b]">{fmt(group.last)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      ) : null}

      <Panel title="أحدث المحاولات">
        {rows.length === 0 ? (
          <EmptyState>لا توجد محاولات.</EmptyState>
        ) : (
          <ul className="space-y-1.5">
            {rows.slice(0, 25).map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] px-3 py-2 text-[11px]"
              >
                <span className="truncate font-bold">{row.tests?.title ?? "اختبار محذوف"}</span>
                <span className="flex items-center gap-2 text-[10px] text-[#64748b]">
                  {row.sectors?.name ? <span>{row.sectors.name}</span> : null}
                  <span>{fmt(row.submitted_at)}</span>
                  <span className="font-bold text-[var(--sector-light)]">
                    {Math.round(toNumber(row.percentage))}%
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
