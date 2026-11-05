# المراحل 8 – 13 — منفّذة

هذه المراحل كانت مخططًا فقط، وصارت الآن مبنية بالكامل في التطبيق:

| المرحلة | الملفات المنفّذة |
| --- | --- |
| 8 — XP والمستويات | `supabase/phase-08-13.sql` (`xp_levels`, RPC `add_xp`)، `lib/certificates.ts`، `/admin/members`، `/leaderboard` |
| 9 — الحضور | RPC `mark_attendance`، `/admin/attendance`، `/api/admin/attendance/export` (CSV) |
| 10 — الرتب والترقيات | جدولا `ranks` و`member_ranks`، `/admin/promotions`، `/sectors/[slug]/ranks` |
| 11 — متجر النقاط | جدول `store_orders`، RPC `purchase_item` و`cancel_store_order`، `/admin/store`، `/sectors/[slug]/store` |
| 12 — Discord | `/api/discord/webhook` (تحقق Ed25519)، `/admin/discord`، جدول `discord_events` |
| 13 — الإشعارات | RPC `notify_sector`، `/admin/notifications`، زر «تحديد الكل كمقروء» في `components/NotificationBell.tsx` |

المخطط الكامل في `supabase/schema.sql` (يشمل قسم المراحل 8 – 13 في نهايته)، والملف
`supabase/phase-08-13.sql` هو نفسه لتطبيقه منفردًا على قاعدة قائمة.

## متغيرات البيئة الجديدة

- `DISCORD_PUBLIC_KEY` — المفتاح العام لتطبيق Discord (إلزامي لتشغيل الـ webhook،
  وبدونه يرد المسار 503).

## قرارات تصميم

1. كل الكتابات تمر عبر Server Actions أو RPC بمفتاح `service_role`، مع تحقق صلاحية
   (`requirePermission` + سياسات RLS).
2. XP والمتجر يعملان داخل معاملة واحدة في الدالة (`add_xp` / `purchase_item`)، ولا
   يوجد أي حساب للرصيد في المتصفح.
3. لا بيانات وهمية: كل الشاشات تبدأ بحالة فارغة (Empty State) وتُعبّأ من اللوحة.
4. معرّفات Discord تُعرض مختصرة (`••••1234`) في لوحة الصدارة العامة.
