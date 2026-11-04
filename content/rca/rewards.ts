/**
 * مكافآت الهلال الأحمر (8 مكافآت)
 * المصدر: https://rasrca.netlify.app/rewards-content.html
 * تم التوليد آليًا بواسطة scripts/extract-rca.mjs — لا تُحرّر يدويًا.
 */
import type { ContentReward } from "@/lib/content/types";

export const rcaRewards: ContentReward[] = [
  {
    "reward_code": "RCA-R01",
    "title": "تنظيم التوظيف",
    "reward_value": "1,000,000 ريال",
    "conditions": "كحد أقصى",
    "sort_order": 1
  },
  {
    "reward_code": "RCA-R02",
    "title": "شرح الدليل الشامل للهلال",
    "reward_value": "1,000,000 ريال",
    "conditions": "كحد أقصى",
    "sort_order": 2
  },
  {
    "reward_code": "RCA-R03",
    "title": "سد العجز",
    "reward_value": "500,000 ريال",
    "conditions": "كحد أقصى، بشرط ألا يزيد عدد الأشخاص عن 4 أشخاص",
    "sort_order": 3
  },
  {
    "reward_code": "RCA-R04",
    "title": "مشاركة الهلال الأحمر لمرة واحدة في صور المحافظة",
    "reward_value": "500,000 ريال",
    "conditions": "كحد أقصى, تصوير شخصي",
    "sort_order": 4
  },
  {
    "reward_code": "RCA-R05",
    "title": "إجتهاد فالميدان",
    "reward_value": "250,000 ريال",
    "conditions": "كحد أقصى",
    "sort_order": 5
  },
  {
    "reward_code": "RCA-R06",
    "title": "تمرير بلاغات عبر راديو بشكل مميز",
    "reward_value": "250,000 ريال",
    "conditions": "كحد أقصى",
    "sort_order": 6
  },
  {
    "reward_code": "RCA-R07",
    "title": "وصول الإنعاشات إلى 500 إنعاش خلال أسبوع",
    "reward_value": "1,000,000 ريال",
    "conditions": "كحد أقصى",
    "sort_order": 7
  },
  {
    "reward_code": "RCA-R08",
    "title": "وصول الإنعاشات إلى 1,000 إنعاش خلال أسبوع",
    "reward_value": "2,000,000 ريال",
    "conditions": "كحد أقصى",
    "sort_order": 8
  }
];
