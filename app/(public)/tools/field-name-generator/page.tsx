import type { Metadata } from "next";
import FieldNameGenerator from "@/components/tools/FieldNameGenerator";
import { FAMILY_NAMES, FIELD_NICKNAMES, FIRST_NAMES } from "@/content/tools/field-names";

export const metadata: Metadata = {
  title: "مولد الأسامي الميدانية",
  description: "توليد أسماء عربية واقعية للاستخدام داخل سيرفر FiveM.",
};

export default function FieldNameGeneratorPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-5">
        <h1 className="text-2xl font-extrabold">🧾 مولد الأسامي الميدانية</h1>
        <p className="mt-1 text-xs leading-relaxed text-[#94a3b8]">
          اختر عدد الأسماء ثم انسخ ما يناسبك. الهدف مساعدة الأعضاء الجدد على اختيار اسم واقعي
          ومتناسب مع بيئة المحافظة.
        </p>
      </header>

      <FieldNameGenerator
        sets={{ first: FIRST_NAMES, family: FAMILY_NAMES, nickname: FIELD_NICKNAMES }}
      />
    </div>
  );
}
