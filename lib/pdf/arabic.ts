import bidiFactory from "bidi-js";
import { ArabicShaper } from "arabic-persian-reshaper";

const bidi = bidiFactory();

/**
 * يهيّئ النص العربي للرسم داخل PDF:
 * 1) تشكيل الحروف (وصل/ابتداء/وسط/نهائي) عبر arabic-persian-reshaper.
 * 2) إعادة ترتيب الأسطر بصريًا (RTL) عبر bidi-js مع الحفاظ على الأرقام واللاتينية.
 *
 * pdf-lib يرسم النص من اليسار إلى اليمين حرفًا حرفًا، فلا بد من التحويل المسبق.
 */
export function shapeArabic(input: string): string {
  if (!input) return "";
  const shaped = ArabicShaper.convertArabic(String(input));
  try {
    const levels = bidi.getEmbeddingLevels(shaped, "rtl");
    return bidi.getReorderedString(shaped, levels);
  } catch {
    return shaped;
  }
}
