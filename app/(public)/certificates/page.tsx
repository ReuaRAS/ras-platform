import type { Metadata } from "next";
import { Award, FileText, Fingerprint, QrCode, Search, type LucideIcon } from "lucide-react";
import CertificateCard from "@/components/CertificateCard";
import { getCertificateByNo, getSectors } from "@/lib/data";
import { APP_URL } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "الشهادات",
  description: "ابحث عن شهادة برقمها للتحقق من صحتها وتحميل نسخة PDF.",
};

export default async function CertificatesPage({
  searchParams,
}: {
  searchParams: Promise<{ no?: string }>;
}) {
  const { no } = await searchParams;
  const query = (no ?? "").trim();
  const certificate = query ? await getCertificateByNo(query) : null;
  const sectors = await getSectors();
  const sector = certificate
    ? sectors.find((s) => s.id === certificate.sector_id)
    : null;

  const verifyUrl = certificate
    ? (certificate.verify_url ?? `${APP_URL}/verify/${encodeURIComponent(certificate.certificate_no)}`)
    : "";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <header className="mb-8 text-center">
        <h1 className="flex items-center justify-center gap-2 text-2xl font-black sm:text-3xl">
          <Award className="h-6 w-6 text-[#f9a825]" aria-hidden="true" />
          <span className="gold-text">الشهادات</span>
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-[#94a3b8]">
          أدخل رقم الشهادة للتحقق منها وعرض بياناتها وتحميل ملف PDF. للتحقق المباشر استخدم
          رابط QR المطبوع على الشهادة.
        </p>
      </header>

      <form action="/certificates" method="get" className="glass-card mb-8 rounded-2xl p-4">
        <label htmlFor="no" className="label">
          رقم الشهادة
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="no"
            name="no"
            defaultValue={query}
            placeholder="RCA-CO-2026-0001"
            className="field font-mono"
            dir="ltr"
            required
          />
          <button type="submit" className="btn btn-primary shrink-0 text-xs">
            بحث
          </button>
        </div>
      </form>

      {query ? (
        certificate ? (
          <CertificateCard
            certificate={certificate}
            sectorName={sector?.name ?? ""}
            sectorColor={sector?.primary_color ?? "#c62828"}
            verifyUrl={verifyUrl}
          />
        ) : (
          <div className="glass-panel rounded-2xl border border-dashed border-white/15 p-10 text-center">
            <Search className="mx-auto h-6 w-6 text-[#64748b]" aria-hidden="true" />
            <h2 className="mt-2 text-sm font-extrabold">لا توجد شهادة بهذا الرقم</h2>
            <p className="mt-1 text-xs text-[#94a3b8]">
              تأكد من كتابة الرقم كاملًا كما هو مطبوع على الشهادة.
            </p>
          </div>
        )
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {([
            { Icon: Fingerprint, t: "رقم فريد", d: "كل شهادة تصدر برقم لا يتكرر أبدًا." },
            { Icon: QrCode, t: "QR فوري", d: "رمز QR يفتح صفحة تحقق رسمية." },
            { Icon: FileText, t: "نسخة PDF", d: "ملف قابل للتحميل والطباعة." },
          ] as { Icon: LucideIcon; t: string; d: string }[]).map((f) => (
            <div key={f.t} className="glass-card rounded-2xl p-4 text-center">
              <f.Icon className="mx-auto h-5 w-5 text-[#f9a825]" aria-hidden="true" />
              <h2 className="mt-1 text-xs font-extrabold">{f.t}</h2>
              <p className="mt-1 text-[11px] leading-relaxed text-[#94a3b8]">{f.d}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
