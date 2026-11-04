# المرحلة 8 — نظام XP والترقيات

## الجاهز حاليًا
- `public.member_xp (discord_id unique, sector_id, total_xp, level)`.
- `public.xp_events (discord_id, amount, reason)`.
- `addXp()` في `lib/certificates.ts` يضيف **+100 XP** عند إصدار شهادة (لا يُفشل الإصدار عند الخطأ).

## المطلوب
- [ ] دالة `public.add_xp(p_discord_id, p_sector, p_amount, p_reason)` ذرية + مشغّل يحدّث `level`.
- [ ] جدول `xp_levels (level, min_xp, title)` لعتبات المستويات.
- [ ] صفحة `/admin/members` لعرض الأعضاء ونقاطهم وترتيبهم في القطاع.
- [ ] صفحة عامة `/leaderboard` (اختياري) بأعلى 20 عضوًا لكل قطاع.
- [ ] زر «خصم XP» للمدير العام مع سبب إلزامي (يُسجّل في `audit_logs`).

## TODO في الكود
- `lib/certificates.ts` → استبدال قراءة/كتابة `member_xp` المباشرة بـ RPC.
- `lib/types.ts` → إضافة `MemberXp`, `XpEvent`.
