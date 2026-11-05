import { z } from "zod";

/** مخططات التحقق (Zod) لمدخلات الاختبارات ولوحة الإدارة. */

export const startAttemptSchema = z.object({
  testId: z.string().uuid("معرّف الاختبار غير صالح"),
  traineeName: z
    .string()
    .trim()
    .min(3, "الاسم في المحافظة يجب أن يكون 3 أحرف على الأقل")
    .max(60, "الاسم طويل جدًا"),
  discordUsername: z
    .string()
    .trim()
    .min(2, "اسم ديسكورد مطلوب")
    .max(40, "اسم ديسكورد طويل جدًا"),
  discordId: z
    .string()
    .trim()
    .regex(/^\d{17,20}$/, "معرّف ديسكورد يجب أن يكون بين 17 و20 رقمًا"),
  realAge: z.coerce
    .number()
    .int("العمر يجب أن يكون رقمًا صحيحًا")
    .min(15, "العمر يجب أن يكون 15 سنة أو أكثر")
    .max(80, "العمر يجب أن يكون 80 سنة أو أقل"),
  currentRank: z.string().trim().min(2, "الرتبة الحالية مطلوبة").max(40),
  turnstileToken: z.string().trim().max(4096).optional().default(""),
});

export type StartAttemptInput = z.infer<typeof startAttemptSchema>;

export const suspicionFlagSchema = z.object({
  type: z.string().max(40),
  at: z.string().max(40),
});

export const submitAttemptSchema = z.object({
  attemptId: z.string().uuid("معرّف المحاولة غير صالح"),
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        choiceId: z.string().uuid().nullable(),
      }),
    )
    .min(1, "لا توجد إجابات مرسلة")
    .max(200),
  suspicionFlags: z.array(suspicionFlagSchema).max(60).optional().default([]),
});

export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;

/** وضع التدريب: تصحيح بلا شهادة ولا نقاط ولا تسجيل بيانات شخصية. */
export const practiceSubmitSchema = z.object({
  testId: z.string().uuid("معرّف الاختبار غير صالح"),
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        choiceId: z.string().uuid().nullable(),
      }),
    )
    .min(1, "لا توجد إجابات مرسلة")
    .max(200),
});

export type PracticeSubmitInput = z.infer<typeof practiceSubmitSchema>;

export const revokeCertificateSchema = z.object({
  certificateId: z.string().uuid(),
  reason: z.string().trim().min(5, "سبب الإلغاء مطلوب (5 أحرف على الأقل)").max(300),
});

export const lawSchema = z.object({
  id: z.string().optional(),
  law_code: z.string().trim().min(1, "كود القانون مطلوب").max(40),
  title: z.string().trim().min(2, "عنوان القانون مطلوب").max(200),
  penalty: z.string().trim().min(1, "العقوبة مطلوبة").max(300),
  additional_penalty: z.string().trim().max(300).optional().nullable(),
  category: z.enum(["main", "common"]).default("main"),
  notes: z.string().trim().max(500).optional().nullable(),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
});

export const rewardSchema = z.object({
  id: z.string().optional(),
  reward_code: z.string().trim().min(1, "كود المكافأة مطلوب").max(40),
  title: z.string().trim().min(2, "عنوان المكافأة مطلوب").max(200),
  reward_value: z.string().trim().min(1, "قيمة المكافأة مطلوبة").max(300),
  conditions: z.string().trim().max(500).optional().nullable(),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
});

export const courseSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2, "عنوان الدورة مطلوب").max(200),
  slug: z
    .string()
    .trim()
    .min(2, "المعرّف مطلوب")
    .max(80)
    .regex(/^[a-z0-9-]+$/, "المعرّف يسمح بحروف إنجليزية صغيرة وأرقام وشرطات فقط"),
  description: z.string().trim().max(1000).optional().nullable(),
  certificate_prefix: z.string().trim().min(2, "رمز الشهادة مطلوب").max(30),
  pass_score: z.coerce.number().min(1).max(100).default(70),
  time_limit_minutes: z.coerce.number().int().min(1).max(240).default(20),
  questions_per_attempt: z.coerce.number().int().min(1).max(100).default(10),
  duration_days: z.coerce.number().int().min(1).max(3650).optional().nullable(),
  slides_json: z.string().optional(),
  is_active: z.coerce.boolean().default(true),
});

export const loginSchema = z.object({
  sector: z.string().trim().min(1, "اختر القطاع"),
  password: z.string().min(1, "كلمة المرور مطلوبة").max(200),
  turnstileToken: z.string().optional().default(""),
});

/** تحويل أخطاء Zod إلى رسالة عربية واحدة */
export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "بيانات غير صالحة";
}
