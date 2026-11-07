# المرحلة 11 — الشهادات المتقدمة

> **بنية تحتية فقط.** الجدول `certificate_signatures` موجود فارغًا.

## النطاق
| البند | الحالة | ملاحظات |
|---|---|---|
| 11.1 Multi-signature | جدول فقط | يُرسم أسفل PDF من `certificate_signatures` |
| 11.2 Expiry & Renewal | جزئي: عمود `expires_at` + `courses.duration_days` | تنبيه قبل 14 يومًا + تجديد |
| 11.3 Revocation | منفّذ: إلغاء بسبب في `/admin/certificates` + شارة حمراء في `/verify` | — |
| 11.4 Batch generation | غير منفّذ | `/admin/certificates/batch` من Excel |

## قواعد
- لا تُحذف شهادة أبدًا: تُلغى بحالة `status = 'revoked'` مع سبب.
- رقم الشهادة لا يُعاد استخدامه حتى بعد الإلغاء.

## TODO
- [ ] تعبئة `expires_at` عند الإصدار من مدة الدورة.
- [ ] طباعة التوقيعات في `lib/pdf/generate.ts`.
