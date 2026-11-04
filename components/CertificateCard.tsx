import QRCode from "qrcode";
import { formatDate } from "@/lib/utils";
import type { Certificate } from "@/lib/types";

/**
 * بطاقة عرض الشهادة — لا تُظهر أي بيانات حساسة
 * (لا Discord ID، لا العمر، لا الرتبة).
 */
export default async function CertificateCard({
  certificate,
  sectorName,
  sectorColor,
  verifyUrl,
  showVerifyLink = true,
}: {
  certificate: Certificate;
  sectorName: string;
  sectorColor: string;
  verifyUrl: string;
  showVerifyLink?: boolean;
}) {
  const expired =
    certificate.status === "valid" &&
    certificate.expires_at !== null &&
    new Date(certificate.expires_at).getTime() < Date.now();

  const status = certificate.status === "revoked" ? "revoked" : expired ? "expired" : "valid";

  const qrSvg = await QRCode.toString(verifyUrl, {
    type: "svg",
    margin: 1,
    width: 132,
    color: { dark: "#111111", light: "#ffffff" },
  });

  const badge =
    status === "valid"
      ? { cls: "badge-success", text: "✔ شهادة صحيحة" }
      : status === "revoked"
        ? { cls: "badge-danger", text: "✖ شهادة ملغاة" }
        : { cls: "badge-warn", text: "⌛ شهادة منتهية" };

  return (
    <article
      className="glass-card overflow-hidden rounded-3xl"
      style={{ ["--sector-main" as string]: sectorColor }}
    >
      <div
        className="h-1.5"
        style={{ background: `linear-gradient(90deg, ${sectorColor}, transparent)` }}
      />
      <div className="grid gap-5 p-6 sm:grid-cols-[1fr_150px] sm:p-8">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className={`badge ${badge.cls}`}>{badge.text}</span>
            <span className="badge badge-muted">{sectorName}</span>
          </div>

          <p className="text-[11px] text-[#94a3b8]">تُمنح هذه الشهادة إلى</p>
          <h2 className="mt-1 text-xl font-black sm:text-2xl">{certificate.trainee_name}</h2>

          <p className="mt-3 text-sm font-bold" style={{ color: sectorColor }}>
            {certificate.course_title}
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <div>
              <dt className="text-[#94a3b8]">النسبة</dt>
              <dd className="mt-0.5 font-extrabold">{Number(certificate.percentage)}%</dd>
            </div>
            <div>
              <dt className="text-[#94a3b8]">النقاط</dt>
              <dd className="mt-0.5 font-extrabold">{certificate.score}</dd>
            </div>
            <div>
              <dt className="text-[#94a3b8]">تاريخ الإصدار</dt>
              <dd className="mt-0.5 font-extrabold">{formatDate(certificate.issued_at)}</dd>
            </div>
            <div>
              <dt className="text-[#94a3b8]">الانتهاء</dt>
              <dd className="mt-0.5 font-extrabold">
                {certificate.expires_at ? formatDate(certificate.expires_at) : "غير محدد"}
              </dd>
            </div>
          </dl>

          <p className="mt-4 font-mono text-[11px] text-[#94a3b8]" dir="ltr">
            {certificate.certificate_no}
          </p>

          {status === "revoked" && certificate.revoked_reason && (
            <p className="mt-3 rounded-xl border border-[#c62828]/40 bg-[#c62828]/10 px-3 py-2 text-[11px] text-[#f87171]">
              سبب الإلغاء: {certificate.revoked_reason}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {certificate.pdf_url && (
              <a
                href={certificate.pdf_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary text-xs"
              >
                ⬇️ تحميل PDF
              </a>
            )}
            {showVerifyLink && (
              <a href={verifyUrl} className="btn btn-ghost text-xs">
                صفحة التحقق
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-2">
          <div
            className="rounded-xl bg-white p-2"
            // رمز QR مُولَّد على السيرفر برابط التحقق
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <p className="text-center text-[9px] leading-relaxed text-[#94a3b8]">
            امسح الرمز للتحقق من الشهادة
          </p>
        </div>
      </div>
    </article>
  );
}
