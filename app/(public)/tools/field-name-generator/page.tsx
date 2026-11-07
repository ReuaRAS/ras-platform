import type { Metadata } from "next";
import FieldNameGenerator from "@/components/tools/FieldNameGenerator";
import { FAMILY_NAMES, FIELD_NICKNAMES, FIRST_NAMES } from "@/content/tools/field-names";
import { ScrollText } from "lucide-react";

export const metadata: Metadata = {
  title: "مولد الأسامي الميدانية",
  description: "توليد أسماء عربية واقعية للاستخدام داخل سيرفر FiveM.",
};

export default function FieldNameGeneratorPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-5">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold">
        <ScrollText className="h-6 w-6 text-[#f9a825]" aria-hidden="true" />
        مولد الأسامي الميدانية
      </h1>
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
