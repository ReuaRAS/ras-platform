import fs from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import QRCode from "qrcode";
import { shapeArabic } from "./arabic";

export type CertificatePdfInput = {
  certificateNo: string;
  traineeName: string;
  courseTitle: string;
  sectorName: string;
  sectorCode: string;
  percentage: number;
  issuedAt: Date;
  verifyUrl: string;
  sectorColor?: string;
  organization?: string;
};

const A4_LANDSCAPE = { width: 841.89, height: 595.28 };

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return rgb(0.776, 0.157, 0.157);
  return rgb(
    parseInt(clean.slice(0, 2), 16) / 255,
    parseInt(clean.slice(2, 4), 16) / 255,
    parseInt(clean.slice(4, 6), 16) / 255,
  );
}

async function loadFonts(doc: PDFDocument): Promise<{
  regular: PDFFont;
  bold: PDFFont;
}> {
  // خط عربي (Tajawal) من public/fonts — يُضمَّن في ملف الـPDF
  const dir = path.join(process.cwd(), "public", "fonts");
  const readFirst = async (names: string[]) => {
    for (const name of names) {
      try {
        return await fs.readFile(path.join(dir, name));
      } catch {
        // جرّب الاسم التالي
      }
    }
    throw new Error(`لم يُعثر على خط عربي في ${dir} (${names.join(" / ")})`);
  };

  try {
    const [reg, bold] = await Promise.all([
      readFirst(["Amiri-Regular.ttf", "Tajawal-Regular.ttf", "tajawal.ttf"]),
      readFirst(["Amiri-Bold.ttf", "Tajawal-Bold.ttf", "tajawal-bold.ttf"]),
    ]);
    // subset:true يسقط معظم الحروف العربية لهذا الخط في قارئات PDF، فنضمّن الخط كاملًا
    return {
      regular: await doc.embedFont(new Uint8Array(reg), { subset: false }),
      bold: await doc.embedFont(new Uint8Array(bold), { subset: false }),
    };
  } catch {
    // احتياطي: خط لاتيني (قد لا يدعم العربية) — يمنع فشل إصدار الشهادة
    return {
      regular: await doc.embedFont(StandardFonts.Helvetica),
      bold: await doc.embedFont(StandardFonts.HelveticaBold),
    };
  }
}

function drawCentered(
  page: PDFPage,
  text: string,
  y: number,
  font: PDFFont,
  size: number,
  color = rgb(0.1, 0.1, 0.12),
) {
  const shaped = shapeArabic(text);
  const width = font.widthOfTextAtSize(shaped, size);
  page.drawText(shaped, {
    x: (A4_LANDSCAPE.width - width) / 2,
    y,
    size,
    font,
    color,
  });
  return width;
}

function drawRightAligned(
  page: PDFPage,
  text: string,
  rightX: number,
  y: number,
  font: PDFFont,
  size: number,
  color = rgb(0.1, 0.1, 0.12),
) {
  const shaped = shapeArabic(text);
  const width = font.widthOfTextAtSize(shaped, size);
  page.drawText(shaped, { x: rightX - width, y, size, font, color });
}

/**
 * ينشئ شهادة A4 أفقية: شعار NJM أعلى اليسار، شعار/كود القطاع أعلى اليمين،
 * QR وتوقيع NJM أسفل اليسار، توقيع القطاع أسفل اليمين.
 */
