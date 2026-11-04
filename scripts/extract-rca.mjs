/**
 * استخراج محتوى قطاع الهلال الأحمر (RCA) من الموقع الرسمي
 * https://rasrca.netlify.app
 *
 * التشغيل:  node scripts/extract-rca.mjs
 * المخرجات: content/rca/*.ts  +  scripts/_raw/*.json
 *
 * لا يُخمّن هذا السكربت أي محتوى: كل ما يكتبه مأخوذ حرفيًا من الموقع.
 */
import fs from "node:fs/promises";
import path from "node:path";

const BASE = "https://rasrca.netlify.app";
const ROOT = path.resolve(import.meta.dirname, "..");
const RAW_DIR = path.join(ROOT, "scripts", "_raw");
const OUT_DIR = path.join(ROOT, "content", "rca");

const clean = (s) =>
  String(s ?? "")
    .replace(/<i[^>]*><\/i>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

async function get(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

/* ------------------------------------------------------------------ */
/* 1) القوانين والمكافآت من صفحات *-content.html                       */
/* ------------------------------------------------------------------ */
const CARD_RE =
  /<div class="item-card"><span class="red-badge">#?([^<]*)<\/span><div class="title">([\s\S]*?)<\/div><div class="amount">([\s\S]*?)<\/div>(?:<div class="note">([\s\S]*?)<\/div>)?<\/div>/g;

function parseCards(html) {
  const out = [];
  for (const m of html.matchAll(CARD_RE)) {
    const [, code, title, amount, note] = m;
    // الجزء داخل <span> في خانة العقوبة هو عقوبة إضافية / ملاحظة
    const extraMatch = amount.match(/<span[^>]*>([\s\S]*?)<\/span>/);
    out.push({
      index: m.index ?? 0,
      code: clean(code).padStart(2, "0"),
      title: clean(title),
      amount: clean(amount.replace(/<span[^>]*>[\s\S]*?<\/span>/g, " ")),
      additional: extraMatch ? clean(extraMatch[1]) : "",
      note: clean(note ?? ""),
    });
  }
  return out;
}

async function extractLaws() {
  const html = await get(`${BASE}/laws-content.html`);
  const cards = parseCards(html);
  const commonStart = html.indexOf("الأخطاء الشائعة");
  const laws = cards.map((c) => ({
    law_code: `RCA-L${c.code}`,
    title: c.title,
    penalty: c.amount,
    additional_penalty: c.additional || null,
    category: commonStart > 0 && c.index > commonStart ? "common" : "main",
    notes: c.note || null,
    sort_order: Number(c.code),
  }));
  return laws;
}

async function extractRewards() {
  const html = await get(`${BASE}/rewards-content.html`);
  return parseCards(html).map((c) => ({
    reward_code: `RCA-R${c.code}`,
    title: c.title,
    reward_value: c.amount,
    conditions: c.note || c.additional || null,
    sort_order: Number(c.code),
  }));
}

/* ------------------------------------------------------------------ */
/* 2) السلايدات من صفحات الدروس (slidesData داخل <script>)            */
/* ------------------------------------------------------------------ */
function extractArrayLiteral(html, varName) {
  const marker = `const ${varName} = [`;
  const start = html.indexOf(marker);
  if (start < 0) return null;
  let i = html.indexOf("[", start);
  let depth = 0;
  let quote = null;
  for (; i < html.length; i++) {
    const ch = html[i];
    const prev = html[i - 1];
    if (quote) {
      if (ch === quote && prev !== "\\") quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      quote = ch;
      continue;
    }
    if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) return html.slice(html.indexOf("[", start), i + 1);
    }
  }
  return null;
}

function parseSlides(html) {
  const literal = extractArrayLiteral(html, "slidesData");
  if (!literal) return [];
  // eslint-disable-next-line no-new-func
  const arr = new Function(`return ${literal}`)();
  return arr.map((s) => ({ title: clean(s.title), content: String(s.content ?? "").trim() }));
}

async function extractCourse(slug) {
  const html = await get(`${BASE}/${slug}`);
  return parseSlides(html);
}

/* ------------------------------------------------------------------ */
/* 3) الكتابة                                                          */
/* ------------------------------------------------------------------ */
const header = (title, source) =>
  `/**\n * ${title}\n * المصدر: ${source}\n * تم التوليد آليًا بواسطة scripts/extract-rca.mjs — لا تُحرّر يدويًا.\n */\n`;

async function main() {
  await fs.mkdir(RAW_DIR, { recursive: true });
  await fs.mkdir(OUT_DIR, { recursive: true });

  const [laws, rewards, guide, operations, supervisor, airSupport] = await Promise.all([
    extractLaws(),
    extractRewards(),
    extractCourse("guide"),
    extractCourse("operations"),
    extractCourse("supervisor"),
    extractCourse("air-support"),
  ]);

  const raw = { laws, rewards, guide, operations, supervisor, airSupport };
  await fs.writeFile(path.join(RAW_DIR, "rca.json"), JSON.stringify(raw, null, 2), "utf8");

  const files = {
    "laws.ts": `${header("قوانين الهلال الأحمر (35 قانونًا)", `${BASE}/laws-content.html`)}import type { ContentLaw } from "@/lib/content/types";\n\nexport const rcaLaws: ContentLaw[] = ${JSON.stringify(laws, null, 2)};\n`,
    "rewards.ts": `${header("مكافآت الهلال الأحمر (8 مكافآت)", `${BASE}/rewards-content.html`)}import type { ContentReward } from "@/lib/content/types";\n\nexport const rcaRewards: ContentReward[] = ${JSON.stringify(rewards, null, 2)};\n`,
    "guide.ts": `${header("الدليل الشامل (سلايدات)", `${BASE}/guide`)}import type { ContentSlide } from "@/lib/content/types";\n\nexport const rcaGuideSlides: ContentSlide[] = ${JSON.stringify(guide, null, 2)};\n`,
    "operations.ts": `${header("دورة العمليات (سلايدات)", `${BASE}/operations`)}import type { ContentSlide } from "@/lib/content/types";\n\nexport const rcaOperationsSlides: ContentSlide[] = ${JSON.stringify(operations, null, 2)};\n`,
    "supervisor.ts": `${header("دورة المشرفين (سلايدات)", `${BASE}/supervisor`)}import type { ContentSlide } from "@/lib/content/types";\n\nexport const rcaSupervisorSlides: ContentSlide[] = ${JSON.stringify(supervisor, null, 2)};\n`,
    "air-support.ts": `${header("دورة الدعم الجوي (سلايدات)", `${BASE}/air-support`)}import type { ContentSlide } from "@/lib/content/types";\n\nexport const rcaAirSupportSlides: ContentSlide[] = ${JSON.stringify(airSupport, null, 2)};\n`,
  };

  for (const [name, body] of Object.entries(files)) {
    await fs.writeFile(path.join(OUT_DIR, name), body, "utf8");
  }

  console.log(
    [
      `قوانين: ${laws.length} (رئيسية ${laws.filter((l) => l.category === "main").length} / شائعة ${laws.filter((l) => l.category === "common").length})`,
      `مكافآت: ${rewards.length}`,
      `سلايدات الدليل: ${guide.length}`,
      `سلايدات العمليات: ${operations.length}`,
      `سلايدات المشرفين: ${supervisor.length}`,
      `سلايدات الدعم الجوي: ${airSupport.length}`,
    ].join("\n"),
  );
}

main().catch((err) => {
  console.error("فشل الاستخراج:", err.message);
  process.exit(1);
});
