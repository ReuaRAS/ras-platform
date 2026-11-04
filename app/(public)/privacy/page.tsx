import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "سياسة الخصوصية",
  description: "ما نجمعه من بيانات، ولماذا، وكيف يمكنك طلب حذفها.",
};

const SECTIONS = [
  {
    title: "ما الذي نجمعه؟",
    items: [
      "الاسم في المحافظة، اسم ديسكورد، معرّف ديسكورد، العمر الحقيقي، والرتبة الحالية — تُدخل عند بدء الاختبار.",
      "نتيجة الاختبار وإجاباته، ورقم الشهادة الصادرة عنه.",
      "عناوين IP ووقت المحاولة وأي تحذيرات أثناء الاختبار (تبديل التبويب مثلًا) لأغراض منع الغش والمراجعة.",
      "بيانات الحساب الإداري: البريد وكلمة المرور (مُشفّرة عبر Supabase Auth) وسجل العمليات الإدارية.",
    ],
  },
  {
    title: "لماذا نجمعها؟",
    items: [
      "إصدار الشهادات والتحقق منها لاحقًا.",
      "مراجعة النتائج المشبوهة من قبل إدارة القطاع.",
      "حماية المنصة من إساءة الاستخدام (الحد من المحاولات المتكررة).",
    ],
  },
  {
    title: "لمن تُعرض البيانات؟",
    items: [
      "الشهادة العامة تعرض: الاسم، الدورة، النسبة، تاريخ الإصدار، ورقم الشهادة فقط.",
      "لا تُعرض بيانات ديسكورد أو العمر أو الرتبة أو عنوان IP في أي صفحة عامة.",
      "إدارة القطاع فقط (خلف تسجيل دخول وصلاحيات) ترى تفاصيل النتائج.",
      "لا نبيع أو نشارك البيانات مع أي طرف ثالث لأغراض تسويقية.",
    ],
  },
  {
    title: "مدة الاحتفاظ وحذف البيانات",
    items: [
      "تبقى السجلات والشهادات لأغراض التحقق التاريخي.",
      "يمكنك طلب حذف بياناتك الشخصية عبر ديسكورد القطاع؛ عند الحذف تُجهَّل بيانات الشهادة (يُستبدل الاسم بـ «محذوف») وتبقى الشهادة كسجل للرقم فقط.",
      "طلب التصدير متاح عبر صفحة الملف الشخصي (المرحلة 8).",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-black sm:text-3xl">سياسة الخصوصية</h1>
      <p className="mt-2 text-xs text-[#94a3b8]">آخر تحديث: 2026</p>

      <div className="mt-8 space-y-6">
        {SECTIONS.map((s) => (
          <section key={s.title} className="glass-card rounded-2xl p-5">
            <h2 className="mb-3 text-sm font-extrabold">{s.title}</h2>
            <ul className="space-y-2">
              {s.items.map((item, i) => (
                <li key={i} className="flex gap-2 text-xs leading-relaxed text-[#cbd5e1]">
                  <span className="text-[#f9a825]" aria-hidden="true">
                    •
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section className="glass-card rounded-2xl p-5">
          <h2 className="mb-2 text-sm font-extrabold">طلب حذف بياناتي</h2>
          <p className="text-xs leading-relaxed text-[#cbd5e1]">
            أرسل طلبك إلى إدارة القطاع عبر ديسكورد مع رقم شهادتك أو معرّف ديسكورد. يُنفَّذ الحذف
            خلال 7 أيام عمل، وتُجهَّل الشهادات كما هو موضح أعلاه.
          </p>
          <Link href="/terms" className="btn btn-ghost mt-3 text-xs">
            شروط الاستخدام
          </Link>
        </section>
      </div>
    </div>
  );
}
