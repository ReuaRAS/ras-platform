import Link from "next/link";
import {
  deleteRosterField,
  deleteRosterRow,
  saveRosterField,
  saveRosterRow,
} from "@/lib/admin/actions-roster";
import { requirePermission } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RosterField, RosterRow } from "@/lib/types";
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

const PER_PAGE = 20;

type SectorLite = { id: string; slug: string; name: string; primary_color: string | null };

function extrasOf(row: RosterRow): Record<string, string | boolean | null> {
  return (row.extras ?? {}) as Record<string, string | boolean | null>;
}

function yesNo(value: string | boolean | null | undefined) {
  if (value === true || value === "true") return <Badge tone="success">نعم</Badge>;
  if (value === false || value === "false") return <Badge tone="muted">لا</Badge>;
  if (typeof value === "string" && value.trim()) return <span>{value}</span>;
  return <span className="text-[#4b5563]">—</span>;
}

export default async function AdminRosterPage({
  searchParams,
}: {
  searchParams: Promise<{
    sector?: string;
    q?: string;
    page?: string;
    edit?: string;
    msg?: string;
    error?: string;
  }>;
}) {
  const ctx = await requirePermission("roster.read");
  const sp = await searchParams;
  const admin = createAdminClient();

  const { data: sectorsData } = await admin
    .from("sectors")
    .select("id, slug, name, primary_color")
    .order("name");
  const sectors = (sectorsData ?? []) as SectorLite[];

  const sector = ctx.isSuperAdmin
    ? (sectors.find((s) => s.slug === sp.sector) ?? sectors[0])
    : sectors.find((s) => s.id === ctx.sectorId);

  if (!sector) {
    return (
      <div>
        <PageHeader title="كوادر القطاعات" />
        <Alert tone="error">لا يوجد قطاع متاح لهذا الحساب.</Alert>
      </div>
    );
  }

  const query = (sp.q ?? "").trim();
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const editId = sp.edit ?? "";

  const { data: fieldsData } = await admin
    .from("sector_roster_fields")
    .select("*")
    .eq("sector_id", sector.id)
    .order("position");
  const fields = (fieldsData ?? []) as RosterField[];

  let listQuery = admin
    .from("sector_roster_rows")
    .select("*", { count: "exact" })
    .eq("sector_id", sector.id);

  if (query) {
    const safe = query.replace(/[(),%]/g, " ").trim();
    if (safe) {
      listQuery = listQuery.or(
        `full_name.ilike.%${safe}%,code.ilike.%${safe}%,employee_no.ilike.%${safe}%`,
      );
    }
  }

  const { data: rowsData, count } = await listQuery
    .order("position")
    .order("full_name")
    .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);
  const rows = (rowsData ?? []) as RosterRow[];

  const total = count ?? rows.length;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  let editing: RosterRow | null = null;
  if (editId) {
    const { data } = await admin
      .from("sector_roster_rows")
      .select("*")
      .eq("id", editId)
      .eq("sector_id", sector.id)
      .maybeSingle();
    editing = (data ?? null) as RosterRow | null;
  }
  const editingExtras = editing ? extrasOf(editing) : {};

  /** رابط يعود لنفس العرض (يُرسل مع كل نموذج) */
  const backParams = new URLSearchParams();
  if (sp.sector) backParams.set("sector", sp.sector);
  if (query) backParams.set("q", query);
  if (page > 1) backParams.set("page", String(page));
  const backPath = `/admin/roster${backParams.size ? `?${backParams.toString()}` : ""}`;

  const linkFor = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams();
    if (sp.sector) params.set("sector", sp.sector);
    if (query) params.set("q", query);
    if (page > 1) params.set("page", String(page));
    for (const [key, value] of Object.entries(patch)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    return `/admin/roster${params.size ? `?${params.toString()}` : ""}`;
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="كوادر القطاعات"
        description="جدول واحد لكل قطاع: الأعمدة الأساسية موحّدة، ويمكن لكل قطاع إضافة حقوله الخاصة (مثل: تصنيع، التعديل والتزويد، مدرب معتمد)."
      >
        <Badge tone="main">{sector.name}</Badge>
        <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold text-[#94a3b8]">
          {total} عنصر
        </span>
      </PageHeader>

      {sp.msg ? <Alert tone="success">{sp.msg}</Alert> : null}
      {sp.error ? <Alert tone="error">{sp.error}</Alert> : null}

      {ctx.isSuperAdmin && sectors.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {sectors.map((item) => {
            const active = item.id === sector.id;
            const params = new URLSearchParams();
            params.set("sector", item.slug);
            if (query) params.set("q", query);
            return (
              <Link
                key={item.id}
                href={`/admin/roster?${params.toString()}`}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors ${
                  active
                    ? "border-transparent bg-[var(--sector-main)] text-white"
                    : "border-white/10 text-[#94a3b8] hover:text-white"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Panel>
            <form action="" className="mb-3 flex flex-wrap items-end gap-2">
              <input type="hidden" name="sector" value={sector.slug} />
              <label className="min-w-[200px] flex-1">
                <span className="mb-1 block text-[11px] font-bold text-[#94a3b8]">بحث</span>
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="الاسم أو الرقم أو الكود"
                  className={inputCls}
                />
              </label>
              <button type="submit" className="btn btn-ghost !px-4 !py-2 text-xs">
                بحث
              </button>
              {query ? (
                <Link
                  href={`/admin/roster?sector=${sector.slug}`}
                  className="text-[11px] font-bold text-[#94a3b8] hover:text-white"
                >
                  مسح
                </Link>
              ) : null}
            </form>

            {rows.length === 0 ? (
              <EmptyState>
                {query
                  ? "لا توجد نتائج مطابقة للبحث."
                  : "لا توجد بيانات لهذا القطاع بعد. أضف الصفوف من النموذج، أو انتظر روابط القطاعات لاستيرادها."}
              </EmptyState>
            ) : (
              <div className="-mx-4 overflow-x-auto px-4">
                <table className="w-full min-w-[900px] border-collapse text-right text-[11px]">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] text-[#94a3b8]">
                      <th className="px-2 py-2 font-bold">ID</th>
                      <th className="px-2 py-2 font-bold">الكود</th>
                      <th className="px-2 py-2 font-bold">الاسم</th>
                      <th className="px-2 py-2 font-bold">الرقم</th>
                      <th className="px-2 py-2 font-bold">المستوى</th>
                      <th className="px-2 py-2 font-bold">الرتبة / المسمى</th>
                      <th className="px-2 py-2 font-bold">الأثر الوظيفي</th>
                      <th className="px-2 py-2 font-bold">الحالة</th>
                      {fields.map((field) => (
                        <th key={field.id} className="px-2 py-2 font-bold">
                          {field.label}
                        </th>
                      ))}
                      <th className="px-2 py-2 font-bold">الملاحظات</th>
                      <th className="px-2 py-2 font-bold">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const extras = extrasOf(row);
                      return (
                        <tr key={row.id} className="border-b border-white/[0.04] last:border-0">
                          <td className="px-2 py-2 text-[#64748b]">{row.code ?? "—"}</td>
                          <td className="px-2 py-2 font-mono text-[10px] text-[#94a3b8]">
                            {row.employee_no ?? "—"}
                          </td>
                          <td className="px-2 py-2 font-bold text-white">{row.full_name}</td>
                          <td className="px-2 py-2 text-[#cbd5e1]">{row.level ?? "—"}</td>
                          <td className="px-2 py-2 text-[#cbd5e1]">{row.rank_title ?? "—"}</td>
                          <td className="px-2 py-2 text-[#cbd5e1]">{row.job_arc ?? "—"}</td>
                          <td className="px-2 py-2">
                            {row.status ? <Badge tone="muted">{row.status}</Badge> : "—"}
                          </td>
                          {fields.map((field) => (
                            <td key={field.id} className="px-2 py-2 text-[#cbd5e1]">
                              {yesNo(extras[field.id])}
                            </td>
                          ))}
                          <td className="max-w-[180px] truncate px-2 py-2 text-[#94a3b8]">
                            {row.notes ?? "—"}
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex items-center gap-2">
                              <Link
                                href={linkFor({ edit: row.id })}
                                className="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-bold text-[#cbd5e1] hover:text-white"
                              >
                                تعديل
                              </Link>
                              <form action={deleteRosterRow}>
                                <input type="hidden" name="id" value={row.id} />
                                <input type="hidden" name="sector_id" value={sector.id} />
                                <input type="hidden" name="back" value={backPath} />
                                <DangerButton>حذف</DangerButton>
                              </form>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {pages > 1 ? (
              <div className="mt-3 flex items-center justify-between text-[11px] text-[#94a3b8]">
                <span>
                  صفحة {page} من {pages}
                </span>
                <div className="flex items-center gap-2">
                  {page > 1 ? (
                    <Link href={linkFor({ page: String(page - 1) })} className="btn btn-ghost !px-3 !py-1.5 text-[11px]">
                      السابق
                    </Link>
                  ) : null}
                  {page < pages ? (
                    <Link href={linkFor({ page: String(page + 1) })} className="btn btn-ghost !px-3 !py-1.5 text-[11px]">
                      التالي
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : null}
          </Panel>

          <Panel
            title={editing ? `تعديل: ${editing.full_name}` : "إضافة عنصر"}
            description={
              editing
                ? "عدّل البيانات ثم احفظ. لإلغاء التعديل ارجع للجدول."
                : "أضف صفًا يدويًا. يمكنك تحديثه لاحقًا بعد استيراد روابط القطاعات."
            }
          >
            <form action={saveRosterRow} className="space-y-3">
              <input type="hidden" name="sector_id" value={sector.id} />
              <input type="hidden" name="back" value={backPath} />
              {editing ? <input type="hidden" name="id" value={editing.id} /> : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="الاسم">
                  <input
                    name="full_name"
                    required
                    defaultValue={editing?.full_name ?? ""}
                    className={inputCls}
                  />
                </Field>
                <Field label="الكود (ID)">
                  <input name="code" defaultValue={editing?.code ?? ""} className={inputCls} dir="ltr" />
                </Field>
                <Field label="الرقم">
                  <input
                    name="employee_no"
                    defaultValue={editing?.employee_no ?? ""}
                    className={inputCls}
                    dir="ltr"
                  />
                </Field>
                <Field label="المستوى">
                  <input name="level" defaultValue={editing?.level ?? ""} className={inputCls} />
                </Field>
                <Field label="الرتبة / المسمى">
                  <input name="rank_title" defaultValue={editing?.rank_title ?? ""} className={inputCls} />
                </Field>
                <Field label="الأثر الوظيفي">
                  <input name="job_arc" defaultValue={editing?.job_arc ?? ""} className={inputCls} />
                </Field>
                <Field label="الحالة">
                  <input name="status" defaultValue={editing?.status ?? ""} className={inputCls} />
                </Field>
                <Field label="الملاحظات">
                  <input name="notes" defaultValue={editing?.notes ?? ""} className={inputCls} />
                </Field>
              </div>

              {fields.length ? (
                <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
                  <p className="mb-2 text-[10px] font-bold text-[#94a3b8]">حقول خاصة بالقطاع</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {fields.map((field) =>
                      field.kind === "bool" ? (
                        <label
                          key={field.id}
                          className="flex items-center gap-2 rounded-lg border border-white/10 px-2 py-1.5 text-[11px] text-[#cbd5e1]"
                        >
                          <input
                            type="checkbox"
                            name={`f_${field.id}`}
                            defaultChecked={editingExtras[field.id] === true}
                            className="h-3.5 w-3.5 accent-[var(--sector-main)]"
                          />
                          {field.label}
                        </label>
                      ) : (
                        <Field key={field.id} label={field.label}>
                          <input
                            name={`f_${field.id}`}
                            defaultValue={
                              typeof editingExtras[field.id] === "string"
                                ? String(editingExtras[field.id])
                                : ""
                            }
                            className={inputCls}
                          />
                        </Field>
                      ),
                    )}
                  </div>
                </div>
              ) : null}

              <div className="flex items-center gap-2">
                <SubmitButton>{editing ? "حفظ التعديل" : "إضافة"}</SubmitButton>
                {editing ? (
                  <Link href={backPath || "/admin/roster"} className="text-[11px] font-bold text-[#94a3b8] hover:text-white">
                    إلغاء
                  </Link>
                ) : null}
              </div>
            </form>
          </Panel>
        </div>

        <Panel
          title="حقول القطاع الخاصة"
          description="أعمدة إضافية تظهر في جدول هذا القطاع فقط، مثل «تصنيع» أو «مدرب معتمد»."
        >
          {fields.length === 0 ? (
            <p className="mb-3 text-[11px] text-[#94a3b8]">لا توجد حقول خاصة بعد.</p>
          ) : (
            <ul className="mb-3 space-y-2">
              {fields.map((field) => (
                <li
                  key={field.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] px-2 py-1.5 text-[11px]"
                >
                  <span className="font-bold">{field.label}</span>
                  <span className="flex items-center gap-2">
                    <Badge tone="muted">{field.kind === "bool" ? "نعم/لا" : "نص"}</Badge>
                    <form action={deleteRosterField}>
                      <input type="hidden" name="id" value={field.id} />
                      <input type="hidden" name="sector_id" value={sector.id} />
                      <input type="hidden" name="back" value={backPath} />
                      <DangerButton>حذف</DangerButton>
                    </form>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <form action={saveRosterField} className="space-y-2">
            <input type="hidden" name="sector_id" value={sector.id} />
            <input type="hidden" name="back" value={backPath} />
            <Field label="اسم الحقل">
              <input name="label" required placeholder="مدرب معتمد" className={inputCls} />
            </Field>
            <Field label="النوع">
              <select name="kind" className={inputCls} defaultValue="bool">
                <option value="bool">نعم / لا</option>
                <option value="text">نص</option>
              </select>
            </Field>
            <SubmitButton className="w-full">إضافة حقل</SubmitButton>
          </form>
        </Panel>
      </div>
    </div>
  );
}
