"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ADMIN_NAV, hasPermission } from "@/lib/permissions";

export default function AdminSidebar({
  role,
  sectorName,
  sectorCode,
  sectorColor,
}: {
  role: string;
  sectorName: string;
  sectorCode: string;
  sectorColor: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items = ADMIN_NAV.filter((item) => {
    if (item.superOnly && role !== "super_admin") return false;
    if (item.permission && !hasPermission(role, item.permission)) return false;
    return true;
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--sector-main)] text-xl text-white shadow-xl lg:hidden"
        aria-label="قائمة لوحة الإدارة"
      >
        {open ? "✕" : "☰"}
      </button>

      <aside
        className={`fixed inset-y-0 right-0 z-30 w-64 transform border-l border-white/[0.06] bg-[#101012] transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
        style={{ ["--sector-main" as string]: sectorColor }}
      >
        <div className="flex h-16 items-center gap-2 border-b border-white/[0.06] px-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--sector-main)] text-sm text-white">
            {sectorCode}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-extrabold">{sectorName}</p>
            <p className="text-[10px] text-[#94a3b8]">لوحة الإدارة</p>
          </div>
        </div>

        <nav className="flex flex-col gap-0.5 p-3">
          {items.map((item) => {
            const active =
              item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                  active
                    ? "bg-[var(--sector-main)] text-white"
                    : "text-[#94a3b8] hover:bg-white/5 hover:text-white"
                }`}
              >
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/[0.06] p-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] text-[#94a3b8] hover:bg-white/5 hover:text-white"
          >
            ← الموقع العام
          </Link>
        </div>
      </aside>
    </>
  );
}
