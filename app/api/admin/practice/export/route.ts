import { NextResponse } from "next/server";

import { hasPermission } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** نفس سقف صفحة الإحصاءات حتى يطابق الملف ما يظهر على الشاشة */
const WINDOW = 2000;

type Row = {
  percentage: number | string | null;
  submitted_at: string;
  tests: { title: string; pass_score: number | null } | null;
  sectors: { name: string } | null;
};

function csvCell(value: string | number | null) {
  const text = value === null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET() {
  const { user, profile } = await getSession();
  if (!user || !profile) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  if (!hasPermission(profile.role, "results.read")) {
    return NextResponse.json({ error: "لا تملك صلاحية نتائج الاختبارات" }, { status: 403 });
  }

  const isSuper = profile.role === "super_admin";
  if (!isSuper && !profile.sector_id) {
    return NextResponse.json({ error: "لا يوجد قطاع مرتبط بالحساب" }, { status: 400 });
  }

  const admin = createAdminClient();
  let query = admin
    .from("practice_attempts")
    .select("percentage, submitted_at, tests(title, pass_score), sectors(name)");

  if (!isSuper) query = query.eq("sector_id", profile.sector_id);

  const { data, error } = await query.order("submitted_at", { ascending: false }).limit(WINDOW);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as Row[];
  const header = ["القطاع", "الاختبار", "الدرجة %", "درجة النجاح", "النتيجة", "التاريخ"];
  const lines = [header.map(csvCell).join(",")];

  for (const row of rows) {
    const percentage = Number(row.percentage ?? 0);
    const passScore = row.tests?.pass_score ?? 70;
    lines.push(
      [
        csvCell(row.sectors?.name ?? ""),
        csvCell(row.tests?.title ?? "اختبار محذوف"),
        csvCell(Math.round(percentage * 10) / 10),
        csvCell(passScore),
        csvCell(percentage >= passScore ? "بلغ النجاح" : "لم يبلغ"),
        csvCell(new Date(row.submitted_at).toISOString().slice(0, 16).replace("T", " ")),
      ].join(","),
    );
  }

  // BOM حتى تظهر العربية صحيحة في Excel
  const csv = "\uFEFF" + lines.join("\r\n");
  const today = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="practice-stats-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
