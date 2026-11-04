import { saveRecruitment } from "@/lib/admin/actions";
import { requirePermission } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Recruitment } from "@/lib/types";
import { Alert, EmptyState, Field, PageHeader, Panel, SubmitButton, inputCls } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminRecruitmentPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; error?: string }>;
}) {
  const ctx = await requirePermission("recruitment.write");
  const sp = await searchParams;
  const admin = createAdminClient();

  let row: Recruitment | null = null;
  if (ctx.sectorId) {
    const { data } = await admin
      .from("recruitment_info")
      .select("sector_id, description, guide_content, is_open")
      .eq("sector_id", ctx.sectorId)
      .maybeSingle();
    row = (data as Recruitment | null) ?? null;
  }

  const guide = (row?.guide_content ?? {}) as {
    slides?: unknown[];
    conditions?: string[];
    pdf_url?: string | null;
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="التوظيف"
        description="تحكم في فتح/إغلاق باب التوظيف، ونص الشروط، وسلايدات دليل المتقدم. يظهر للمتقدمين في صفحة التوظيف."
      />

      {sp.msg ? <Alert tone="success">{sp.msg}</Alert> : null}
      {sp.error ? <Alert tone="error">{sp.error}</Alert> : null}

      {!ctx.sectorId ? (
        <EmptyState>هذا الحساب غير مرتبط بقطاع.</EmptyState>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <Panel title="بيانات التوظيف">
            <form action={saveRecruitment} className="space-y-3">
              <label className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] px-3 py-2">
                <span className="text-[11px] font-bold">باب التوظيف مفتوح</span>
                <input type="checkbox" name="is_open" defaultChecked={row?.is_open ?? false} />
              </label>

              <Field label="وصف مختصر">
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={row?.description ?? ""}
                  className={inputCls}
                  placeholder="يُعرض أعلى صفحة التوظيف"
                />
              </Field>

              <Field label="الشروط (كل شرط في سطر)">
                <textarea
                  name="conditions"
                  rows={6}
                  defaultValue={(guide.conditions ?? []).join("\n")}
                  className={inputCls}
                />
              </Field>

              <Field label="رابط ملف الدليل PDF (اختياري)">
                <input
                  name="pdf_url"
                  defaultValue={guide.pdf_url ?? ""}
                  className={inputCls}
                  placeholder="/content/rca/guide.pdf"
                />
              </Field>

              <Field
                label="سلايدات الدليل (JSON)"
                hint='مصفوفة كائنات بالشكل: [{"title":"...","content":"..."}]'
              >
                <textarea
                  name="guide_slides"
                  rows={8}
                  defaultValue={JSON.stringify(guide.slides ?? [], null, 2)}
                  className={`${inputCls} font-mono`}
                  dir="ltr"
                />
              </Field>

              <SubmitButton>حفظ بيانات التوظيف</SubmitButton>
            </form>
          </Panel>

          <Panel title="ملاحظات">
            <ul className="space-y-2 text-[11px] leading-relaxed text-[#94a3b8]">
              <li>• عند إغلاق الباب تظهر رسالة «التوظيف مغلق حاليًا» وتبقى الصفحة متاحة للقراءة.</li>
              <li>• إذا تركت الشروط فارغة سيستخدم الموقع محتوى القطاع المهيّأ في `content/`.</li>
              <li>• السلايدات تُعرض بأسلوب سلايدات الدورات (بدون تحميل PDF إن وُجد نص).</li>
            </ul>
          </Panel>
        </div>
      )}
    </div>
  );
}
