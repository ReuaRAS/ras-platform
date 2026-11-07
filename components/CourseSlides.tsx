"use client";

import { useState } from "react";
import type { ContentSlide } from "@/lib/content/types";
import { FileText, LayoutGrid, Download } from "lucide-react";

/**
 * عارض السلايدات: تنقّل بين السلايدات + عارض PDF للمواد التي جاءت كعروض.
 * محتوى السلايد HTML مُستخرج من المصدر الرسمي (يُعرض كما هو).
 */
export default function CourseSlides({
  slides,
  pdfUrl,
  sourceUrl,
}: {
  slides: ContentSlide[];
  pdfUrl?: string | null;
  sourceUrl?: string | null;
}) {
  const [index, setIndex] = useState(0);
  const [showPdf, setShowPdf] = useState(Boolean(pdfUrl));

  /**
   * بعض المواد تصل PDF ومعها سلايد واحد نصّه مجرّد إشارة إلى الـPDF.
   * في هذه الحالة لا نعرض تبويب السلايدات (بطاقة فارغة بلا فائدة)،
   * وتبقى السلايدات ظاهرة كما هي للمواد التي فيها سلايدات حقيقية.
   */
  const stubDeck =
    Boolean(pdfUrl) &&
    slides.length === 1 &&
    (slides[0]?.content ?? "")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;|&#160;/g, " ")
      .replace(/\s+/g, " ")
      .trim().length < 200;

  const deck = stubDeck ? [] : slides;
  const total = deck.length;
  const slide = deck[Math.min(index, Math.max(total - 1, 0))];

  return (
    <div className="space-y-4">
      {(pdfUrl || sourceUrl) && (
        <div className="flex flex-wrap items-center gap-2">
          {pdfUrl && total > 0 && (
            <>
              <button
                type="button"
                onClick={() => setShowPdf(true)}
                className={`btn text-xs ${showPdf ? "btn-primary" : "btn-ghost"}`}
              >
                <FileText className="inline h-4 w-4 align-[-2px]" aria-hidden="true" /> عرض المادة (PDF)
              </button>
              <button
                type="button"
                onClick={() => setShowPdf(false)}
                className={`btn text-xs ${!showPdf ? "btn-primary" : "btn-ghost"}`}
              >
                <LayoutGrid className="inline h-4 w-4 align-[-2px]" aria-hidden="true" /> السلايدات
              </button>
            </>
          )}
          {pdfUrl && (
            <a
              href={pdfUrl}
              download
              className="btn btn-ghost text-xs"
              target="_blank"
              rel="noreferrer"
            >
              <Download className="inline h-4 w-4 align-[-2px]" aria-hidden="true" /> تحميل
            </a>
          )}
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-[#94a3b8] underline-offset-4 hover:text-white hover:underline"
            >
              المصدر الأصلي
            </a>
          )}
        </div>
      )}

      {(showPdf || total === 0) && pdfUrl ? (
        <div className="glass-card overflow-hidden rounded-2xl">
          <iframe
            src={`${pdfUrl}#view=FitH`}
            title="عرض مادة الدورة"
            className="h-[70vh] w-full bg-white"
          />
        </div>
      ) : total === 0 ? (
        <p className="glass-panel rounded-2xl p-8 text-center text-sm text-[#94a3b8]">
          لا توجد سلايدات منشورة لهذه الدورة بعد.
        </p>
      ) : (
        <div className="glass-card rounded-2xl p-5 sm:p-7">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-extrabold text-[var(--sector-light)] sm:text-lg">
              {slide?.title}
            </h2>
            <span className="badge badge-muted shrink-0">
              سلايد {index + 1} / {total}
            </span>
          </div>

          <div
            className="slide-content min-h-[200px] text-sm"
            // محتوى مستخرج من المصدر الرسمي للقطاع
            dangerouslySetInnerHTML={{ __html: slide?.content ?? "" }}
          />

          <div className="mt-6 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="btn btn-ghost text-xs"
            >
              → السابق
            </button>

            <div className="hidden flex-1 items-center gap-1 sm:flex">
              {deck.map((s, i) => (
                <button
                  key={`${s.title}-${i}`}
                  type="button"
                  aria-label={`الانتقال إلى السلايد ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i === index ? "bg-[var(--sector-main)]" : "bg-white/10 hover:bg-white/20"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
              disabled={index === total - 1}
              className="btn btn-primary text-xs"
            >
              التالي ←
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
