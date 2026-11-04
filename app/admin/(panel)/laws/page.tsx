import { deleteLaw, saveLaw, seedSectorDefaults } from "@/lib/admin/actions";
import { requirePermission } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Law } from "@/lib/types";
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

function LawFields({ law }: { law?: Law }) {
  return (
    <>
      {law ? <input type="hidden" name="id" value={law.id} /> : null}
      <div className="grid grid-cols-2 gap-2">
        <Field label="كود القانون">
          <input name="law_code" defaultValue={law?.law_code ?? ""} required className={inputCls} placeholder="RCA-01" />
        </Field>
        <Field label="النوع">
          <select name="category" defaultValue={law?.category ?? "main"} className={inputCls}>
            <option value="main">قانون رئيسي</option>
            <option value="common">مخالفة شائعة</option>
          </select>
        </Field>
      </div>
      <Field label="العنوان">
        <input name="title" defaultValue={law?.title ?? ""} required className={inputCls} />
      </Field>
      <Field label="العقوبة">
        <input name="penalty" defaultValue={law?.penalty ?? ""} required className={inputCls} />
      </Field>
      <Field label="عقوبة إضافية (اختياري)">
        <input name="additional_penalty" defaultValue={law?.additional_penalty ?? ""} className={inputCls} />
      </Field>
      <Field label="ملاحظات (اختياري)">
        <textarea name="notes" defaultValue={law?.notes ?? ""} rows={2} className={inputCls} />
      </Field>
      <Field label="الترتيب">
        <input
          name="sort_order"
          type="number"
          min={0}
          defaultValue={law?.sort_order ?? 0}
          className={inputCls}
        />
      </Field>
      <SubmitButton className="!w-full">{law ? "تحديث القانون" : "إضافة القانون"}</SubmitButton>
    </>
  );
}

export default async function AdminLawsPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; error?: string }>;
}) {
  const ctx = await requirePermission("laws.read");
  const sp = await searchParams;
  const admin = createAdminClient();

  const base = admin.from("sector_laws").select("*");
  const { data } = await (ctx.isSuperAdmin ? base : base.eq("sector_id", ctx.sectorId!))
    .order("category")
    .order("sort_order");
  const laws = (data ?? []) as Law[];

  const main = laws.filter((l) => l.category !== "common");
  const common = laws.filter((l) => l.category === "common");

  return (
    <div className="space-y-4">
      <PageHeader
        title="القوانين"
        description="كل قانون يُدخل هنا يظهر مباشرة في صفحة القوانين العامة للقطاع. المخالفات الشائعة تظهر في قسم منفصل."
      >
        <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold text-[#94a3b8]">
          {laws.length} قانون
        </span>
      </PageHeader>

      {sp.msg ? <Alert tone="success">{sp.msg}</Alert> : null}
      {sp.error ? <Alert tone="error">{sp.error}</Alert> : null}

      {laws.length === 0 ? (
        <Alert tone="info">
          لا توجد قوانين لهذا القطاع. أضف قانونًا من النموذج، أو انسخ القوانين والمكافآت من قطاع
          مرجعي (النسخ متاح لقائد القطاع فقط).
        </Alert>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          {[
            { title: "القوانين الرئيسية", rows: main },
            { title: "المخالفات الشائعة", rows: common },
          ].map((group) => (
            <Panel key={group.title} title={`${group.title} (${group.rows.length})`}>
              {group.rows.length === 0 ? (
                <EmptyState>لا توجد عناصر في هذا القسم.</EmptyState>
              ) : (
                <ul className="space-y-2">
                  {group.rows.map((law) => (
                    <li key={law.id} className="rounded-xl border border-white/[0.06] bg-[#0b0b0c]">
                      <details>
                        <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2">
                          <span className="flex min-w-0 items-center gap-2">
                            <Badge tone="main">{law.law_code}</Badge>
                            <span className="truncate text-[11px] font-bold">{law.title}</span>
                          </span>
                          <span className="shrink-0 text-[10px] text-[#94a3b8]">
                            #{law.sort_order}
                          </span>
                        </summary>
                        <div className="space-y-2 border-t border-white/[0.06] px-3 py-3">
                          <p className="text-[11px] leading-relaxed text-[#cbd5e1]">
                            <span className="font-bold text-white">العقوبة: </span>
                            {law.penalty}
                            {law.additional_penalty ? ` — ${law.additional_penalty}` : ""}
                          </p>
                          {law.notes ? (
                            <p className="text-[10px] text-[#94a3b8]">{law.notes}</p>
                          ) : null}

                          <form action={saveLaw} className="space-y-2 pt-1">
                            <LawFields law={law} />
                          </form>

                          <form action={deleteLaw}>
                            <input type="hidden" name="id" value={law.id} />
                            <DangerButton>حذف نهائي</DangerButton>
                          </form>
                        </div>
                      </details>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          ))}
        </div>

        <div className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <Panel title="إضافة قانون">
            {ctx.sectorId ? (
              <form action={saveLaw} className="space-y-2">
                <LawFields />
              </form>
            ) : (
              <EmptyState>هذا الحساب غير مرتبط بقطاع، فلا يمكنه الكتابة.</EmptyState>
            )}
          </Panel>

          {ctx.sectorId && ctx.role === "sector_admin" ? (
            <Panel
              title="نسخ من قطاع مرجعي"
              description="ينسخ القوانين والمكافآت من قطاع آخر موجود في قاعدة البيانات. لا ينسخ الشهادات أو النتائج."
            >
              <form action={seedSectorDefaults} className="space-y-2">
                <input type="hidden" name="redirect_to" value="/admin/laws" />
                <Field label="القطاع المصدر">
                  <select name="source_slug" className={inputCls} defaultValue="red-crescent">
                    <option value="red-crescent">الهلال الأحمر</option>
                    <option value="mechanic-garage">الورشة الميكانيكية</option>
                    <option value="public-security">الأمن العام</option>
                    <option value="facility-security">أمن المنشآت</option>
                    <option value="security-brigades">الأفواج الأمنية</option>
                  </select>
                </Field>
                <p className="text-[10px] leading-relaxed text-amber-300">
                  تحذير: يتخطى السجلات التي لها نفس الكود فقط. راجع النتيجة قبل النشر.
                </p>
                <SubmitButton className="!w-full">نسخ القوانين والمكافآت</SubmitButton>
              </form>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
