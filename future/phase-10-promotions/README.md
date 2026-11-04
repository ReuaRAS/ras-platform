# المرحلة 10 — الترقيات والرتب

## الجاهز حاليًا
- `public.promotions (discord_id, from_rank, to_rank, approved_by, approved_at)`.

## المطلوب
- [ ] جدول `ranks (sector_id, code, title, sort_order, min_xp, requirements jsonb)`.
- [ ] سجل رتب لكل عضو `member_ranks (discord_id, rank_id, assigned_at)`.
- [ ] صفحة `/admin/promotions` لطلب الترقية واعتمادها (مسار: طلب → مراجعة → اعتماد).
- [ ] عند الاعتماد: تحديث الرتبة + إشعار العضو + تسجيل في `audit_logs`.
- [ ] صفحة عامة تعرض سلم الرتب لكل قطاع.

## ملاحظة
- `test_attempts.current_rank` يُخزّن الرتبة وقت الاختبار كـ snapshot — لا تعتمد عليه
  كمصدر حقيقة للرتبة الحالية.