export async function generateCertificatePdf(
  input: CertificatePdfInput,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  // مطلوب لتضمين خطوط TTF عربية داخل ملف الـPDF
  doc.registerFontkit(fontkit);
  const page = doc.addPage([A4_LANDSCAPE.width, A4_LANDSCAPE.height]);
  const { regular, bold } = await loadFonts(doc);

  const sectorColor = hexToRgb(input.sectorColor ?? "#c62828");
  const dark = rgb(0.09, 0.09, 0.11);
  const muted = rgb(0.42, 0.45, 0.5);
  const cream = rgb(0.996, 0.98, 0.95);

  const { width: W, height: H } = A4_LANDSCAPE;

  // خلفية
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: cream });

  // إطار مزدوج
  page.drawRectangle({
    x: 24,
    y: 24,
    width: W - 48,
    height: H - 48,
    borderColor: sectorColor,
    borderWidth: 2.5,
    opacity: 1,
  });
  page.drawRectangle({
    x: 32,
    y: 32,
    width: W - 64,
    height: H - 64,
    borderColor: rgb(0.78, 0.63, 0.2),
    borderWidth: 0.8,
  });

  // شريط علوي بلون القطاع
  page.drawRectangle({
    x: 32,
    y: H - 62,
    width: W - 64,
    height: 30,
    color: sectorColor,
    opacity: 0.92,
  });

  // NJM — أعلى اليسار
  page.drawText("NJM", {
    x: 52,
    y: H - 58,
    size: 15,
    font: bold,
    color: rgb(1, 1, 1),
  });
  // القطاع — أعلى اليمين
  drawRightAligned(
    page,
    `${input.sectorName} — ${input.sectorCode}`,
    W - 52,
    H - 55,
    bold,
    13,
    rgb(1, 1, 1),
  );

  // العنوان
  drawCentered(page, "شهادة إتمام دورة", H - 130, bold, 34, dark);
  page.drawRectangle({
    x: W / 2 - 90,
    y: H - 145,
    width: 180,
    height: 2.5,
    color: rgb(0.78, 0.63, 0.2),
  });

  // اسم الدورة
  drawCentered(page, input.courseTitle, H - 185, bold, 20, sectorColor);

  // الممنوح له
  drawCentered(page, "تُمنح هذه الشهادة إلى", H - 230, regular, 13, muted);
  drawCentered(page, input.traineeName, H - 275, bold, 28, dark);
  page.drawRectangle({
    x: W / 2 - 160,
    y: H - 288,
    width: 320,
    height: 1,
    color: rgb(0.8, 0.8, 0.82),
  });

  // النسبة
  drawCentered(
    page,
    `لاجتيازه الدورة بنسبة ${Number(input.percentage).toFixed(2)}%`,
    H - 322,
    regular,
    14,
    dark,
  );

  // رقم الشهادة والتاريخ
  const issued = input.issuedAt.toISOString().slice(0, 10);
  drawCentered(
    page,
    `رقم الشهادة: ${input.certificateNo}    •    تاريخ الإصدار: ${issued}`,
    H - 356,
    regular,
    12,
    muted,
  );

  // QR — أسفل اليسار
  const qrPng = await QRCode.toBuffer(input.verifyUrl, {
    margin: 0,
    width: 220,
    errorCorrectionLevel: "M",
    color: { dark: "#111111", light: "#ffffff" },
  });
  const qrImage = await doc.embedPng(new Uint8Array(qrPng));
  const qrSize = 92;
  page.drawImage(qrImage, { x: 56, y: 62, width: qrSize, height: qrSize });

  // تحقق + توقيع NJM — أسفل اليسار
  page.drawText("Verify", { x: 56, y: 50, size: 8, font: regular, color: muted });
  drawRightAligned(page, "توقيع NJM", 56 + qrSize + 120, 96, bold, 12, dark);
  page.drawLine({
    start: { x: 56 + qrSize + 8, y: 90 },
    end: { x: 56 + qrSize + 118, y: 90 },
    thickness: 0.8,
    color: rgb(0.75, 0.75, 0.78),
  });
  drawRightAligned(page, "الإدارة العامة", 56 + qrSize + 120, 78, regular, 9, muted);

  // توقيع القطاع — أسفل اليمين
  drawRightAligned(page, "توقيع القطاع", W - 70, 96, bold, 12, dark);
  page.drawLine({
    start: { x: W - 190, y: 90 },
    end: { x: W - 70, y: 90 },
    thickness: 0.8,
    color: rgb(0.75, 0.75, 0.78),
  });
  drawRightAligned(
    page,
    `قيادة ${input.sectorName}`,
    W - 70,
    78,
    regular,
    9,
    muted,
  );

  // رابط التحقق في الوسط أسفل
  drawCentered(page, input.verifyUrl, 40, regular, 8, muted);

  // تذييل
  drawCentered(
    page,
    `${input.organization ?? "منصة قطاعات محافظة الرس"} — جميع الحقوق محفوظة © ${input.issuedAt.getFullYear()}`,
    26,
    regular,
    7.5,
    muted,
  );

  return doc.save();
}
