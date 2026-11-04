/**
 * تنزيل عروض Google Slides كـ PDF (محتوى حقيقي) + استخراج عناوين السلايدات.
 *
 * التشغيل: node scripts/sync-google-slides.mjs
 * المخرجات: public/content/<sector>/<file>.pdf
 *           content/_generated/google-slides.json
 *
 * ملاحظة: نصوص العروض مُصدّرة كصور داخل الملف، لذا يُعرض الـPDF نفسه
 * داخل المنصة بدل تخمين النصوص.
 */
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

/** كل عروض القطاعات كما وردت في المواصفة (القسم 12) */
const DECKS = [
  // كراج الميكانيك — MG
  { sector: "mechanic", file: "guide", id: "1W4hvfz70p8KfrpJ0kNWNRT-7pWykqI1NGVbK0u9nCJs", label: "الدليل الشامل" },
  { sector: "mechanic", file: "field-guide", id: "1oYNkhFoTgywQuFhbThq6cOlJrO7utBGLsbXCh-hcSbo", label: "دورة موجه ميداني" },
  { sector: "mechanic", file: "modify-supply", id: "1GVtF_vdUvCT_D0gVmkZFGQq6m6lr2ocY17u1K9h5Vac", label: "دورة تعديل وتزويد" },
  { sector: "mechanic", file: "field-supervisor", id: "1NHX3TxFxqQkvkin7ANcBwOyS-pVejY5o1ujw01Tnhfs", label: "دورة مشرف ميداني" },
  { sector: "mechanic", file: "general-supervisor", id: "1BhqqXGBrqLHhPJG6smX8okJfsA0TNX-6KIjzNEJyceQ", label: "دورة مشرف عام" },
  // أمن العام — PS
  { sector: "public-security", file: "deck-1", id: "1LKeY6Ny9dJpyqbDr4VQ6Go92i3D3TBN3k6BQyZly-mM", label: "عرض 1" },
  { sector: "public-security", file: "deck-2", id: "1FmPAvSEZvVvCeS83wYn3paGk2SJzabc_3THbY1e-AI0", label: "عرض 2" },
  { sector: "public-security", file: "deck-3", id: "12q2FsxUv1OIqjCexIsICAEX_fNtrBb1ciRcgrHZb3Rw", label: "عرض 3" },
  { sector: "public-security", file: "deck-4", id: "1n4ax4fP0iAhk228UP7DSZBw-xuI51uQ_keRzamO9LNk", label: "عرض 4" },
  { sector: "public-security", file: "deck-5", id: "1IUFnKNFErKvl8TkKOcdZugjnHhBDG7hBfOTz5MxoCUc", label: "عرض 5" },
];

async function downloadPdf(deck) {
  const url = `https://docs.google.com/presentation/d/${deck.id}/export/pdf`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) return { ok: false, status: res.status };
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.subarray(0, 4).toString() !== "%PDF") return { ok: false, status: "not-pdf" };
  const dir = path.join(ROOT, "public", "content", deck.sector);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, `${deck.file}.pdf`), buf);
  return { ok: true, bytes: buf.length };
}

/** استخراج عناوين السلايدات من بيانات العارض (viewerData.docData) */
async function slideTitles(id) {
  try {
    const res = await fetch(
      `https://docs.google.com/presentation/d/${id}/embed?start=false&loop=false`,
    );
    if (!res.ok) return [];
    const html = await res.text();
    const out = [];
    const re = /\[\[\\"([a-z0-9_]+)\\",(\d+),\\"([^\\"]*)\\"/g;
    for (const m of html.matchAll(re)) out.push({ index: Number(m[2]), title: m[3] });
    return out.sort((a, b) => a.index - b.index).map((s) => s.title);
  } catch {
    return [];
  }
}

async function main() {
  const result = {};
  for (const deck of DECKS) {
    const dl = await downloadPdf(deck);
    const titles = dl.ok ? await slideTitles(deck.id) : [];
    result[`${deck.sector}/${deck.file}`] = {
      label: deck.label,
      presentation_id: deck.id,
      pdf_url: dl.ok ? `/content/${deck.sector}/${deck.file}.pdf` : null,
      slide_titles: titles,
      bytes: dl.bytes ?? 0,
      status: dl.ok ? "ok" : `failed:${dl.status}`,
    };
    console.log(`${deck.sector}/${deck.file}: ${dl.ok ? `OK (${dl.bytes} bytes, ${titles.length} slides)` : `FAIL ${dl.status}`}`);
  }

  const dir = path.join(ROOT, "content", "_generated");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "google-slides.json"), JSON.stringify(result, null, 2), "utf8");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
