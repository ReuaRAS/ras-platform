# المرحلة 8 — المجتمع والتفاعل

> **بنية تحتية فقط.** لا كود وظيفي بعد. الجداول موجودة في Supabase (`member_xp`, `faq`).

## النطاق
| البند | الحالة | مكان التنفيذ المقترح |
|---|---|---|
| 8.1 XP والرتب | جزئي: `member_xp` + صفحة الأعضاء في لوحة الإدارة | `lib/admin/actions-members.ts` |
| 8.2 Leaderboard | منفّذ: `/leaderboard` و`/sectors/[slug]/leaderboard` | — |
| 8.3 Practice Mode | جزئي: `is_practice` في المحاولات | `app/api/test/start/route.ts` |
| 8.4 Help Center | منفّذ: `/sectors/[slug]/help` + `/admin/faq` | — |
| 8.5 Global Search | غير منفّذ (`pg_trgm` جاهز في القاعدة) | `components/Navbar.tsx` |
| 8.6 Notification Bell | منفّذ: `components/NotificationBell.tsx` | — |
| 8.7 Public Profile | غير منفّذ | `app/(public)/member/[discord_id]/page.tsx` |
| 8.8 Social Sharing | غير منفّذ | `app/api/og/certificate/[no]/route.tsx` |

## قواعد
- كل قراءة عامة تمر عبر `createPublicSupabase()` حتى تعمل صفحات ISR.
- لا تُعرض بيانات حساسة (Discord ID كامل، العمر، الرتبة) في أي صفحة عامة.
- كل كتابة تمر عبر Server Action محمي بـ `requirePermission`.

## TODO
- [ ] `// TODO: Phase 8` في `lib/data.ts` لإضافة `getLeaderboard()`.
- [ ] إضافة XP تلقائيًا (+50 نجاح اختبار، +100 إصدار شهادة).
- [ ] تفعيل Practice Mode من واجهة الاختبار وحفظه في `practice_attempts`.
