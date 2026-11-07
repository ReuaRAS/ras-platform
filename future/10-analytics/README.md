# المرحلة 10 — التحليلات والتقارير

> **بنية تحتية فقط.** الجدول `scheduled_reports` موجود فارغًا.

## النطاق
| البند | الحالة | ملاحظات |
|---|---|---|
| 10.1 Analytics Dashboard | غير منفّذ | `/admin/analytics` + Recharts |
| 10.2 Export | جزئي: تصدير الحضور CSV في `/api/admin/attendance/export` | إضافة xlsx لكل جدول |
| 10.3 Scheduled Reports | غير منفّذ | GitHub Actions Cron أو Supabase Cron (بدل وظائف Netlify) |
| 10.4 Member statistics | جزئي: صفحة الأعضاء في اللوحة | إضافة الرسوم |

## قواعد
- التصدير الكبير يتم على السيرفر (stream) لا في المتصفح.
- كل تصدير يُسجّل في `audit_logs`.

## TODO
- [ ] تجميع الأعداد عبر SQL Views بدل عدة استعلامات في الصفحة.
- [ ] دعم تصدير PDF عبر `lib/pdf/generate.ts` نفسه.
