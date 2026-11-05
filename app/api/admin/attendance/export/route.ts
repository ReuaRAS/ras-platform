import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/supabase/server";
import type { AttendanceRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  present: "حاضر",
  late: "متأخر",
  absent: "غائب",
  excused: "بعذر",
};

function csvCell(value: string | number | null) {
  const text = value === null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const { user, profile } = await getSession();
  if (!user || !profile) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  if (!hasPermission(profile.role, "attendance.read")) {
    return NextResponse.json({ error: "لا تملك صلاحية الحضور" }, { status: 403 });
  }

  const url = new URL(request.url);
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(url.searchParams.get("month") ?? "")
    ? (url.searchParams.get("month") as string)
    : new Date().toISOString().slice(0, 7);

  const isSuper = profile.role === "super_admin";
  const sectorId = isSuper ? url.searchParams.get("sector") ?? profile.sector_id : profile.sector_id;
  if (!sectorId) {
    return NextResponse.json({ error: "لا يوجد قطاع مرتبط بالحساب" }, { status: 400 });
  }

  const [y, m] = month.split("-").map(Number);
  const days = new Date(y, m, 0).getDate();
  const start = `${month}-01`;
  const end = `${month}-${String(days).padStart(2, "0")}`;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("attendance_records")
    .select("*")
    .eq("sector_id", sectorId)
    .gte("attendance_date", start)
    .lte("attendance_date", end)
    .order("attendance_date")
    .order("discord_id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as AttendanceRecord[];
  const header = ["discord_id", "التاريخ", "الحالة", "ملاحظة"];
  const lines = [header.map(csvCell).join(",")];
  for (const r of rows) {
    lines.push(
      [
        csvCell(r.discord_id),
        csvCell(r.attendance_date),
        csvCell(STATUS_LABEL[r.status] ?? r.status),
        csvCell(r.note),
      ].join(","),
    );
  }

  // BOM حتى تظهر العربية صحيحة في Excel
  const csv = "\uFEFF" + lines.join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="attendance-${month}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
