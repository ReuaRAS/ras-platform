# المرحلة 9 — الأمان المتقدم

> **بنية تحتية فقط.** الجدول `role_permissions` موجود فارغًا في Supabase.

## النطاق
| البند | الحالة | ملاحظات |
|---|---|---|
| 9.1 2FA (TOTP) | غير منفّذ | Supabase Auth MFA + Backup Codes |
| 9.2 Granular Permissions | جزئي: `lib/permissions.ts` صلاحيات ثابتة في الكود | تُقرأ من `role_permissions` |
| 9.3 Discord ID uniqueness | جزئي: منع التكرار خلال ساعة في `/api/test/start` | توسيع إلى 24 ساعة + منع من لديه شهادة |
| 9.4 Session Management | غير منفّذ | `/admin/settings/sessions` |
| 9.5 Super Admin extra | غير منفّذ | IP whitelisting + تنبيه بريدي |

## قواعد
- أي قاعدة أمان جديدة تُطبّق في **القاعدة (RLS) أولًا**، ثم في Server Actions.
- كل محاولة مرفوضة تُسجّل في `audit_logs` مع `metadata.reason`.

## TODO
- [ ] استبدال `ROLE_PERMISSIONS` الثابتة بـ RPC `has_permission(perm)`.
- [ ] إضافة تحقق Discord ID في `start` و`submit`.
- [ ] توثيق تغيير كلمات مرور القطاعات الافتراضية.
