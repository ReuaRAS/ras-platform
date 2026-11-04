import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "شروط الاستخدام",
  description: "شروط استخدام منصة قطاعات محافظة الرس.",
};

const CLAUSES = [
  {
    title: "طبيعة المنصة",
    body: "هذه منصة مجتمعية لمحافظة الرس داخل سيرفر FiveM، وليست تابعة رسميًا لـ Rockstar Games أو FiveM أو أي جهة حكومية. جميع الأسماء والقطاعات مستخدمة في سياق اللعب الجماعي (Roleplay).",
  },
  {
    title: "دقة البيانات المدخلة",
    body: "أنت مسؤول عن صحة الاسم واسم ديسكورد والمعرّف والعمر والرتبة عند التقديم. البيانات تُطبع على الشهادة كما تُدخل، ولا يمكن تعديل شهادة صادرة إلا بإلغائها وإعادة الإصدار.",
  },
  {
    title: "الاختبارات ومنع الغش",
    body: "يُمنع النسخ أو اللصق أو استخدام أدوات مساعدة أو تبديل التبويب أثناء الاختبار. تُسجَّل هذه الحوادث في تقرير المشرف، وقد تؤدي إلى رفض النتيجة أو إلغاء الشهادة.",
  },
  {
    title: "الشهادات",
    body: "الشهادة وثيقة داخلية للمنصة تُثبت اجتياز اختبار معيّن، وليست شهادة أكاديمية أو رسمية. يمكن لإدارة القطاع إلغاء أي شهادة صادرة بمخالفة، ويظهر سبب الإلغاء في صفحة التحقق.",
  },
  {
    title: "الحسابات الإدارية",
    body: "الوصول إلى لوحة الإدارة مقصور على من يمنحه القطاع. أي إجراء إداري يُسجَّل في سجل العمليات مع الوقت وعنوان IP. يُمنع مشاركة بيانات الدخول.",
  },
  {
    title: "التعديلات",
    body: "قد تُحدَّث القوانين والدورات والمكافآت وشروط الاستخدام في أي وقت. استمرارك في استخدام المنصة يعني موافقتك على النسخة المحدثة.",
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-black sm:text-3xl">شروط الاستخدام</h1>
      <p className="mt-2 text-xs text-[#94a3b8]">آخر تحديث: 2026</p>

      <div className="mt-8 space-y-4">
        {CLAUSES.map((c, i) => (
          <section key={c.title} className="glass-card rounded-2xl p-5">
            <h2 className="mb-2 text-sm font-extrabold">
              {i + 1}. {c.title}
            </h2>
            <p className="text-xs leading-relaxed text-[#cbd5e1]">{c.body}</p>
          </section>
        ))}

        <div className="glass-panel rounded-2xl p-4 text-[11px] leading-relaxed text-[#94a3b8]">
          <p className="mb-1 font-bold text-white">تنويه قانوني</p>
          هذا الموقع غير تابع رسميًا لـ Rockstar Games أو FiveM. جميع العلامات التجارية ملك
          لأصحابها. © 2026 NJM — جميع الحقوق محفوظة.
        </div>

        <Link href="/privacy" className="btn btn-ghost text-xs">
          سياسة الخصوصية
        </Link>
      </div>
    </div>
  );
}
