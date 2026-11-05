import { requirePermission } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DiscordEvent, Sector } from "@/lib/types";
import { Alert, Badge, EmptyState, PageHeader, Panel } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminDiscordPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; error?: string }>;
}) {
  const ctx = await requirePermission("discord.read");
  const sp = await searchParams;
  const admin = createAdminClient();

  const eventsQuery = admin
    .from("discord_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  const { data } = await (ctx.isSuperAdmin ? eventsQuery : eventsQuery.eq("sector_id", ctx.sectorId!));
  const events = (data ?? []) as DiscordEvent[];

  const { data: sectorsData } = await admin.from("sectors").select("id, name, sector_code");
  const sectors = (sectorsData ?? []) as Pick<Sector, "id" | "name" | "sector_code">[];
  const sectorName = (id: string | null) => {
    const s = sectors.find((x) => x.id === id);
    return s ? `${s.name} (${s.sector_code})` : "—";
  };

  const hasKey = Boolean(process.env.DISCORD_PUBLIC_KEY);

  return (
    <div className="space-y-4">
      <PageHeader
        title="الربط مع Discord"
        description="يستقبل الموقع أحداث Discord عبر /api/discord/webhook بعد التحقق من التوقيع (Ed25519)، ويسجّلها هنا لكل قطاع."
      >
        <Badge tone={hasKey ? "success" : "warning"}>
          {hasKey ? "المفتاح العام مضبوط" : "DISCORD_PUBLIC_KEY غير مضبوط"}
        </Badge>
      </PageHeader>

      {sp.msg ? <Alert tone="success">{sp.msg}</Alert> : null}
      {sp.error ? <Alert tone="error">{sp.error}</Alert> : null}

      {!hasKey ? (
        <Alert tone="info">
          أضف المتغير <code dir="ltr">DISCORD_PUBLIC_KEY</code> في بيئة النشر (Netlify → Environment
          variables) بقيمة Public Key من صفحة تطبيق Discord. حتى ذلك الحين يرفض المسار كل الطلبات
          بالرمز 503، ولا يُسجَّل أي حدث.
        </Alert>
      ) : null}

      <Panel title="طريقة التشغيل">
        <ol className="list-decimal space-y-1 pe-5 text-[11px] leading-relaxed text-[#cbd5e1]">
          <li>
            أنشئ تطبيقًا في Discord Developer Portal، وضع رابط التفاعل:{" "}
            <code dir="ltr" className="text-[var(--sector-light)]">
              https://ras-sectors.netlify.app/api/discord/webhook
            </code>
          </li>
          <li>
            انسخ <span className="font-bold">Public Key</span> إلى متغير البيئة{" "}
            <code dir="ltr">DISCORD_PUBLIC_KEY</code>، ثم أعد النشر.
          </li>
          <li>
            ضع <code dir="ltr">discord_guild_id</code> لكل قطاع في جدول sectors حتى تُنسب الأحداث
            للقطاع الصحيح.
          </li>
          <li>
            أي طلب بلا توقيع صحيح يُرفض بـ 401 ولا يُسجَّل. يُسجَّل الحدث في{" "}
            <code dir="ltr">discord_events</code> أدناه.
          </li>
        </ol>
      </Panel>

      <Panel title={`أحدث الأحداث (${events.length})`}>
        {events.length === 0 ? (
          <EmptyState>لا توجد أحداث مسجّلة بعد.</EmptyState>
        ) : (
          <ul className="max-h-[28rem] space-y-1.5 overflow-y-auto text-[11px]">
            {events.map((e) => (
              <li key={e.id} className="rounded-lg bg-white/[0.03] px-2.5 py-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold">{e.event_type}</span>
                  <span className="text-[10px] text-[#94a3b8]">{sectorName(e.sector_id)}</span>
                  <span className="text-[10px] text-[#64748b]">
                    {new Date(e.created_at).toLocaleString("ar-SA", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                <pre
                  dir="ltr"
                  className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap break-all rounded bg-black/40 p-1.5 text-[9px] text-[#64748b]"
                >
                  {JSON.stringify(e.payload).slice(0, 600)}
                </pre>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
