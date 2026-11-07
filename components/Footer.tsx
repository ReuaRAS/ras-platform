import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative z-10 mt-20 border-t border-white/[0.06] bg-black/30">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#c62828] to-[#7f1d1d]">
              <ShieldCheck className="h-4 w-4 text-white" aria-hidden="true" />
            </span>
            <span className="text-sm font-extrabold">منصة قطاعات محافظة الرس</span>
          </div>
          <p className="text-xs leading-relaxed text-[#94a3b8]">
            أكاديمية الرس الذكية — منصة ويب متكاملة تجمع قطاعات محافظة الرس مع القوانين
            والدورات والاختبارات والشهادات المعتمدة.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-extrabold">روابط سريعة</h2>
          <ul className="space-y-2 text-xs text-[#94a3b8]">
            <li>
              <Link href="/certificates" className="hover:text-white">
                البحث عن شهادة
              </Link>
            </li>
            <li>
              <Link href="/certificates#verify" className="hover:text-white">
                التحقق من شهادة
              </Link>
            </li>
            <li>
              <Link href="/tools/field-name-generator" className="hover:text-white">
                مولد الأسامي الميدانية
              </Link>
            </li>
            <li>
              <Link href="/admin" className="hover:text-white">
                لوحة الإدارة
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-extrabold">قانوني</h2>
          <ul className="space-y-2 text-xs text-[#94a3b8]">
            <li>
              <Link href="/privacy" className="hover:text-white">
                سياسة الخصوصية
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white">
                شروط الاستخدام
              </Link>
            </li>
          </ul>
          <p className="mt-4 text-[11px] leading-relaxed text-[#64748b]">
            هذا الموقع غير تابع رسميًا لـ Rockstar Games أو FiveM. جميع العلامات التجارية
            ملك لأصحابها.
          </p>
        </div>
      </div>

      <div className="border-t border-white/[0.06] py-5 text-center text-[11px] text-[#64748b]">
        © 2026 <span className="font-bold text-[#94a3b8]">NJM</span> — جميع الحقوق محفوظة.
      </div>
    </footer>
  );
}
