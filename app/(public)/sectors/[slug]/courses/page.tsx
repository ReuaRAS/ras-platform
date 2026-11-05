import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SectorHeader from "@/components/SectorHeader";
import { getCourses, getRecruitment, getSectorBySlug } from "@/lib/data";

/** ISR: يُخزَّن HTML ويُحدَّث تلقائيًا كل 5 دقائق أو فورًا بعد أي تعديل إداري. */
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sector = await getSectorBySlug(slug);
  return { title: `الدورات — ${sector?.name ?? ""}` };
}

export default async function CoursesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sector = await getSectorBySlug(slug);
  if (!sector) notFound();

  const [courses, recruitment] = await Promise.all([getCourses(sector), getRecruitment(sector)]);
  const base = `/sectors/${sector.slug}`;

  return (
    <>
      <SectorHeader sector={sector} activeTab="courses" />

      <div className="mt-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold">🎓 دورات {sector.name}</h2>
            <p className="mt-1 text-xs text-[#94a3b8]">
              كل دورة تحتوي سلايدات واختبارًا، وبعد الاجتياز تصدر شهادة برقم فريد.
            </p>
          </div>
          {recruitment.guide.length > 0 && (
            <Link href={`${base}/recruitment/guide`} className="btn btn-ghost text-xs">
              📘 الدليل الشامل
            </Link>
          )}
        </div>

        {courses.length === 0 ? (
          <div className="glass-panel rounded-2xl border border-dashed border-white/15 p-8 text-center">
            <p className="text-2xl" aria-hidden="true">
              🎒
            </p>
            <h3 className="mt-2 text-sm font-extrabold">لا توجد دورات منشورة</h3>
            <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-[#94a3b8]">
              تُضاف الدورات من لوحة الإدارة مع سلايداتها ورمز شهادتها (certificate_prefix).
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <article
                key={course.id}
                className="glass-card glass-card-hover flex flex-col rounded-2xl p-5"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-2xl" aria-hidden="true">
                    🎓
                  </span>
                  <span className="badge badge-muted font-mono text-[10px]">
                    {course.certificate_prefix}
                  </span>
                </div>
                <h3 className="text-base font-extrabold leading-snug">{course.title}</h3>
                <p className="mt-1 line-clamp-2 flex-1 text-xs leading-relaxed text-[#94a3b8]">
                  {course.description || "دورة تدريبية معتمدة داخل القطاع."}
                </p>
                <dl className="mt-3 grid grid-cols-3 gap-1 text-center text-[10px] text-[#94a3b8]">
                  <div className="rounded-lg bg-black/30 py-1.5">
                    <dt>النجاح</dt>
                    <dd className="font-bold text-white">{Number(course.pass_score)}%</dd>
                  </div>
                  <div className="rounded-lg bg-black/30 py-1.5">
                    <dt>المدة</dt>
                    <dd className="font-bold text-white">{course.time_limit_minutes} د</dd>
                  </div>
                  <div className="rounded-lg bg-black/30 py-1.5">
                    <dt>الأسئلة</dt>
                    <dd className="font-bold text-white">{course.questions_per_attempt}</dd>
                  </div>
                </dl>
                <Link href={`${base}/courses/${course.slug}`} className="btn btn-primary mt-4 text-xs">
                  فتح الدورة
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
