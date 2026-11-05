import { saveFaq, deleteFaq } from "@/lib/admin/actions-content";
import { requirePermission } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Faq } from "@/lib/types";
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

function FaqFields({ item }: { item?: Faq }) {
  return (
    <>
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <Field label="السؤال">
        <input name="question" defaultValue={item?.question ?? ""} required className={inputCls} />
      </Field>
      <Field label="الإجابة">
        <textarea name="answer" defaultValue={item?.answer ?? ""} rows={4} required className={inputCls} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="الترتيب">
          <input
            type="number"
            name="sort_order"
            defaultValue={item?.sort_order ?? 0}
            className={inputCls}
          />
        </Field>
        <label className="flex items-center gap-2 self-end rounded-xl border border-white/[0.08] px-3 py-2 text-[11px]">
          <input
            type="checkbox"
            name="is_published"
            defaultChecked={item ? item.is_published : true}
          />
          منشور
        </label>
      </div>
      <SubmitButton className="!w-full">{item ? "تحديث السؤال" : "إضافة السؤال"}</SubmitButton>
    </>
  );
}

export default async function AdminFaqPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; error?: string }>;
}) {
  const ctx = await requirePermission("faq.write");
  const sp = await searchParams;
  const admin = createAdminClient();

  const base = admin.from("faq").select("*");
  const { data } = await (ctx.isSuperAdmin ? base : base.eq("sector_id", ctx.sectorId!)).order(
    "sort_order",
  );
  const items = (data ?? []) as Faq[];

  return (
    <div className="space-y-4">
      <PageHeader
        title="الأسئلة الشائعة"
        description="تظهر في صفحة «الأسئلة الشائعة» العامة للقطاع. غير المنشور يبقى مسودة."
      />

      {sp.msg ? <Alert tone="success">{sp.msg}</Alert> : null}
      {sp.error ? <Alert tone="error">{sp.error}</Alert> : null}

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Panel title={`الأسئلة (${items.length})`}>
          {items.length === 0 ? (
            <EmptyState>لا توجد أسئلة بعد. أضف أول سؤال من النموذج المجاور.</EmptyState>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.id} className="rounded-xl border border-white/[0.06] bg-[#0b0b0c] p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold">{item.question}</span>
                    <Badge tone={item.is_published ? "success" : "muted"}>
                      {item.is_published ? "منشور" : "مسودة"}
                    </Badge>
                    <span className="text-[10px] text-[#64748b]">#{item.sort_order}</span>
                  </div>

                  <details className="mt-2">
                    <summary className="cursor-pointer text-[10px] font-bold text-[#94a3b8]">
                      تعديل
                    </summary>
                    <form action={saveFaq} className="mt-2 space-y-2">
                      <FaqFields item={item} />
                    </form>
                    <form action={deleteFaq} className="mt-2">
                      <input type="hidden" name="id" value={item.id} />
                      <DangerButton>حذف السؤال</DangerButton>
                    </form>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="xl:sticky xl:top-4 xl:self-start">
          <Panel title="سؤال جديد">
            {ctx.sectorId ? (
              <form action={saveFaq} className="space-y-2">
                <FaqFields />
              </form>
            ) : (
              <EmptyState>هذا الحساب غير مرتبط بقطاع.</EmptyState>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
