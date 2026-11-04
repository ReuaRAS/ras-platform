"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import DiscordModal from "./DiscordModal";

const LINKS = [
  { href: "/", label: "الرئيسية" },
  { href: "/sectors/red-crescent", label: "القطاعات" },
  { href: "/certificates", label: "الشهادات" },
  { href: "/tools/field-name-generator", label: "الأدوات" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [discord, setDiscord] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0d0d0d]/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#c62828] to-[#7f1d1d] text-lg">
              🛡️
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-extrabold">منصة قطاعات الرس</span>
              <span className="block text-[10px] text-[#94a3b8]">أكاديمية الرس الذكية</span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => {
              const active =
                l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-white/10 text-white"
                      : "text-[#94a3b8] hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
            <Link
              href="/certificates#verify"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-[#94a3b8] transition-colors hover:bg-white/5 hover:text-white"
            >
              تحقق
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDiscord(true)}
              className="btn btn-ghost hidden !px-3 !py-1.5 text-xs sm:inline-flex"
            >
              💬 ديسكورد
            </button>
            <Link href="/admin" className="btn btn-primary !px-3 !py-1.5 text-xs">
              لوحة الإدارة
            </Link>
            <button
              type="button"
              aria-label="القائمة"
              onClick={() => setOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-lg md:hidden"
            >
              {open ? "✕" : "☰"}
            </button>
          </div>
        </nav>

        {open && (
          <div className="border-t border-white/[0.06] px-4 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              {[...LINKS, { href: "/certificates#verify", label: "تحقق من شهادة" }].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-[#94a3b8] hover:bg-white/5 hover:text-white"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      <DiscordModal open={discord} onClose={() => setDiscord(false)} />
    </>
  );
}
