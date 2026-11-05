import {
  cancelOrder,
  deleteStoreItem,
  fulfillOrder,
  purchaseForMember,
  saveStoreItem,
} from "@/lib/admin/actions-store";
import { requirePermission } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { StoreItem, StoreOrder } from "@/lib/types";
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

const ORDER_LABEL: Record<StoreOrder["status"], string> = {
  pending: "قيد التسليم",
  fulfilled: "تم التسليم",
  cancelled: "ملغي",
};

const ORDER_TONE: Record<StoreOrder["status"], "warning" | "success" | "danger"> = {
  pending: "warning",
  fulfilled: "success",
  cancelled: "danger",
};

function ItemFields({ item }: { item?: StoreItem }) {
  return (
    <>
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <Field label="اسم العنصر">
        <input name="name" defaultValue={item?.name ?? ""} required className={inputCls} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="السعر (XP)">
          <input name="price" type="number" min={0} defaultValue={item?.price ?? 0} className={inputCls} />
        </Field>
        <Field label="المخزون (فارغ = غير محدود)">
          <input
            name="stock"
            type="number"
            min={0}
            defaultValue={item?.stock ?? ""}
            className={inputCls}
          />
        </Field>
      </div>
      <Field label="الوصف">
        <textarea name="description" rows={2} defaultValue={item?.description ?? ""} className={inputCls} />
      </Field>
      <label className="flex items-center gap-2 text-[11px] text-[#94a3b8]">
        <input type="checkbox" name="is_active" defaultChecked={item?.is_active ?? true} />
        متاح للعرض في المتجر العام
      </label>
      <SubmitButton className="!w-full">{item ? "تحديث العنصر" : "إضافة العنصر"}</SubmitButton>
    </>
  );
}

export default async function AdminStorePage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; error?: string }>;
}) {
  const ctx = await requirePermission("store.read");
  const sp = await searchParams;
  const admin = createAdminClient();

  const canWrite = ctx.isSuperAdmin || ctx.role === "sector_admin";

  const itemsQuery = admin.from("store_items").select("*").order("created_at", { ascending: false });
  const { data: itemsData } = await (ctx.isSuperAdmin ? itemsQuery : itemsQuery.eq("sector_id", ctx.sectorId!));
  const items = (itemsData ?? []) as StoreItem[];

  const ordersQuery = admin
    .from("store_orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(80);
  const { data: ordersData } = await (ctx.isSuperAdmin
    ? ordersQuery
    : ordersQuery.eq("sector_id", ctx.sectorId!));
  const orders = (ordersData ?? []) as StoreOrder[];

  const itemName = (id: string) => items.find((i) => i.id === id)?.name ?? "عنصر محذوف";
  const activeItems = items.filter((i) => i.is_active);
  const pending = orders.filter((o) => o.status === "pending");

  return (
    <div className="space-y-4">
      <PageHeader
        title="متجر النقاط"
        description="عناصر تُشترى بنقاط XP. الشراء يخصم النقاط والمخزون في قاعدة البيانات (RPC ذرية)، ثم يُسلَّم الطلب يدويًا."
      >
        <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold text-[#94a3b8]">
          {pending.length} طلب معلّق
        </span>
      </PageHeader>

      {sp.msg ? <Alert tone="success">{sp.msg}</Alert> : null}
      {sp.error ? <Alert tone="error">{sp.error}</Alert> : null}

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <Panel title={`الطلبات (${orders.length})`}>
            {orders.length === 0 ? (
              <EmptyState>لا توجد طلبات بعد. تظهر هنا بعد أول عملية شراء.</EmptyState>
            ) : (
              <ul className="max-h-96 space-y-1.5 overflow-y-auto text-[11px]">
                {orders.map((o) => (
                  <li key={o.id} className="rounded-lg bg-white/[0.03] px-2.5 py-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold">{itemName(o.item_id)}</span>
                      <Badge tone={ORDER_TONE[o.status]}>{ORDER_LABEL[o.status]}</Badge>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#94a3b8]">
                      <span className="font-mono" dir="ltr">
                        {o.discord_id}
                      </span>
                      <span>{o.price_paid} XP</span>
                      <span>{new Date(o.created_at).toLocaleDateString("ar-SA")}</span>
                    </div>
                    {o.status === "pending" && canWrite ? (
                      <div className="mt-1.5 flex gap-2">
                        <form action={fulfillOrder}>
                          <input type="hidden" name="id" value={o.id} />
                          <button
                            type="submit"
                            className="rounded-lg border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300 hover:bg-emerald-500/10"
                          >
                            تسليم
                          </button>
                        </form>
                        <form action={cancelOrder}>
                          <input type="hidden" name="id" value={o.id} />
                          <button
                            type="submit"
                            className="rounded-lg border border-red-500/40 px-2 py-0.5 text-[10px] font-bold text-red-300 hover:bg-red-500/10"
                          >
                            إلغاء وإرجاع النقاط
                          </button>
                        </form>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title={`عناصر المتجر (${items.length})`}>
            {items.length === 0 ? (
              <EmptyState>لا توجد عناصر. أضف أول عنصر من النموذج الجانبي.</EmptyState>
            ) : (
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.id} className="rounded-xl border border-white/[0.06] bg-[#0b0b0c]">
                    <details>
                      <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-[11px] font-bold">{item.name}</span>
                          {!item.is_active ? <Badge tone="danger">مخفي</Badge> : null}
                        </span>
                        <span className="shrink-0 text-[10px] text-[#94a3b8]">
                          {item.price} XP · {item.stock === null ? "∞" : `${item.stock} قطعة`}
                        </span>
                      </summary>
                      <div className="space-y-2 border-t border-white/[0.06] px-3 py-3">
                        {item.description ? (
                          <p className="text-[10px] leading-relaxed text-[#94a3b8]">{item.description}</p>
                        ) : null}
                        {canWrite ? (
                          <>
                            <form action={saveStoreItem} className="space-y-2">
                              <ItemFields item={item} />
                            </form>
                            <form action={deleteStoreItem}>
                              <input type="hidden" name="id" value={item.id} />
                              <DangerButton>حذف العنصر</DangerButton>
                            </form>
                          </>
                        ) : (
                          <p className="text-[10px] text-[#64748b]">عرض فقط.</p>
                        )}
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          {canWrite && ctx.sectorId ? (
            <>
              <Panel title="شراء نيابة عن عضو" description="يخصم النقاط من رصيد العضو ويُنشئ طلبًا قيد التسليم.">
                <form action={purchaseForMember} className="space-y-2">
                  <Field label="العنصر">
                    <select name="item_id" required className={inputCls}>
                      {activeItems.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name} — {i.price} XP
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="معرّف Discord">
                    <input name="discord_id" required dir="ltr" className={inputCls} />
                  </Field>
                  <SubmitButton className="!w-full" >تنفيذ الشراء</SubmitButton>
                  {activeItems.length === 0 ? (
                    <p className="text-[10px] text-amber-300">أضف عنصرًا متاحًا أولًا.</p>
                  ) : null}
                </form>
              </Panel>

              <Panel title="إضافة عنصر">
                <form action={saveStoreItem} className="space-y-2">
                  <ItemFields />
                </form>
              </Panel>
            </>
          ) : (
            <Panel title="إدارة المتجر">
              <EmptyState>لا تملك صلاحية تعديل المتجر، أو أن حسابك غير مرتبط بقطاع.</EmptyState>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
