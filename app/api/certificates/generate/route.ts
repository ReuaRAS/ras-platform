import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateCertificatePdf } from "@/lib/pdf/generate";
import { APP_URL } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * إعادة توليد ملف PDF لشهادة موجودة (للاستخدام من لوحة الإدارة أو عند فشل الرفع).
 * POST { certificateNo }
 */
export async function POST(req: Request) {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Supabase غير مهيّأ." }, { status: 503 });
  }

  const body = (await req.json().catch(() => null)) as { certificateNo?: string } | null;
  const certificateNo = body?.certificateNo?.trim();
  if (!certificateNo) {
    return NextResponse.json({ error: "رقم الشهادة مطلوب." }, { status: 400 });
  }

  const { data: cert } = await admin
    .from("certificates")
    .select(
      "certificate_no, trainee_name, course_title, percentage, issued_at, verify_url, sector_id, status",
    )
    .eq("certificate_no", certificateNo)
    .maybeSingle();

  if (!cert) return NextResponse.json({ error: "الشهادة غير موجودة." }, { status: 404 });

  const { data: sector } = await admin
    .from("sectors")
    .select("name, sector_code, primary_color")
    .eq("id", cert.sector_id)
    .maybeSingle();

  const verifyUrl = cert.verify_url ?? `${APP_URL}/verify/${encodeURIComponent(certificateNo)}`;

  const pdfBytes = await generateCertificatePdf({
    certificateNo: cert.certificate_no,
    traineeName: cert.trainee_name,
    courseTitle: cert.course_title,
    sectorName: sector?.name ?? "",
    sectorCode: sector?.sector_code ?? "",
    percentage: Number(cert.percentage),
    issuedAt: new Date(cert.issued_at),
    verifyUrl,
    sectorColor: sector?.primary_color ?? undefined,
  });

  const path = `${sector?.sector_code ?? "GEN"}/${new Date(cert.issued_at).getFullYear()}/${cert.certificate_no}.pdf`;
  const { error: uploadError } = await admin.storage
    .from("certificates")
    .upload(path, pdfBytes, { contentType: "application/pdf", upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: pub } = admin.storage.from("certificates").getPublicUrl(path);
  await admin
    .from("certificates")
    .update({ pdf_url: pub.publicUrl, qr_code_url: verifyUrl })
    .eq("certificate_no", certificateNo);

  return NextResponse.json({ pdfUrl: pub.publicUrl, verifyUrl });
}
