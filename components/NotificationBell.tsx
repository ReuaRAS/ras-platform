import Link from "next/link";
import { markAllNotificationsRead } from "@/lib/admin/actions-notifications";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * جرس الإشعارات (المرحلة 13 — بنية أساسية).
 * يقرأ غير المقروء من جدول notifications للمستخدم الحالي فقط (RLS).
 * يعمل بصمت إذا لم تُهيّأ قاعدة البيانات أو لم يوجد الجدول.
 */
export default async function NotificationBell() {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error, count } = await supabase
    .from("notifications")
    .select("id, title, href, created_at", { count: "exact" })
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) return null;

  const items = data ?? [];
  const unread = count ?? items.length;

  return (
    <details className="relative">
      <summary
        className="flex h-9 cursor-pointer list-none items-center gap-1 rounded-lg border border-white/10 px-2 text-xs text-[#94a3b8] hover:bg-white/5 hover:text-white"
        aria-label={`الإشعارات${unread ? ` (${unread} غير مقروء)` : ""}`}
      >
        <span aria-hidden="true">🔔</span>
        {unread > 0 ? (
          <span className="rounded-full bg-[var(--sector-main)] px-1.5 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </summary>

      <div className="absolute left-0 z-40 mt-2 w-72 rounded-xl border border-white/10 bg-[#141416] p-2 shadow-2xl">
        {items.length === 0 ? (
          <p className="px-2 py-3 text-[11px] text-[#94a3b8]">لا توجد إشعارات غير مقروءة.</p>
        ) : (
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href || "/admin"}
                  className="block rounded-lg px-2 py-2 text-[11px] hover:bg-white/5"
                >
                  <span className="block font-bold">{item.title}</span>
                  <span className="block text-[10px] text-[#64748b]">
                    {new Date(item.created_at).toLocaleString("ar-SA", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-1 flex items-center justify-between gap-2 border-t border-white/[0.06] px-2 pt-2">
          <Link href="/admin/notifications" className="text-[10px] font-bold text-[var(--sector-light)]">
            كل الإشعارات ←
          </Link>
          {unread > 0 ? (
            <form action={markAllNotificationsRead}>
              <input type="hidden" name="redirect_to" value="/admin" />
              <button type="submit" className="text-[10px] text-[#64748b] hover:text-white">
                تحديد الكل كمقروء
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </details>
  );
}
