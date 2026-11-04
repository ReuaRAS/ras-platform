# المرحلة 9 — الحضور والانصراف

## الجاهز حاليًا
- `public.attendance_records (sector_id, discord_id, status, checked_in_at, note)`.

## المطلوب
- [ ] صفحة `/admin/attendance` بشبكة شهرية (عضو × يوم) مع أزرار حاضر/متأخر/غائب/بعذر.
- [ ] RPC `mark_attendance` تمنع التكرار في اليوم نفسه (unique على `(discord_id, date)`).
- [ ] تصدير CSV للشهر المحدد.
- [ ] ربط تلقائي مع Discord (المرحلة 12) لحضور القنوات الصوتية.
- [ ] احتساب نسبة الحضور وإضافتها إلى ملف العضو.

## TODO في الكود
- إضافة صلاحية `attendance.write` إلى `PERMISSIONS` و`ROLE_PERMISSIONS`.
- إضافة عنصر للقائمة في `ADMIN_NAV`.
