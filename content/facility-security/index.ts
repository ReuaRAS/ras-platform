import type { ContentSector } from "@/lib/content/types";

/**
 * قطاع أمن المنشآت (FS) — مستخرج من بوابة أمن المنشآت الرسمية
 * (https://muhamid9397827.github.io/rass-academy/portal/academy.html). الدورات الست ودليل الترقيات كملفات PDF،
 * والمرجع المعتمد هو دليل القطاع الشامل.
 */
export const facilitySecurityContent: ContentSector = {
  slug: "facility-security",
  name: "أمن المنشآت",
  sector_code: "FS",
  primary_color: "#27ae60",
  primary_color_light: "#2ecc71",
  primary_color_dark: "#1e8449",
  description: "أمن منشآت بمحافظة الرس — حماية المنشآت الحيوية والموانئ والمرافق.",
  laws: [],
  rewards: [],
  guide: [],
  guide_pdf_url: "/content/facility-security/approved-reference.pdf",
  recruitment: {
    is_open: false,
    description: "المرجع المعتمد ودورات القطاع متاحة للقراءة. التقديم يُفتح بعد اعتماد القطاع.",
    conditions: [],
  },
  courses: [
    {
      slug: "individual-qualification",
      title: "دورة تأهيل الأفراد",
      description: "مسار تأهيل المتقدمين الجدد وتحديد الرتبة المبدئية. نسبة الاجتياز 50%.",
      certificate_prefix: "FS-IND",
      pdf_url: "/content/facility-security/individual-qualification.pdf",
      source_url: "https://muhamid9397827.github.io/rass-academy/portal/academy.html",
      slides: [
      ],
      questions: [],
      is_active: true,
      pass_score: 50,
    },
    {
      slug: "operations",
      title: "دورة العمليات",
      description: "دورة العمليات لأمن المنشآت — من جندي إلى جندي أول.",
      certificate_prefix: "FS-OPS",
      pdf_url: "/content/facility-security/operations.pdf",
      source_url: "https://muhamid9397827.github.io/rass-academy/portal/academy.html",
      slides: [
      ],
      questions: [],
      is_active: true,
      pass_score: 70,
    },
    {
      slug: "military-character",
      title: "دورة الشخصية العسكرية",
      description: "الانضباط والسلوك العسكري — من جندي أول إلى عريف.",
      certificate_prefix: "FS-MIL",
      pdf_url: "/content/facility-security/military-character.pdf",
      source_url: "https://muhamid9397827.github.io/rass-academy/portal/academy.html",
      slides: [
      ],
      questions: [],
      is_active: true,
      pass_score: 70,
    },
    {
      slug: "air-wing",
      title: "دورة الجناح الجوي",
      description: "الجناح الجوي لأمن المنشآت — من عريف إلى وكيل رقيب.",
      certificate_prefix: "FS-AIR",
      pdf_url: "/content/facility-security/air-wing.pdf",
      source_url: "https://muhamid9397827.github.io/rass-academy/portal/academy.html",
      slides: [
      ],
      questions: [],
      is_active: true,
      pass_score: 70,
    },
    {
      slug: "zone-officer",
      title: "دورة ضابط منطقة",
      description: "ضابط المنطقة — من رقيب أول إلى رئيس رقباء.",
      certificate_prefix: "FS-ZON",
      pdf_url: "/content/facility-security/zone-officer.pdf",
      source_url: "https://muhamid9397827.github.io/rass-academy/portal/academy.html",
      slides: [
      ],
      questions: [],
      is_active: true,
      pass_score: 70,
    },
    {
      slug: "swat",
      title: "دورة السوات",
      description: "وحدة السوات — لرتبة رئيس رقباء.",
      certificate_prefix: "FS-SWT",
      pdf_url: "/content/facility-security/swat.pdf",
      source_url: "https://muhamid9397827.github.io/rass-academy/portal/academy.html",
      slides: [
      ],
      questions: [],
      is_active: true,
      pass_score: 70,
    },
    {
      slug: "promotions-guide",
      title: "دليل الترقيات",
      description: "مرجع الترقيات للأفراد والضباط كما ورد من القطاع.",
      certificate_prefix: "FS-PRG",
      pdf_url: "/content/facility-security/promotions-guide.pdf",
      source_url: "https://muhamid9397827.github.io/rass-academy/portal/academy.html",
      slides: [
      ],
      questions: [],
      is_active: true,
      pass_score: 70,
    },
  ],
  schedules: [],
};
