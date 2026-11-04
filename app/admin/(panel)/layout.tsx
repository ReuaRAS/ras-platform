import type { Metadata } from "next";
import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import NotificationBell from "@/components/NotificationBell";
import { requireStaff } from "@/lib/auth/guard";
import { logoutAction } from "@/lib/auth/actions";
import { ROLE_LABELS } from "@/lib/types";

export const metadata: Metadata = {
  title: "لوحة الإدارة",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ctx = await requireStaff();
  const color = ctx.sector?.primary_color ?? "#8e44ad";
  const sectorName = ctx.sector?.name ?? "كل القطاعات";
  const sectorCode = ctx.sector?.sector_code ?? "ALL";

  return (
    <div
      className="flex min-h-screen bg-[#0b0b0c]"
      style={{ ["--sector-main" as string]: color }}
    >
      <AdminSidebar
        role={ctx.role}
        sectorName={sectorName}
        sectorCode={sectorCode}
        sectorColor={color}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-3 border-b border-white/[0.06] bg-[#101012] px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span
              className="hidden h-2 w-2 rounded-full sm:block"
              style={{ background: color }}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="truncate text-xs font-extrabold">{sectorName}</p>
              <p className="text-[10px] text-[#94a3b8]">
                {ROLE_LABELS[ctx.role] ?? ctx.role}
                {ctx.displayName ? ` · ${ctx.displayName}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link href="/" className="btn btn-ghost !px-3 !py-1.5 text-[11px]">
              الموقع
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="btn btn-ghost !px-3 !py-1.5 text-[11px]">
                خروج
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
