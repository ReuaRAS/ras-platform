# المراحل 8 – 13 (بنية فارغة)

هذه المجلدات مخصّصة للمراحل التي **لم** تُنفّذ في الـ MVP. لا تحتوي على كود تشغيلي،
فقط مخطط لكل مرحلة + ما هو جاهز أصلًا في قاعدة البيانات.

| المرحلة | المجلد | الجداول الجاهزة | الحالة |
| --- | --- | --- | --- |
| 8 | `phase-08-xp` | `member_xp`, `xp_events` | الجدولان موجودان + `addXp()` يكتب فيهما عند إصدار شهادة |
| 9 | `phase-09-attendance` | `attendance_records` | جدول فقط |
| 10 | `phase-10-promotions` | `promotions` | جدول فقط |
| 11 | `phase-11-store` | `store_items` | جدول فقط |
| 12 | `phase-12-discord` | `discord_events` | جدول فقط |
| 13 | `phase-13-notifications` | `notifications` | جدول + `components/NotificationBell.tsx` (قراءة فقط) |

## قواعد عامة عند التنفيذ

1. كل كتابة تمر عبر Server Action أو API Route بمفتاح `service_role`، مع تحقق صلاحيات
   (`has_permission` في القاعدة أو `lib/permissions.ts` في الكود).
2. أي جدول جديد يحتاج `enable row level security` + سياسات صريحة.
3. لا بيانات وهمية: كل شاشة جديدة تبدأ بحالة فارغة (Empty State) قابلة للتعبئة من اللوحة.
4. أضف رابط الصفحة الجديدة إلى `ADMIN_NAV` في `lib/permissions.ts` مع الصلاحية المناسبة.
