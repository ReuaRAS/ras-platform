import { notFound } from "next/navigation";
import type { Metadata } from "next";
import TestFlow from "@/components/TestFlow";
import { createAdminClient } from "@/lib/supabase/admin";
import { TURNSTILE_SITE_KEY } from "@/lib/turnstile";
import { Wrench } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "اختبار",
  robots: { index: false, follow: false },
};

export default async function TestPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="glass-card rounded-3xl p-8 text-center">
          <p className="text-3xl" aria-hidden="true">
            <Wrench className="h-4 w-4" aria-hidden="true" />
          </p>
          <h1 className="mt-3 text-lg font-extrabold">الاختبارات غير مهيّأة بعد</h1>
          <p className="mt-2 text-xs leading-relaxed text-[#94a3b8]">
            يجب ضبط مفاتيح Supabase في متغيرات البيئة ثم إنشاء الاختبارات من لوحة الإدارة.
          </p>
        </div>
      </div>
    );
  }

  const { data: test } = await admin
    .from("tests")
    .select("id, title, pass_score, time_limit_minutes, questions_per_attempt, is_active, sector_id")
    .eq("id", testId)
    .maybeSingle();

  if (!test || !test.is_active) notFound();

  const { count } = await admin
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("test_id", test.id)
    .eq("is_active", true);

  const { data: sector } = await admin
    .from("sectors")
    .select("primary_color")
    .eq("id", test.sector_id)
    .maybeSingle();

  return (
    <div
      className="mx-auto max-w-5xl px-4 py-10 sm:px-6"
      style={
        { "--sector-main": sector?.primary_color ?? "#c62828" } as React.CSSProperties
      }
    >
      <TestFlow
        testId={test.id}
        testTitle={test.title}
        passScore={Number(test.pass_score ?? 70)}
        timeLimitMinutes={Number(test.time_limit_minutes ?? 20)}
        questionsCount={count ?? null}
        siteKey={TURNSTILE_SITE_KEY}
      />
    </div>
  );
}
