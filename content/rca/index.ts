import type { ContentSector } from "@/lib/content/types";
import { rcaLaws } from "./laws";
import { rcaRewards } from "./rewards";
import { rcaGuideSlides } from "./guide";
import { rcaOperationsSlides } from "./operations";
import { rcaSupervisorSlides } from "./supervisor";
import { rcaAirSupportSlides } from "./air-support";

/**
 * قطاع الهلال الأحمر — مكتمل من المصادر الرسمية.
 * بنوك الأسئلة تُضاف من لوحة الإدارة (المصدر لا يوفّر بنك أسئلة قابلًا للقراءة).
 */
export const rcaContent: ContentSector = {
  slug: "red-crescent",
  name: "الهلال الأحمر",
  sector_code: "RCA",
  primary_color: "#c62828",
  primary_color_light: "#e63946",
  primary_color_dark: "#b71c1c",
  description:
    "قطاع الهلال الأحمر بمحافظة الرس — الإسعاف والإنعاش، بروتوكولات الراديو، التوزيع الميداني، دورات المشرفين والدعم الجوي.",
  laws: rcaLaws,
  rewards: rcaRewards,
  guide: rcaGuideSlides,
  recruitment: {
    is_open: true,
    description:
      "التقديم مفتوح لمن يجتاز الدليل الشامل واختبار التوظيف. اقرأ الدليل الشامل أولًا ثم ابدأ الاختبار.",
    conditions: [
      "الالتزام باسم موحّد بين اللعبة وديسكورد",
      "اجتياز اختبار التوظيف بنسبة 70% أو أكثر",
      "الالتزام ببروتوكولات الراديو والأكواد المعتمدة",
      "الحد الأدنى للعمر الحقيقي 15 سنة",
    ],
  },
  courses: [
    {
      slug: "operations",
      title: "دورة العمليات",
      description: "مركز العمليات، أكواد الحالات، تمرير البلاغات وتنسيق الوحدات في الميدان.",
      certificate_prefix: "RCA-CO",
      pass_score: 70,
      time_limit_minutes: 20,
      questions_per_attempt: 10,
      slides: rcaOperationsSlides,
      questions: [],
    },
    {
      slug: "supervisor-field",
      title: "دورة المشرفين — ميداني",
      description: "مهام المشرف الميداني، إدارة الوحدات، والتعامل مع الحالات الحرجة.",
      certificate_prefix: "RCA-SUP-M",
      pass_score: 70,
      time_limit_minutes: 20,
      questions_per_attempt: 10,
      slides: rcaSupervisorSlides,
      questions: [],
    },
    {
      slug: "supervisor-general",
      title: "دورة المشرفين — عام",
      description: "الإشراف العام على القطاع، التقييم، والتقارير الإدارية.",
      certificate_prefix: "RCA-SUP-G",
      pass_score: 70,
      time_limit_minutes: 20,
      questions_per_attempt: 10,
      slides: rcaSupervisorSlides,
      questions: [],
    },
    {
      slug: "air-support",
      title: "دورة الدعم الجوي",
      description: "دورة ميدانية — التدريب يتم في الميدان تحت إشراف القيادة، ولا يوجد اختبار نظري.",
      certificate_prefix: "RCA-AIR",
      pass_score: 70,
      time_limit_minutes: 20,
      questions_per_attempt: 10,
      slides: rcaAirSupportSlides,
      questions: [],
      is_active: true,
    },
  ],
};
