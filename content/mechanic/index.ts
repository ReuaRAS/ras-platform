import type { ContentSector } from "@/lib/content/types";
import { rcaLaws } from "@/content/rca/laws";
import { rcaRewards } from "@/content/rca/rewards";
import { mechanicSchedule } from "./schedule";

/**
 * قطاع كراج الميكانيك (MG).
 * - الدليل والدورات: من عروض Google Slides الرسمية (محوّلة إلى PDF داخل public/content).
 * - الجدول: مستورد من Google Sheets الرسمي.
 * - القوانين والمكافآت: منسوخة من قطاع الهلال الأحمر وفق سياسة seed_sector_defaults.
 */
export const mechanicContent: ContentSector = {
  slug: "mechanic-garage",
  name: "كراج الميكانيك",
  sector_code: "MG",
  primary_color: "#e67e22",
  primary_color_light: "#f39c12",
  primary_color_dark: "#ca6f1e",
  description:
    "كراج الميكانيك بمحافظة الرس — الصيانة والتعديل والتزويد، التسطيح الميداني، وإدارة الورشة.",
  guide: [
    {
      title: "الدليل الشامل — كراج الميكانيك",
      content:
        "<p>الدليل الشامل للقطاع: التعريف، المهام، المحظورات، وطريقة التسطيح. يُعرض الدليل كاملًا بصيغة PDF أدناه.</p>",
    },
  ],
  guide_pdf_url: "/content/mechanic/guide.pdf",
  laws: rcaLaws,
  rewards: rcaRewards,
  recruitment: {
    is_open: true,
    description:
      "التقديم على كراج الميكانيك مفتوح. اقرأ الدليل الشامل ثم اجتَز اختبار التوظيف للانضمام.",
    conditions: [
      "قراءة الدليل الشامل للقطاع",
      "اجتياز اختبار التوظيف بنسبة 70% أو أكثر",
      "الالتزام بتعليمات مدير الكراج والمشرفين",
    ],
  },
  courses: [
    {
      slug: "field-guide",
      title: "دورة موجه ميداني",
      description: "مهام الموجه الميداني وطريقة استقبال الحالات وتوجيه الوحدات.",
      certificate_prefix: "MG-FLD",
      pdf_url: "/content/mechanic/field-guide.pdf",
      source_url:
        "https://docs.google.com/presentation/d/1oYNkhFoTgywQuFhbThq6cOlJrO7utBGLsbXCh-hcSbo/edit",
      slides: [
        {
          title: "دورة موجه ميداني",
          content: "<p>عرض الدورة كما ورد من القطاع. استخدم العارض أدناه ثم ابدأ الاختبار.</p>",
        },
      ],
      questions: [],
    },
    {
      slug: "modify-supply",
      title: "دورة تعديل وتزويد",
      description: "قواعد التعديل والتزويد داخل الورشة والحدود المسموحة.",
      certificate_prefix: "MG-MNT",
      pdf_url: "/content/mechanic/modify-supply.pdf",
      source_url:
        "https://docs.google.com/presentation/d/1GVtF_vdUvCT_D0gVmkZFGQq6m6lr2ocY17u1K9h5Vac/edit",
      slides: [
        {
          title: "دورة تعديل وتزويد",
          content: "<p>عرض الدورة كما ورد من القطاع. استخدم العارض أدناه ثم ابدأ الاختبار.</p>",
        },
      ],
      questions: [],
    },
    {
      slug: "field-supervisor",
      title: "دورة مشرف ميداني",
      description: "إشراف الورشة، متابعة الفنيين، وتقييم الأداء الميداني.",
      certificate_prefix: "MG-SFL",
      pdf_url: "/content/mechanic/field-supervisor.pdf",
      source_url:
        "https://docs.google.com/presentation/d/1NHX3TxFxqQkvkin7ANcBwOyS-pVejY5o1ujw01Tnhfs/edit",
      slides: [
        {
          title: "دورة مشرف ميداني",
          content: "<p>عرض الدورة كما ورد من القطاع. استخدم العارض أدناه ثم ابدأ الاختبار.</p>",
        },
      ],
      questions: [],
    },
    {
      slug: "general-supervisor",
      title: "دورة مشرف عام",
      description: "التخطيط والتقارير وإدارة الورشة على مستوى القطاع.",
      certificate_prefix: "MG-SGN",
      pdf_url: "/content/mechanic/general-supervisor.pdf",
      source_url:
        "https://docs.google.com/presentation/d/1BhqqXGBrqLHhPJG6smX8okJfsA0TNX-6KIjzNEJyceQ/edit",
      slides: [
        {
          title: "دورة مشرف عام",
          content: "<p>عرض الدورة كما ورد من القطاع. استخدم العارض أدناه ثم ابدأ الاختبار.</p>",
        },
      ],
      questions: [],
    },
  ],
  schedules: [mechanicSchedule],
};
