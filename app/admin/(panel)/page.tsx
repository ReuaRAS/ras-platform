import Link from "next/link";
import { seedSectorDefaults } from "@/lib/admin/actions";
import { requireStaff } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/permissions";
import { SECTORS } from "@/lib/sectors";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TestAttempt } from "@/lib/types";
import { Alert, Badge, EmptyState, PageHeader, Panel, SubmitButton, inputCls } from "@/components/admin/ui";
import { FileText, Trophy, GraduationCap, FlaskConical, TrendingUp, Ticket, BadgeCheck } from "lucide-react";

export const dynamic = "force-dynamic";

type CountTable =
  | "sector_laws"
  | "sector_rewards"
  | "courses"
  | "tests"
  | "questions"
  | "test_attempts"
  | "certificates";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const ctx = await requireStaff();
  const sp = await searchParams;
  const admin = createAdminClient();

  async function count(table: CountTable, scoped = true): Promise<number> {
    const base = admin.from(table).select("id", { count: "exact", head: true });
    const q = !scoped || ctx.isSuperAdmin || !ctx.sectorId ? base : base.eq("sector_id", ctx.sectorId);
    const { count: c } = await q;
    return c ?? 0;
  }

  const [laws, rewards, courses, tests, attempts, certificates, published] =
    await Promise.all([
      count("sector_laws"),
      count("sector_rewards"),
      count("courses"),
      count("tests"),
      count("test_attempts"),
      count("certificates"),
      count("certificates"),
    ]);

  const attemptsQuery = admin
    .from("test_attempts")
    .select(
      "id, trainee_name, discord_username, test_type, percentage, passed, suspicion_flags, submitted_at, is_practice",
    );
  const { data: recentData } = await (
    ctx.isSuperAdmin || !ctx.sectorId
      ? attemptsQuery
      : attemptsQuery.eq("sector_id", ctx.sectorId)
  )
    .order("started_at", { ascending: false })
    .limit(6);

  const recent = (recentData ?? []) as TestAttempt[];

  const statCards = [
    { label: "القوانين", value: laws, href: "/admin/laws", Icon: FileText },
    { label: "المكافآت", value: rewards, href: "/admin/rewards", Icon: Trophy },
    { label: "الدورات", value: courses, href: "/admin/courses", Icon: GraduationCap },
    { label: "الاختبارات", value: tests, href: "/admin/tests", Icon: FlaskConical },
    { label: "المحاولات", value: attempts, href: "/admin/test-results", Icon: TrendingUp },
    { label: "الشهادات", value: certificates, href: "/admin/certificates", Icon: Ticket },
    { label: "شهادات صالحة", value: published, href: "/admin/certificates", Icon: BadgeCheck },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="لوحة التحكم"
        description={`مرحبًا${ctx.displayName ? ` ${ctx.displayName}` : ""} — نظرة سريعة على قطاع ${ctx.sector?.name ?? "كل القطاعات"}.`}
      />

      {sp.error === "permission" ? (
        <Alert tone="error">لا تملك صلاحية الوصول إلى تلك الصفحة.</Alert>
      ) : null}

      {!ctx.sectorId ? (
        <Alert tone="info">
          هذا الحساب مدير عام بدون قطاع محدد: يرى البيانات المجمّعة، لكن الكتابة تتطلب حسابًا مرتبطًا
          بقطاع.
        </Alert>
      ) : null}

      {ctx.sectorId && laws === 0 && rewards === 0 && courses === 0 ? (
        <Panel
          title={`مرحبًا بك في إدارة ${ctx.sector?.name ?? "القطاع"}!`}
          description="القطاع لا يحتوي أي بيانات بعد. ابدأ من أحد الخيارات التالية — كل شيء يُدار من هنا دون تعديل كود."
        >
          <div className="grid gap-2 sm:grid-cols-3">
            <Link href="/admin/courses" className="rounded-xl border border-white/[0.08] p-3 hover:bg-white/5">
              <p className="text-xs font-extrabold">＋ إضافة أول دورة</p>
              <p className="mt-1 text-[10px] text-[#94a3b8]">سلايدات + اختبار + شهادة</p>
            </Link>
            <Link href="/admin/laws" className="rounded-xl border border-white/[0.08] p-3 hover:bg-white/5">
              <p className="text-xs font-extrabold">＋ إضافة أول قانون</p>
              <p className="mt-1 text-[10px] text-[#94a3b8]">كود + عنوان + عقوبة</p>
            </Link>
            <Link href="/admin/rewards" className="rounded-xl border border-white/[0.08] p-3 hover:bg-white/5">
              <p className="text-xs font-extrabold">＋ إضافة أول مكافأة</p>
              <p className="mt-1 text-[10px] text-[#94a3b8]">قيمة المكافأة وشروطها</p>
            </Link>
          </div>

          {hasPermission(ctx.role, "sector.seed") ? (
            <form
              action={seedSectorDefaults}
              className="mt-3 flex flex-wrap items-end gap-2 border-t border-white/[0.06] pt-3"
            >
              <input type="hidden" name="redirect_to" value="/admin" />
              <label className="flex flex-1 flex-col gap-1 text-[10px] text-[#94a3b8]">
                نسخ القوانين والمكافآت من قطاع مرجعي
                <select name="source_slug" defaultValue="red-crescent" className={inputCls}>
                  {SECTORS.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <SubmitButton>نسخ الآن</SubmitButton>
            </form>
          ) : null}
        </Panel>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-2xl border border-white/[0.06] bg-[#141416] p-3 transition-colors hover:border-[var(--sector-main)]/40"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#94a3b8]">{card.label}</span>
              <span aria-hidden="true">
                <card.Icon className="h-4 w-4 text-[#94a3b8]" />
              </span>
            </div>
            <p className="mt-1 text-xl font-extrabold">{card.value}</p>
          </Link>
        ))}
      </div>

      <Panel
        title="أحدث المحاولات"
        description="النتائج التي تحمل 3 تحذيرات أو أكثر تُعدّ مشبوهة وتحتاج مراجعة يدوية."
      >
        {recent.length === 0 ? (
          <EmptyState>لا توجد محاولات مسجّلة بعد.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-[11px]">
              <thead className="text-[10px] text-[#94a3b8]">
                <tr>
                  <th className="pb-2 font-bold">المتدرّب</th>
                  <th className="pb-2 font-bold">الاختبار</th>
                  <th className="pb-2 font-bold">النتيجة</th>
                  <th className="pb-2 font-bold">الحالة</th>
                  <th className="pb-2 font-bold">التحذيرات</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((attempt) => {
                  const flags = Array.isArray(attempt.suspicion_flags)
                    ? attempt.suspicion_flags.length
                    : 0;
                  return (
                    <tr key={attempt.id} className="border-t border-white/[0.06]">
                      <td className="py-2">
                        <p className="font-bold">{attempt.trainee_name}</p>
                        <p className="text-[10px] text-[#64748b]" dir="ltr">
                          {attempt.discord_username}
                        </p>
                      </td>
                      <td className="py-2 text-[10px] text-[#94a3b8]">
                        {attempt.test_type === "recruitment" ? "توظيف" : "دورة"}
                      </td>
                      <td className="py-2 font-bold">{Math.round(attempt.percentage)}%</td>
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
                        {flags >= 3 ? (
                          <Badge tone="warning">{flags} مشبوه</Badge>
                        ) : (
                          <span className="text-[10px] text-[#64748b]">{flags}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3">
          <Link href="/admin/test-results" className="text-[11px] font-bold text-[var(--sector-main)]">
            عرض كل النتائج ←
          </Link>
        </div>
      </Panel>

      <Panel title="قائمة البدء السريع">
        <ol className="grid gap-2 text-[11px] leading-relaxed text-[#94a3b8] sm:grid-cols-2">
          <li>1. أضف القوانين والمكافآت (أو انسخها من قطاع مرجعي).</li>
          <li>2. أنشئ دورة، ثم أضف سلايداتها من صفحة الدورة.</li>
          <li>3. أنشئ اختبارًا مربوطًا بالدورة، ثم أضف الأسئلة من بنك الأسئلة.</li>
          <li>4. راجع النتائج، ثم أصدر/ألغِ الشهادات.</li>
        </ol>
      </Panel>
    </div>
  );
}
