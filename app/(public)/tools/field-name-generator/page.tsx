import type { Metadata } from "next";
import FieldNameGenerator from "@/components/FieldNameGenerator";

export const metadata: Metadata = {
  title: "مولد الأسامي الميدانية",
  description: "أداة لتوليد أسماء ميدانية متوافقة مع نظام المحافظة.",
};

export default function FieldNameGeneratorPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-black sm:text-3xl">🪪 مولد الأسامي الميدانية</h1>
        <p className="mt-2 text-xs leading-relaxed text-[#94a3b8]">
          أداة سريعة لتوليد اسم ميداني (اسم + لقب + رقم) يمكن استخدامه داخل اللعبة. الأسماء
          المولّدة مقترحات فقط، وتأكد من عدم تكرارها مع عضو آخر.
        </p>
      </header>

      <FieldNameGenerator />
    </div>
  );
}
