/**
 * استيراد جدول كراج الميكانيك من Google Sheets (CSV عام) إلى ملف محتوى.
 *
 * التشغيل: node scripts/extract-mechanic.mjs
 * المخرجات: content/mechanic/schedule.ts + scripts/_raw/mechanic-schedule.json
 */
import fs from "node:fs/promises";
import path from "node:path";

const SHEET_ID = "18iCRWkTzLmPW5QX9kiAw43A5NuJ8qFyFS9jrsN5TCIg";
const GID = "887116240";
const SOURCE = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit?gid=${GID}`;
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_TS = path.join(ROOT, "content", "mechanic", "schedule.ts");
const RAW = path.join(ROOT, "scripts", "_raw", "mechanic-schedule.json");

/** محلل CSV بسيط يدعم الاقتباس المزدوج */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") field += ch;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const norm = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

async function main() {
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`فشل تنزيل الجدول: ${res.status}`);
  const rows = parseCsv(await res.text());

  // صف العناوين = أول صف يحتوي "ID" و "الاسم/ألاسم"
  const headerIndex = rows.findIndex((r) => norm(r[0]) === "ID" || r.some((c) => norm(c) === "ألاسم"));
  if (headerIndex < 0) throw new Error("لم يتم العثور على صف العناوين في الجدول");

  const header = rows[headerIndex].map(norm);
  const width = header.length;

  // الأعمدة: نأخذ كل عمود يحمل عنوانًا أو بيانات فعلية
  const dataRows = rows
    .slice(headerIndex + 1)
    .map((r) => Array.from({ length: width }, (_, i) => norm(r[i])))
    .filter((r) => r.some((c) => c.length > 0));

  const columns = header
    .map((label, i) => ({
      key: `c${i}`,
      label: label || `عمود ${i + 1}`,
      hasData: dataRows.some((r) => r[i]?.length),
    }))
    .filter((c) => c.hasData || header[Number(c.key.slice(1))])
    .map(({ key, label }) => ({ key, label }));

  const outRows = dataRows.map((r) => {
    const obj = {};
    columns.forEach((c) => {
      obj[c.key] = r[Number(c.key.slice(1))] ?? "";
    });
    return obj;
  });

  const payload = {
    title: "جدول كراج الميكانيك",
    source_url: SOURCE,
    columns,
    rows: outRows,
    notes:
      "مستورد من جدول القطاع الرسمي على Google Sheets. التحديث يتم من /admin/schedule أو بإعادة تشغيل scripts/extract-mechanic.mjs",
  };

  await fs.mkdir(path.dirname(RAW), { recursive: true });
  await fs.mkdir(path.dirname(OUT_TS), { recursive: true });
  await fs.writeFile(RAW, JSON.stringify(payload, null, 2), "utf8");

  const ts = `/**
 * جدول كراج الميكانيك — مستورد من Google Sheets
 * المصدر: ${SOURCE}
 * تم التوليد آليًا بواسطة scripts/extract-mechanic.mjs — لا تُحرّر يدويًا.
 */
import type { ContentSchedule } from "@/lib/content/types";

export const mechanicSchedule: ContentSchedule = ${JSON.stringify(payload, null, 2)};
`;
  await fs.writeFile(OUT_TS, ts, "utf8");
  console.log(`صفوف: ${outRows.length} / أعمدة: ${columns.length}`);
  console.log(columns.map((c) => c.label).join(" | "));
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
