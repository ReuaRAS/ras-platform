import type { SupabaseClient } from "@supabase/supabase-js";
import { generateCertificatePdf } from "@/lib/pdf/generate";
import { logAudit } from "@/lib/audit";

export type IssueParams = {
  admin: SupabaseClient;
  attemptId: string;
  attempt: {
    id: string;
    sector_id: string;
    course_id: string | null;
    trainee_name: string;
    discord_username: string;
    discord_id: string;
    score: number;
    percentage: number;
  };
  course: {
    title: string;
    certificate_prefix: string;
    duration_days: number | null;
  } | null;
  sector: { id: string; name: string; sector_code: string; primary_color: string | null };
  appUrl: string;
  testTitle: string;
  ip?: string | null;
};

export type IssueResult = {
  certificateNo: string;
  verifyUrl: string;
  pdfUrl: string | null;
  expiresAt: string | null;
  warning?: string;
};

/**
 * إصدار شهادة لمحاولة ناجحة:
 * رقم فريد (issue_certificate_number) → PDF + QR → رفع إلى Storage → إدراج السجل
 * → audit log → +100 XP.
 *
 * يفشل الجزء البصري (PDF) دون إفشال إصدار الرقم والسجل.
 */
export async function issueCertificate(params: IssueParams): Promise<IssueResult> {
  const { admin, attempt, course, sector, appUrl, testTitle } = params;
  const year = new Date().getFullYear();
  const prefix = course?.certificate_prefix ?? `${sector.sector_code}-REC`;
  const issuedAt = new Date();

  // 1) رقم الشهادة الذري
  const { data: numberData, error: numberError } = await admin.rpc("issue_certificate_number", {
    p_sector_id: sector.id,
    p_prefix: prefix,
    p_year: year,
  });

  if (numberError || !numberData) {
    throw new Error(`تعذّر توليد رقم الشهادة: ${numberError?.message ?? "unknown"}`);
  }

  const certificateNo = String(numberData);
  const verifyUrl = `${appUrl}/verify/${encodeURIComponent(certificateNo)}`;
  const courseTitle = course?.title ?? testTitle;

  let expiresAt: string | null = null;
  if (course?.duration_days) {
    const d = new Date(issuedAt);
    d.setDate(d.getDate() + course.duration_days);
    expiresAt = d.toISOString();
  }

  // 2) PDF + QR
  let pdfUrl: string | null = null;
  let warning: string | undefined;

  try {
    const pdfBytes = await generateCertificatePdf({
      certificateNo,
      traineeName: attempt.trainee_name,
      courseTitle,
      sectorName: sector.name,
      sectorCode: sector.sector_code,
      percentage: Number(attempt.percentage),
      issuedAt,
      verifyUrl,
      sectorColor: sector.primary_color ?? undefined,
    });

    const storagePath = `${sector.sector_code}/${year}/${certificateNo}.pdf`;
    const { error: uploadError } = await admin.storage
      .from("certificates")
      .upload(storagePath, pdfBytes, { contentType: "application/pdf", upsert: true });

    if (uploadError) {
      warning = `تم إصدار رقم الشهادة، لكن فشل رفع الملف: ${uploadError.message}`;
    } else {
      const { data: pub } = admin.storage.from("certificates").getPublicUrl(storagePath);
      pdfUrl = pub.publicUrl;
    }
  } catch (err) {
    warning = `تم إصدار رقم الشهادة، لكن تعذّر توليد PDF: ${
      err instanceof Error ? err.message : "خطأ غير معروف"
    }`;
  }

  // 3) إدراج الشهادة (snapshot للبيانات)
  const { error: insertError } = await admin.from("certificates").insert({
    certificate_no: certificateNo,
    sector_id: sector.id,
    course_id: attempt.course_id,
    test_attempt_id: attempt.id,
    trainee_name: attempt.trainee_name,
    discord_username: attempt.discord_username,
    discord_id: attempt.discord_id,
    course_title: courseTitle,
    score: attempt.score,
    percentage: attempt.percentage,
    pdf_url: pdfUrl,
    qr_code_url: verifyUrl,
    verify_url: verifyUrl,
    status: "valid",
    issued_at: issuedAt.toISOString(),
    expires_at: expiresAt,
  });

  if (insertError) {
    throw new Error(`تعذّر حفظ الشهادة: ${insertError.message}`);
  }

  // 4) Audit log
  await logAudit(admin, {
    sectorId: sector.id,
    action: "certificate.issue",
    entityType: "certificate",
    entityId: attempt.id,
    metadata: { certificate_no: certificateNo, percentage: attempt.percentage, test: testTitle },
    ipAddress: params.ip ?? null,
  });

  // 5) XP (بنية المرحلة 8)
  await addXp(admin, attempt.discord_id, sector.id, 100);

  return { certificateNo, verifyUrl, pdfUrl, expiresAt, warning };
}

/** إضافة نقاط XP — بنية تحتية للمرحلة 8 (لا تُفشل العملية). */
export async function addXp(
  admin: SupabaseClient,
  discordId: string,
  sectorId: string,
  amount: number,
): Promise<void> {
  try {
    const { data: existing } = await admin
      .from("member_xp")
      .select("id, total_xp")
      .eq("discord_id", discordId)
      .maybeSingle();

    if (existing) {
      await admin
        .from("member_xp")
        .update({
          total_xp: Number(existing.total_xp ?? 0) + amount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await admin.from("member_xp").insert({
        discord_id: discordId,
        sector_id: sectorId,
        total_xp: amount,
      });
    }
  } catch {
    // المرحلة 8 — تُعامل كإضافة تجميلية
  }
}
