import type { ContentSector } from "@/lib/content/types";

/**
 * قطاع أمن العام (PS) — محتوى جزئي.
 *
 * المصادر في المواصفة (القسم 12.3):
 *  - عرض 1 و عرض 2: تم تنزيلهما كـPDF (متاحان للعرض).
 *  - عرض 3 و عرض 4 و عرض 5: تتطلب صلاحية وصول (401) — لم يتم تخمين محتواها.
 *  - المستندات النصية: تتطلب صلاحية وصول.
 *
 * لا يُنشأ أي محتوى من عندنا، والدورات تبقى غير مفعّلة حتى يراجعها القطاع.
 */
export const publicSecurityContent: ContentSector = {
  slug: "public-security",
  name: "أمن العام",
  sector_code: "PS",
  primary_color: "#2980b9",
  primary_color_light: "#3498db",
  primary_color_dark: "#1f618d",
  description: "أمن العام بمحافظة الرس — الأمن والمرور والمهام الخاصة.",
  laws: [],
  rewards: [],
  guide: [],
  recruitment: {
    is_open: false,
    description:
      "المحتوى قيد الاستكمال من إدارة القطاع. التقديم يُفتح بعد اعتماد الدورات وبنوك الأسئلة.",
    conditions: [],
  },
  courses: [
    {
      slug: "deck-1",
      title: "أمن العام — عرض 1",
      description:
        "العرض الأول من مواد القطاع (كما ورد في المصادر الرسمية). يُفعّل بعد اعتماد الإدارة.",
      certificate_prefix: "PS-D1",
      pdf_url: "/content/public-security/deck-1.pdf",
      source_url:
        "https://docs.google.com/presentation/d/1LKeY6Ny9dJpyqbDr4VQ6Go92i3D3TBN3k6BQyZly-mM/edit",
      slides: [{ title: "عرض 1", content: "<p>المادة الأصلية معروضة بصيغة PDF أدناه.</p>" }],
      questions: [],
      is_active: false,
    },
    {
      slug: "deck-2",
      title: "أمن العام — عرض 2",
      description:
        "العرض الثاني من مواد القطاع (كما ورد في المصادر الرسمية). يُفعّل بعد اعتماد الإدارة.",
      certificate_prefix: "PS-D2",
      pdf_url: "/content/public-security/deck-2.pdf",
      source_url:
        "https://docs.google.com/presentation/d/1FmPAvSEZvVvCeS83wYn3paGk2SJzabc_3THbY1e-AI0/edit",
      slides: [{ title: "عرض 2", content: "<p>المادة الأصلية معروضة بصيغة PDF أدناه.</p>" }],
      questions: [],
      is_active: false,
    },
  ],
};
