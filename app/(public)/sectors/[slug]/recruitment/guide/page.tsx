import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CourseSlides from "@/components/CourseSlides";
import SectorHeader from "@/components/SectorHeader";
import { getRecruitment, getSectorBySlug } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sector = await getSectorBySlug(slug);
  return { title: `الدليل الشامل — ${sector?.name ?? ""}` };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sector = await getSectorBySlug(slug);
  if (!sector) notFound();

  const recruitment = await getRecruitment(sector);
  const base = `/sectors/${sector.slug}`;

  return (
    <>
      <SectorHeader sector={sector} activeTab="recruitment" />

      <div className="mt-6">
        <nav className="mb-3 flex items-center gap-1.5 text-[11px] text-[#94a3b8]">
          <Link href={`${base}/recruitment`} className="hover:text-white">
            التوظيف
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-white">الدليل الشامل</span>
        </nav>

        <h1 className="mb-1 text-xl font-extrabold sm:text-2xl">📘 الدليل الشامل</h1>
        <p className="mb-4 text-xs leading-relaxed text-[#94a3b8]">
          المراجع المعتمدة والبروتوكولات الأساسية للقطاع. يُنصح بقراءته كاملًا قبل بدء اختبار
          التوظيف.
        </p>

        {recruitment.guide.length === 0 && !recruitment.guide_pdf_url ? (
          <div className="glass-panel rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-[#94a3b8]">
            لم يُضف دليل لهذا القطاع بعد.
          </div>
        ) : (
          <CourseSlides slides={recruitment.guide} pdfUrl={recruitment.guide_pdf_url} />
        )}
      </div>
    </>
  );
}
