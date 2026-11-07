import Link from "next/link";
import { Briefcase, FileText, GraduationCap, Trophy, type LucideIcon } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import SectorCard from "@/components/SectorCard";
import { getSectors } from "@/lib/data";

/** ISR: يُخزَّن HTML ويُحدَّث تلقائيًا كل 5 دقائق أو فورًا بعد أي تعديل إداري. */
export const revalidate = 300;

const FEATURES: { Icon: LucideIcon; title: string; text: string }[] = [
  {
    Icon: FileText,
    title: "القوانين والمخالفات",
    text: "لوائح كل قطاع مع العقوبات والملاحظات، قابلة للتحديث من لوحة الإدارة.",
  },
  {
    Icon: Briefcase,
    title: "منصة التوظيف",
    text: "دليل شامل لكل قطاع ثم اختبار توظيف إلكتروني بتصحيح فوري.",
  },
  {
    Icon: GraduationCap,
    title: "الدورات والشهادات",
    text: "سلايدات الدورات واختباراتها، وشهادة فورية برقم فريد و QR و PDF.",
  },
  {
    Icon: Trophy,
    title: "نظام المكافآت",
    text: "آليات التقدير والحوافز لكل قطاع، مع إمكانية التعديل من القيادة.",
  },
];

export default async function HomePage() {
  const sectors = await getSectors();

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6">
      {/* Hero */}
      <section className="animate-fade-up mb-14 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/seal-rass.webp"
          alt="شعار محافظة الرس"
          width={128}
          height={128}
          className="mx-auto mb-5 block h-24 w-24 rounded-full object-cover shadow-[0_18px_45px_-18px_rgba(198,40,40,0.75)] ring-2 ring-[#f9a825]/25 sm:h-32 sm:w-32"
        />
        <span className="badge badge-warn mb-5">
          <span aria-hidden="true">🏛️</span> محافظة الرس — FiveM
        </span>
        <h1 className="mx-auto max-w-3xl text-3xl font-black leading-[1.3] sm:text-5xl">
          منصة <span className="gold-text">قطاعات</span> محافظة الرس
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#94a3b8] sm:text-base">
          مكان واحد يجمع قوانين القطاعات، منصات التوظيف، الدورات التدريبية، نظام المكافآت،
          والاختبارات المعتمدة — مع إصدار شهادات فورية قابلة للتحقق.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link href="#sectors" className="btn btn-primary">
            استعرض القطاعات
          </Link>
          <Link href="/certificates#verify" className="btn btn-ghost">
            تحقّق من شهادة
          </Link>
        </div>
      </section>

      {/* Sectors */}
      <section id="sectors" className="mb-16 scroll-mt-24">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-extrabold sm:text-2xl">القطاعات المعتمدة</h2>
            <p className="mt-1 text-xs text-[#94a3b8]">
              اختر القطاع لعرض قوانينه ودوراته ومكافآته
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sectors.map((sector) => (
            <SectorCard key={sector.slug} sector={sector} />
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mb-16">
        <h2 className="mb-5 text-xl font-extrabold sm:text-2xl">ماذا توفّر المنصة؟</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <GlassCard key={f.title} className="flex flex-col gap-2">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]"
                aria-hidden="true"
              >
                <f.Icon className="h-5 w-5 text-[#f9a825]" />
              </span>
              <h3 className="text-sm font-extrabold">{f.title}</h3>
              <p className="text-xs leading-relaxed text-[#94a3b8]">{f.text}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Certificates strip */}
      <section className="glass-panel rounded-3xl p-6 sm:p-9">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="text-lg font-extrabold sm:text-xl">
              شهادات موثّقة برقم فريد و<span className="gold-text">QR</span>
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[#94a3b8]">
              يصدر رقم الشهادة تلقائيًا بالصيغة <code className="text-[#f9a825]">PREFIX-YEAR-NNNN</code>{" "}
              عند اجتياز الاختبار، مع ملف PDF ورمز QR يفتح صفحة التحقق الرسمية.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/certificates" className="btn btn-gold">
              البحث عن شهادة
            </Link>
            <Link href="/sectors/red-crescent/courses" className="btn btn-ghost">
              الدورات
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
