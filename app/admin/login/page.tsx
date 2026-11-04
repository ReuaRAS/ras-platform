import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "@/components/admin/LoginForm";
import { TURNSTILE_SITE_KEY } from "@/lib/turnstile";

export const metadata: Metadata = {
  title: "دخول الإدارة",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <LoginForm siteKey={TURNSTILE_SITE_KEY} />
      <Link href="/" className="mt-5 text-[11px] text-[#94a3b8] hover:text-white">
        ← العودة إلى الصفحة الرئيسية
      </Link>
    </div>
  );
}
