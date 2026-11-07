import { deleteAnnouncement, saveAnnouncement } from "@/lib/admin/actions-content";
import { requirePermission } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Announcement } from "@/lib/types";
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

function toLocalInput(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

function AnnouncementFields({ item }: { item?: Announcement }) {
  return (
    <>
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <Field label="العنوان">
        <input name="title" defaultValue={item?.title ?? ""} required className={inputCls} />
      </Field>
      <Field label="التفاصيل">
        <textarea
          name="content"
          defaultValue={item?.content ?? ""}
          rows={4}
          className={inputCls}
          placeholder="نص الإعلان — اختياري"
        />
      </Field>
      <Field label="موعد الفعالية (اختياري)">
        <input
          type="datetime-local"
          name="event_date"
          defaultValue={toLocalInput(item?.event_date ?? null)}
          className={inputCls}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2 text-[11px]">
          <input type="checkbox" name="is_published" defaultChecked={item ? item.is_published : true} />
          منشور
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2 text-[11px]">
          <input type="checkbox" name="is_pinned" defaultChecked={item ? item.is_pinned : false} />
          مثبّت
        </label>
      </div>
      <SubmitButton className="!w-full">{item ? "تحديث الإعلان" : "إضافة الإعلان"}</SubmitButton>
    </>
  );
}

export default async function AdminAnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; error?: string }>;
}) {
  const ctx = await requirePermission("announcements.write");
  const sp = await searchParams;
  const admin = createAdminClient();

  const base = admin.from("announcements").select("*");
  const { data } = await (ctx.isSuperAdmin ? base : base.eq("sector_id", ctx.sectorId!)).order(
    "is_pinned",
    { ascending: false },
  );
  const items = (data ?? []) as Announcement[];

  return (
    <div className="space-y-4">
      <PageHeader
        title="الإعلانات"
        description="تظهر في صفحة «الإعلانات» العامة للقطاع. غير المنشور يبقى مسودة، والمثبّت يظهر أولًا."
      />

      {sp.msg ? <Alert tone="success">{sp.msg}</Alert> : null}
      {sp.error ? <Alert tone="error">{sp.error}</Alert> : null}

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Panel title={`الإعلانات (${items.length})`}>
          {items.length === 0 ? (
            <EmptyState>لا توجد إعلانات بعد. أضف أول إعلان من النموذج المجاور.</EmptyState>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.id} className="rounded-xl border border-white/[0.06] bg-[#0b0b0c] p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold">{item.title}</span>
                    <Badge tone={item.is_published ? "success" : "muted"}>
                      {item.is_published ? "منشور" : "مسودة"}
                    </Badge>
                    {item.is_pinned ? <Badge tone="warning">مثبّت</Badge> : null}
                  </div>
                  {item.content ? (
                    <p className="mt-1.5 whitespace-pre-line text-[10px] leading-relaxed text-[#94a3b8]">
                      {item.content}
                    </p>
                  ) : null}
                  {item.event_date ? (
                    <p className="mt-1.5 text-[10px] text-[#64748b]">
                      الموعد: {new Date(item.event_date).toLocaleString("ar-SA")}
                    </p>
                  ) : null}

                  <details className="mt-2">
                    <summary className="cursor-pointer text-[10px] font-bold text-[#94a3b8]">
                      تعديل
                    </summary>
                    <form action={saveAnnouncement} className="mt-2 space-y-2">
                      <AnnouncementFields item={item} />
                    </form>
                    <form action={deleteAnnouncement} className="mt-2">
                      <input type="hidden" name="id" value={item.id} />
                      <DangerButton>حذف الإعلان</DangerButton>
                    </form>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="xl:sticky xl:top-4 xl:self-start">
          <Panel title="إعلان جديد">
            {ctx.sectorId ? (
              <form action={saveAnnouncement} className="space-y-2">
                <AnnouncementFields />
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
