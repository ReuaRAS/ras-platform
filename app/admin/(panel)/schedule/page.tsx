import { deleteSchedule, saveSchedule } from "@/lib/admin/actions";
import { requirePermission } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Schedule } from "@/lib/types";
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

function ScheduleFields({ schedule }: { schedule?: Schedule }) {
  return (
    <>
      {schedule ? <input type="hidden" name="id" value={schedule.id} /> : null}
      <Field label="عنوان الجدول">
        <input name="title" defaultValue={schedule?.title ?? "جدول القطاع"} className={inputCls} />
      </Field>
      <Field label="الأعمدة (JSON)" hint='[{"key":"day","label":"اليوم"}]'>
        <textarea
          name="columns"
          rows={4}
          defaultValue={JSON.stringify(schedule?.columns ?? [], null, 2)}
          className={`${inputCls} font-mono text-[11px]`}
          dir="ltr"
        />
      </Field>
      <Field label="الصفوف (JSON)" hint='[{"day":"الأحد","time":"8م"}] — المفاتيح نفسها في الأعمدة'>
        <textarea
          name="rows"
          rows={10}
          defaultValue={JSON.stringify(schedule?.rows ?? [], null, 2)}
          className={`${inputCls} font-mono text-[11px]`}
          dir="ltr"
        />
      </Field>
      <Field label="صورة الجدول (اختياري، حتى 4MB)">
        <input type="file" name="image" accept="image/*" className={inputCls} />
      </Field>
      {schedule?.image_url ? (
        <p className="text-[10px] text-[#64748b]">
          الصورة الحالية محفوظة. رفع صورة جديدة يستبدل الرابط فقط، والقديمة تبقى في التخزين.
        </p>
      ) : null}
      <input type="hidden" name="image_url" value={schedule?.image_url ?? ""} />
      <Field label="ملاحظات">
        <textarea name="notes" rows={2} defaultValue={schedule?.notes ?? ""} className={inputCls} />
      </Field>
      <label className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2 text-[11px]">
        <input type="checkbox" name="is_published" defaultChecked={schedule ? schedule.is_published : true} />
        منشور للعامة
      </label>
      <SubmitButton className="!w-full">{schedule ? "حفظ التعديلات" : "إضافة الجدول"}</SubmitButton>
    </>
  );
}

export default async function AdminSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; error?: string }>;
}) {
  const ctx = await requirePermission("schedule.write");
  const sp = await searchParams;
  const admin = createAdminClient();

  let schedules: Schedule[] = [];
  if (ctx.sectorId) {
    const { data } = await admin
      .from("sector_schedules")
      .select("*")
      .eq("sector_id", ctx.sectorId)
      .order("updated_at", { ascending: false });
    schedules = (data ?? []) as Schedule[];
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="الجدول"
        description="يمكن نشر جدول نصي (أعمدة/صفوف) وصورة جدول منسّقة. تُعرض في صفحة الجدول العامة."
      />

      {sp.msg ? <Alert tone="success">{sp.msg}</Alert> : null}
      {sp.error ? <Alert tone="error">{sp.error}</Alert> : null}

      {!ctx.sectorId ? (
        <EmptyState>هذا الحساب غير مرتبط بقطاع.</EmptyState>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <Panel title={`الجداول (${schedules.length})`}>
            {schedules.length === 0 ? (
              <EmptyState>لا يوجد جدول منشور من قاعدة البيانات. ستظهر جداول المحتوى المهيّأ إن وُجدت.</EmptyState>
            ) : (
              <ul className="space-y-2">
                {schedules.map((schedule) => (
                  <li key={schedule.id} className="rounded-xl border border-white/[0.06] bg-[#0b0b0c] p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold">{schedule.title}</span>
                      <Badge tone={schedule.is_published ? "success" : "muted"}>
                        {schedule.is_published ? "منشور" : "مسودة"}
                      </Badge>
                      <span className="text-[10px] text-[#64748b]">
                        {Array.isArray(schedule.rows) ? schedule.rows.length : 0} صف
                      </span>
                    </div>
                    {schedule.image_url ? (
                      <a
                        href={schedule.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-[10px] font-bold text-[var(--sector-main)]"
                      >
                        عرض الصورة ↗
                      </a>
                    ) : null}
                    <details className="mt-2">
                      <summary className="cursor-pointer text-[10px] font-bold text-[#94a3b8]">تعديل</summary>
                      <form action={saveSchedule} className="mt-2 space-y-2">
                        <ScheduleFields schedule={schedule} />
                      </form>
                      <form action={deleteSchedule} className="mt-2">
                        <input type="hidden" name="id" value={schedule.id} />
                        <DangerButton>حذف الجدول</DangerButton>
                      </form>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <div className="xl:sticky xl:top-4 xl:self-start">
            <Panel title="جدول جديد">
              <form action={saveSchedule} className="space-y-2">
                <ScheduleFields />
              </form>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
