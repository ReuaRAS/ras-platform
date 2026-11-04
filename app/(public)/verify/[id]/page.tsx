import type { Metadata } from "next";
import CertificateCard from "@/components/CertificateCard";
import { getCertificateByNo, getSectors } from "@/lib/data";
import { APP_URL } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "التحقق من شهادة",
  robots: { index: false, follow: false },
};

export default async function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const certificateNo = decodeURIComponent(id);
  const certificate = await getCertificateByNo(certificateNo);
  const sectors = await getSectors();
  const sector = certificate ? sectors.find((s) => s.id === certificate.sector_id) : null;

  if (!certificate) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="glass-card rounded-3xl border border-[#c62828]/30 p-8 text-center">
          <p className="text-4xl" aria-hidden="true">
            ❌
          </p>
          <h1 className="mt-3 text-xl font-black text-[#f87171]">شهادة غير موجودة</h1>
          <p className="mt-2 text-xs leading-relaxed text-[#94a3b8]">
            الرقم <span className="font-mono text-white">{certificateNo}</span> غير مسجّل في
            قاعدة البيانات. تأكد من الرقم أو امسح رمز QR المطبوع على الشهادة.
          </p>
        </div>
      </div>
    );
  }

  const verifyUrl =
    certificate.verify_url ?? `${APP_URL}/verify/${encodeURIComponent(certificate.certificate_no)}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <header className="mb-6 text-center">
        <h1 className="text-xl font-black sm:text-2xl">🔎 التحقق من شهادة</h1>
        <p className="mt-1 text-xs text-[#94a3b8]">
          نتيجة التحقق الرسمية من سجلات منصة قطاعات محافظة الرس.
        </p>
      </header>

      <CertificateCard
        certificate={certificate}
        sectorName={sector?.name ?? ""}
        sectorColor={sector?.primary_color ?? "#c62828"}
        verifyUrl={verifyUrl}
        showVerifyLink={false}
      />
    </div>
  );
}
