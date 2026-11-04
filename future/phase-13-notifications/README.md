# المرحلة 13 — الإشعارات

## الجاهز حاليًا
- `public.notifications (user_id, sector_id, title, body, href, is_read, created_at)`.
- `components/NotificationBell.tsx` — Server Component يقرأ آخر 5 إشعارات غير مقروءة
  للمستخدم الحالي فقط (RLS: `user_id = auth.uid()`)، ويعمل بصمت إن لم يوجد الجدول.
- الجرس مضاف إلى ترويسة لوحة الإدارة.

## المطلوب
- [ ] RPC `notify_sector(sector_id, title, body, href)` تُستخدم من الأحداث (شهادة، ترقية، إعلان).
- [ ] زر «تحديد كمقروء» و«تحديد الكل كمقروء» (Server Action).
- [ ] إشعارات فورية (Realtime) عند وصول إشعار جديد.
- [ ] صفحة `/admin/notifications` لإنشاء إشعار يدوي لقطاع أو لمستخدم محدد.
- [ ] تنظيف تلقائي للإشعارات الأقدم من 90 يومًا.
