# المرحلة 13 — UX متقدم

> **بنية تحتية فقط.** الجدول `document_versions` موجود فارغًا.

## النطاق
| البند | الحالة | ملاحظات |
|---|---|---|
| 13.1 PWA | غير منفّذ | `manifest.json` + Service Worker |
| 13.2 Events Calendar | جزئي: `events` + `EventCountdown` | `/events` + ICS |
| 13.3 Document Versioning | جدول فقط | صفحة «التاريخ» + استرجاع |
| 13.4 Advanced filters | جزئي: فلترة النتائج والشهادات | فلاتر متعددة + حفظ |
| 13.5 Light mode | غير منفّذ | `localStorage` + `dark:` |

## TODO
- [ ] تسجيل تغييرات المستندات في `document_versions` داخل Server Actions.
