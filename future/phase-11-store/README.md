# المرحلة 11 — متجر النقاط

## الجاهز حاليًا
- `public.store_items (sector_id, name, price, stock, is_active)`.

## المطلوب
- [ ] جدول `store_orders (item_id, discord_id, price_paid, status, fulfilled_by, created_at)`.
- [ ] RPC `purchase_item` ذرية: تتحقق من الرصيد (`member_xp`) والمخزون ثم تخصم وتُنشئ الطلب.
- [ ] صفحة `/admin/store` لإدارة العناصر وتسليم الطلبات (قيد/تم/ملغي).
- [ ] صفحة عامة للمتجر تعرض الرصيد والعناصر المتاحة.
- [ ] كل عملية شراء تُسجّل في `xp_events` بسبب `store_purchase`.

## تحذير
- لا تعتمد على خصم الرصيد في المتصفح؛ كل الحساب في RPC على السيرفر.
