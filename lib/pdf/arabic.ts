import { ArabicShaper } from "arabic-persian-reshaper";

const ARABIC_RANGE = /[\u0600-\u06FF]/;
/** مقاطع لاتينية/رقمية/رموز تُعرض من اليسار إلى اليمين */
const LTR_RUN = /[A-Za-z0-9%.,:/+#()\-]+/g;

/**
 * يهيّئ النص العربي للرسم داخل PDF عبر pdf-lib.
 *
 * pdf-lib يمرّر النص إلى fontkit، وfontkit يشكّل الأرقام العربية ويعكس ترتيب
 * أسطر RTL تلقائيًا. لذلك:
 * 1) نحوّل الحروف إلى أشكالها المتصلة (ابتداء/وسط/نهائي) بـ arabic-persian-reshaper.
 *    لا نعكس النص يدويًا، لأن fontkit يعكسه بنفسه.
 * 2) نعكس المقاطع اللاتينية والأرقام داخل الأسطر العربية، لأن fontkit يعكس السطر
 *    كاملًا فتظهر "RCA 997" معكوسة.
 *
 * النص اللاتيني الخالص يُترك كما هو لأن fontkit لا يعكسه.
 */
export function shapeArabic(input: string): string {
  if (!input) return "";
  const text = String(input);
  if (!ARABIC_RANGE.test(text)) return text;

  return ArabicShaper.convertArabic(text).replace(LTR_RUN, (run) =>
    run.split("").reverse().join(""),
  );
}
