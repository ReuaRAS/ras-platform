# المرحلة 12 — الربط مع Discord

## الجاهز حاليًا
- `public.discord_events (sector_id, event_type, payload)`.
- `collectors` القطاعات تحتوي `discord_guild_id`.

## المطلوب
- [ ] بوت Discord (خارج هذا المستودع أو كـ Worker منفصل) يستدعي Webhook داخلي.
- [ ] API Route `/api/discord/webhook` يتحقق من توقيع الطلب (Ed25519) قبل أي كتابة.
- [ ] مزامنة الأعضاء والرتب: `members (discord_id, guild_id, roles jsonb, joined_at)`.
- [ ] ربط الحضور الصوتي بـ `attendance_records` (المرحلة 9).
- [ ] إرسال إشعارات عبر Discord عند إصدار شهادة أو اعتماد ترقية.

## تحذير أمني
- مفتاح البوت لا يُخزّن في المستودع ولا في `NEXT_PUBLIC_*`؛ ضعه في متغيرات بيئة السيرفر.
- تحقّق دائمًا من `X-Signature-Ed25519` — رفض الطلبات غير الموقّعة.
