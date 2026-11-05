import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CourseSlides from "@/components/CourseSlides";
import SectorHeader from "@/components/SectorHeader";
import { getCourse, getSectorBySlug, getTestForCourse, parseSlides } from "@/lib/data";

/** ISR: يُخزَّن HTML ويُحدَّث تلقائيًا كل 5 دقائق أو فورًا بعد أي تعديل إداري. */
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; course: string }>;
}): Promise<Metadata> {
  const { slug, course } = await params;
  const sector = await getSectorBySlug(slug);
  if (!sector) return { title: "دورة غير موجودة" };
  const data = await getCourse(sector, course);
  return { title: data?.title ?? "دورة غير موجودة" };
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string; course: string }>;
}) {
  const { slug, course: courseSlug } = await params;
  const sector = await getSectorBySlug(slug);
  if (!sector) notFound();

  const course = await getCourse(sector, courseSlug);
  if (!course) notFound();

  const { slides, pdf_url, source_url } = parseSlides(course);
  const test = await getTestForCourse(sector, course.id);
  const base = `/sectors/${sector.slug}`;

  return (
    <>
      <SectorHeader sector={sector} activeTab="courses" />

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_290px]">
        <div>
          <nav className="mb-3 flex items-center gap-1.5 text-[11px] text-[#94a3b8]">
            <Link href={base} className="hover:text-white">
              {sector.name}
            </Link>
            <span aria-hidden="true">/</span>
            <Link href={`${base}/courses`} className="hover:text-white">
              الدورات
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-white">{course.title}</span>
          </nav>

          <h1 className="text-xl font-extrabold sm:text-2xl">{course.title}</h1>
          <p className="mt-1.5 mb-4 text-xs leading-relaxed text-[#94a3b8]">
            {course.description}
          </p>

          <CourseSlides slides={slides} pdfUrl={pdf_url} sourceUrl={source_url} />
        </div>

        <aside className="space-y-3">
          <div className="glass-card rounded-2xl p-5">
            <h2 className="mb-3 text-sm font-extrabold">معلومات الدورة</h2>
            <dl className="space-y-2 text-[11px]">
              {[
                ["رمز الشهادة", course.certificate_prefix],
                ["نسبة النجاح", `${Number(course.pass_score)}%`],
                ["مدة الاختبار", `${course.time_limit_minutes} دقيقة`],
                ["عدد الأسئلة", `${course.questions_per_attempt} سؤال`],
                [
                  "صلاحية الشهادة",
                  course.duration_days ? `${course.duration_days} يوم` : "غير محددة",
                ],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-2">
                  <dt className="text-[#94a3b8]">{label}</dt>
                  <dd className="font-bold text-white">{value}</dd>
                </div>
              ))}
            </dl>

            {test ? (
              <Link href={`/test/${test.id}`} className="btn btn-primary mt-4 w-full text-xs">
                ابدأ اختبار الدورة
              </Link>
            ) : (
              <div className="mt-4 rounded-xl border border-[#f9a825]/25 bg-[#f9a825]/5 px-3 py-2.5 text-[11px] leading-relaxed text-[#f9a825]">
                لم يُربط اختبار بهذه الدورة بعد. يُضاف الاختبار وبنك الأسئلة من لوحة الإدارة.
              </div>
            )}
          </div>

          <div className="glass-panel rounded-2xl p-4 text-[11px] leading-relaxed text-[#94a3b8]">
            <p className="mb-1 font-bold text-white">ملاحظة</p>
            عند اجتياز الاختبار بنسبة {Number(course.pass_score)}% أو أكثر تصدر شهادة فورية
            برقم فريد ورمز QR وملف PDF قابل للتحميل.
          </div>
        </aside>
      </div>
    </>
  );
}
