# منصة قطاعات محافظة الرس

منصة تدريب وشهادات لخمسة قطاعات في محافظة الرس: **الهلال الأحمر (RCA)**،
**الورشة الميكانيكية (MG)**، **الأمن العام (PS)**، **أمن المنشآت (FS)**،
و**الأفواج الأمنية (SB)** — الأخير يعمل بنظام **Onboarding** بلا أي بيانات مسبقة.

كل قطاع له هوية لونية، صفحات قانون/مكافآت/دورات/توظيف/جدول/إعلانات مستقلة،
ونظام اختبارات يحسب النتيجة ويصدر شهادة PDF برقم تسلسلي ورمز QR للتحقق.

---

## 1) التقنيات

| الطبقة | التقنية |
| --- | --- |
| الواجهة | Next.js 16 (App Router) + React 19 + TypeScript |
| التنسيق | Tailwind CSS v4 (بدون ملف config) + متغيّرات CSS لكل قطاع |
| قاعدة البيانات | Supabase (PostgreSQL + Auth + Storage + RLS) |
| الشهادات | `pdf-lib` + `arabic-persian-reshaper` + `bidi-js` (تشكيل عربي) + `qrcode` |
| التحقق من النماذج | Cloudflare Turnstile (اختياري في التطوير) |
| النشر | Cloudflare Workers (`@opennextjs/cloudflare`) |

---

## 2) التشغيل المحلي

```bash
npm install
cp .env.example .env.local     # املأ مفاتيح Supabase
npm run dev                    # http://localhost:3000
```

يعمل الموقع **بدون** Supabase أيضًا: يقرأ المحتوى من `content/` (استخراج آلي من
المواقع الرسمية)، لكن الاختبارات والشهادات ولوحة الإدارة تحتاج مفاتيح Supabase.

### 2.1 إعداد قاعدة البيانات

1. أنشئ مشروعًا في [Supabase](https://supabase.com).
2. **SQL Editor → New query** → الصق كامل `supabase/schema.sql` → **Run**.
   السكيما تنشئ: الجداول + الفهارس + الدوال (RPC) + سياسات RLS + Buckets + القطاعات الخمسة.
3. **Project Settings → API** وانسخ:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (**سري، سيرفر فقط**)
4. اضبط `NEXT_PUBLIC_APP_URL` على رابط الموقع (محليًا `http://localhost:3000`).

### 2.2 إنشاء حسابات الإدارة

**Authentication → Users → Add user** لكل قطاع، بنفس البريد الذي يتوقعه نظام الدخول
(`lib/auth/sector-map.ts`):

| القطاع | البريد |
| --- | --- |
| الهلال الأحمر | `rca@ras.internal` |
| الورشة الميكانيكية | `mg@ras.internal` |
| الأمن العام | `ps@ras.internal` |
| أمن المنشآت | `fs@ras.internal` |
| الأفواج الأمنية | `sb@ras.internal` |

بعد إنشاء المستخدم، شغّل في SQL Editor (كرر لكل قطاع بعنوانه وslug الخاص به):

```sql
update public.profiles
   set role = 'sector_admin',
       sector_id = (select id from public.sectors where slug = 'red-crescent'),
       display_name = 'قائد الهلال الأحمر'
 where id = (select id from auth.users where email = 'rca@ras.internal');
```

> إن لم يوجد صف في `profiles`، يُنشأ تلقائيًا عند أول تسجيل دخول من
> `app_metadata` (`sector_slug`, `role`, `display_name`).
> كلمات المرور تُضبط من لوحة Supabase، ولا تُحفظ في المستودع.

---

## 3) هيكل المشروع

```
app/
  page.tsx                    الصفحة الرئيسية (القطاعات الخمسة)
  sectors/[slug]/             صفحات القطاع: نظرة عامة، قوانين، مكافآت، دورات،
                              توظيف، دليل التوظيف، جدول، إعلانات، شهادات
  tools/field-name-generator/ مولّد أسماء الميدان
  certificates/               بحث الشهادات
  verify/[id]/                صفحة التحقق العامة (رقم الشهادة أو QR)
  test/[testId]/              بدء اختبار (تسجيل → أسئلة → نتيجة)
  admin/                      لوحة الإدارة (محميّة بـ middleware + RLS)
    laws, rewards, courses, courses/[id], tests, tests/[id],
    test-results, certificates, schedule, announcements, recruitment, audit-logs
  api/
    test/start, test/submit   بدء المحاولة وتصحيحها وإصدار الشهادة
    certificates/generate     إعادة توليد PDF لشهادة موجودة
components/                   الواجهة العامة + admin/ (نماذج اللوحة)
content/                      المحتوى المستخرج (fallback عند غياب Supabase)
lib/                          data.ts (قراءة موحّدة)، permissions.ts، auth/،
                              certificates.ts، pdf/، admin/actions.ts
supabase/schema.sql           المخطط الكامل
scripts/                      سكربتات استخراج المحتوى (قابلة لإعادة التشغيل)
future/                       بنية فارغة للمراحل 8–13
```

---

## 4) المسارات العامة

| المسار | الوصف |
| --- | --- |
| `/` | الصفحة الرئيسية + بطاقات القطاعات |
| `/sectors/[slug]` | نظرة عامة على القطاع |
| `/sectors/[slug]/laws` | القوانين + المخالفات الشائعة (بحث وفلترة) |
| `/sectors/[slug]/rewards` | المكافآت وشروطها |
| `/sectors/[slug]/courses` | الدورات المتاحة |
| `/sectors/[slug]/courses/[course]` | سلايدات الدورة + اختبارها |
| `/sectors/[slug]/recruitment` | التوظيف (مفتوح/مغلق + الشروط) |
| `/sectors/[slug]/recruitment/guide` | دليل المتقدم |
| `/sectors/[slug]/schedule` | جداول العمل |
| `/sectors/[slug]/announcements` | الإعلانات |
| `/sectors/[slug]/leaderboard` | صدارة أعضاء القطاع بالنقاط |
| `/sectors/[slug]/help` | الأسئلة الشائعة للقطاع (من جدول `faq`) |
| `/leaderboard` | لوحة الصدارة (أعلى 20 لكل قطاع، معرّفات مختصرة) |
| `/certificates` | التحقق من شهادة برقمها |
| `/verify/[certificateNo]` | صفحة التحقق (المسار داخل QR) |
| `/test/[testId]` | أداء اختبار |
| `/tools/field-name-generator` | أداة توليد أسماء ميدانية |
| `/privacy`, `/terms` | الخصوصية والشروط |

## 5) لوحة الإدارة

`/admin/login` → اختيار القطاع + كلمة المرور (+ Turnstile إن فُعّل).

الصلاحيات في `lib/permissions.ts` (ونسختها في قاعدة البيانات داخل `role_permissions`):

| الدور | أهم ما يستطيعه |
| --- | --- |
| `super_admin` | كل شيء + `audit-logs` لكل القطاعات |
| `sector_admin` | كل صفحات قطاعه + نسخ القوانين من قطاع مرجعي |
| `sector_vice` | كل شيء عدا حذف القوانين |
| `sector_trainer` | الدورات وبنك الأسئلة والاختبارات |
| `sector_reviewer` | النتائج والمراجعة والشهادات (قراءة) |
| `viewer` | لا يدخل اللوحة |

أهم سلوكيات اللوحة:

- **قوانين/مكافآت**: إضافة وتعديل وحذف + `seed_sector_defaults` لنسخ قوانين قطاع مرجعي.
- **دورات**: إعدادات الدورة (رمز الشهادة، نسبة النجاح، المدة، عدد الأسئلة) + تحرير
  السلايدات (JSON) + معاينة عامة.
- **اختبارات وبنك أسئلة**: اختبار دورة/توظيف، أسئلة بخيارات وأوزان نقاط.
  الاختبار بلا أسئلة **لا يسمح ببدء محاولة** (503 برسالة واضحة).
- **نتائج**: تصفية (ناجح/راسب/مشبوه)، رقم الشهادة قابل للنقر إلى صفحة التحقق،
  وأزرار اعتماد/رفض للمحاولات التي فيها 3 تحذيرات أو أكثر.
- **شهادات**: إلغاء مع سبب إلزامي (يظهر فورًا في صفحة التحقق) وإعادة تفعيل.
- **جدول**: أعمدة/صفوف JSON + رفع صورة (حتى 4MB) + نشر/مسودة.
- **إعلانات/توظيف**: تحرير كامل بلا كود.
- **سجل العمليات**: من فعل ماذا ومتى (المدير العام فقط).
- **الأعضاء والنقاط**: ترتيب الأعضاء بـ XP، تعديل يدوي بسبب إلزامي، وسجل الحركات.
- **الحضور**: شبكة شهرية (عضو × يوم) + تسجيل/حذف + تصدير CSV.
- **الترقيات والرتب**: تعريف سلّم الرتب، طلب ترقية، واعتماد/رفض (الاعتماد يمنح
  الرتبة ويُرسل إشعارًا لطاقم القطاع).
- **متجر النقاط**: إدارة العناصر والمخزون + شراء نيابة عن عضو + تسليم/إلغاء
  (الإلغاء يعيد النقاط والمخزون).
- **الإشعارات**: إرسال إشعار لقطاع أو للكل، وتحديد مقروء/الكل من الجرس.
- **Discord**: سجل أحداث الـ webhook وحالة المفتاح العام.
- **الأسئلة الشائعة**: تحرير أسئلة/أجوبة القطاع ونشرها في صفحة المساعدة العامة.

---

## 6) آلية الاختبار والشهادة

1. `POST /api/test/start`: تحقق Turnstile → حد **3 محاولات/ساعة** لكل `discord_id`
   → منع إعادة الاختبار بعد النجاح → سحب أسئلة عشوائية → إنشاء `test_attempts`.
2. `POST /api/test/submit`: تصحيح على السيرفر فقط (الخيارات الصحيحة لا تُرسل للعميل)،
   حفظ `test_answers`، وحساب النسبة.
3. عند النجاح: `issue_certificate_number` (ذري) → `PREFIX-YYYY-NNNN` → توليد PDF عربي
   + QR → رفع إلى bucket `certificates` → إدراج السجل → `audit_logs` → **+100 XP**.
4. صفحة `/verify/[no]` تعرض حالة الشهادة (صالحة/ملغاة/منتهية) وبياناتها.

**ملاحظة**: أثناء الاختبار يُمنع النسخ/اللصق، ويُسجَّل `visibilitychange` كتحذير
`suspicion_flags` (لا يُلغي المحاولة تلقائيًا — تُراجع يدويًا).

---

## 7) استخراج المحتوى

المحتوى الحقيقي مستخرج آليًا من مصادر القطاعات، والسكربتات قابلة لإعادة التشغيل:

```bash
node scripts/extract-rca.mjs        # قوانين/مكافآت/دليل/عمليات/مساندة جوية
node scripts/extract-mechanic.mjs   # جدول الميكانيك من Google Sheets (CSV)
node scripts/sync-google-slides.mjs # تنزيل عروض Google Slides كـ PDF
```

المصادر الأساسية:

- RCA: `https://rasrca.netlify.app` — صفحات `/guide`, `/operations`, `/supervisor`,
  `/air-support` وملفات `*-content.html`.
- MG: Google Slides (نُزّلت PDF في `public/content/mechanic/`) + جدول Google Sheets
  (195 صفًا، 12 عمودًا).
- PS: عرضان نُزّلا PDF؛ بقية العروض رجعت 401 من مصدرها.
- FS / SB: بلا محتوى خارجي — يُعبّأ من لوحة الإدارة.

---

## 8) الأمان

- **RLS مفعّل على كل الجداول**؛ الكتابة الإدارية تمر عبر Server Actions بمفتاح
  `service_role` مع تحقق صلاحية + فرض `sector_id` من الجلسة (لا من النموذج).
- `service_role` لا يُستورد في أي مكوّن عميل؛ ملف `lib/supabase/admin.ts` سيرفر فقط.
- الدخول محمي بـ: حد **5 محاولات/15 دقيقة** (`check_login_allowed`)، Turnstile،
  وتحقّق أن `app_metadata.sector_slug` يطابق القطاع المختار.
- كل إجراء إداري يُسجّل في `audit_logs` (الفاعل، الكيان، IP، User-Agent، الوقت).
- الدوال الحساسة (`issue_certificate_number`, `check_login_allowed`, …) مسحوبة من
  `anon`/`authenticated` وممنوحة لـ `service_role` فقط.
- صفحات `/admin/*` مستثناة من الفهرسة (`X-Robots-Tag: noindex`).
- **Sentry**: مفعّل عبر `instrumentation.ts` و`instrumentation-client.ts` بمجرد ضبط
  `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`؛ بلا مفتاح لا يُرسل أي شيء.
- **`/api/discord/webhook`** يتحقق من توقيع `X-Signature-Ed25519` مع الطابع الزمني،
  ويرفض بـ 401 أي طلب غير موقّع، وبـ 503 إن لم يُضبط `DISCORD_PUBLIC_KEY`.
- تعديل النقاط والشراء والإلغاء تُنفَّذ في RPC ذرية (`add_xp`, `purchase_item`,
  `cancel_store_order`) — لا حساب رصيد في المتصفح.

---

## 9) اختبار يدوي سريع

1. `npm run dev` ثم افتح `/` → خمس بطاقات قطاعات بألوانها.
2. `/sectors/red-crescent/laws` → 35 قانونًا مع فلترة وبحث.
3. `/sectors/mechanic-garage/schedule` → جدول 195 صفًا.
4. `/sectors/security-brigades` → حالة Onboarding بلا بيانات وهمية.
5. `/admin/login` بحساب قطاع → أضف قانونًا → تحقق من ظهوره فورًا في الصفحة العامة.
6. أنشئ دورة + اختبارًا + 3 أسئلة → `/test/[testId]` → أجب صحيحًا → تحقق من الشهادة
   عبر QR أو `/certificates`.
7. ألغِ الشهادة من اللوحة → صفحة التحقق يجب أن تعرض «ملغاة» مع السبب.
8. `/admin/audit-logs` (مدير عام) → كل الخطوات أعلاه مسجّلة.
9. `/admin/members` → أضف نقاطًا لعضو → يظهر في `/leaderboard` وفي شبكة الحضور.
10. `/admin/announcements` → أضف إعلانًا منشورًا → تحقق من ظهوره في
    `/sectors/[slug]/announcements`.
11. `/admin/faq` → أضف سؤالًا → تحقق من ظهوره في `/sectors/[slug]/help`.

---

## 10) النشر

### Cloudflare Workers (OpenNext) — نشر تلقائي من GitHub

الاستضافة على **Cloudflare** عبر `@opennextjs/cloudflare`. ملفا النشر الثابتان في
المستودع هما `wrangler.jsonc` و`open-next.config.ts`، وأي `git push` على `master`
يُطلق `.github/workflows/deploy-cloudflare.yml` الذي يبني ثم ينفّذ `wrangler deploy`.

الإعداد لمرة واحدة:

1. أنشئ حساب Cloudflare مجانيًا، ثم **My Profile → API Tokens → Create Token**
   بقالب *Edit Cloudflare Workers*.
2. في GitHub → **Settings → Secrets and variables → Actions**:
   - Secrets: `CLOUDFLARE_API_TOKEN` و`CLOUDFLARE_ACCOUNT_ID`
     و`SUPABASE_SERVICE_ROLE_KEY` (يُضبط على العامل بعد كل نشر تلقائيًا).
   - Account ID الحالي: `7045c92d8af12f63f765f3129eed4542`.
   - سِرّ اختياري للنسخ الاحتياطي اليومي: `SUPABASE_DB_URL` (Connection string من
     Supabase → Database). سير العمل `.github/workflows/backup-supabase.yml` ينسخ
     القاعدة يوميًا ويحفظ النسخة 7 أيام، ويتخطى نفسه بأمان إن لم يُضبط السِّرّ.
   - Variables: `NEXT_PUBLIC_SUPABASE_URL` و`NEXT_PUBLIC_SUPABASE_ANON_KEY`
     و`NEXT_PUBLIC_APP_URL` (رابط الموقع النهائي) و`NEXT_PUBLIC_TURNSTILE_SITE_KEY`
     إن استُخدم Turnstile.
3. رابط الموقع الحالي: **https://ras-sectors.lvlone-02.workers.dev** — اسم العامل
   من `wrangler.jsonc` (`ras-sectors`)؛ لتغييره غيّر `name` وأعد النشر. ولدومين
   خاص: **Settings → Domains & Routes** ثم أعد البناء بـ `NEXT_PUBLIC_APP_URL` الجديد.
4. الكاش التدريجي (ISR) معطّل لأن R2 غير مفعّل على الحساب. بعد تفعيل R2 من لوحة
   Cloudflare أضف `r2_buckets` + `durable_objects` + `migrations` كما في تعليقات
   الملفين `wrangler.jsonc` و`open-next.config.ts` لتنشيطه.

النشر يدويًا من هذا المجلد عند الحاجة: `npm run cf:build` ثم `npm run cf:deploy`،
وللمعاينة المحلية على workerd: `npm run cf:preview`.

> استضافة Freebuff Sites المُدارة ما زالت تعمل عبر `freebuff.wrangler.jsonc`
> و`freebuff.open-next.config.ts` (مولّدان، لا تُحرّرهما) ولا يوجد فيها ربط GitHub؛
> النشر إليها يجري من هذه المساحة بأداة Sites.

متغيرات البيئة:

- `NEXT_PUBLIC_*` تُدمج وقت البناء، وأهمّها `NEXT_PUBLIC_APP_URL` (يُستخدم في روابط
  تحقق الشهادات) — يجب أن يطابق الرابط المنشور فعليًا.
- `SUPABASE_SERVICE_ROLE_KEY` سِرّ على السيرفر فقط، ولا يوضع في الكود أو المتغيّرات العامة.

قراءة الخطوط في `lib/pdf/generate.ts`: على Workers تُقرأ من ربط `ASSETS` الثابت،
ومحليًا من `public/fonts` عبر نظام الملفات.

بعد النشر: أضف رابط الموقع في **Supabase → Authentication → URL Configuration**
(Site URL + Redirect URLs) حتى تعمل الجلسات.

### فحص المسار على الاستضافة

`node --env-file=.env.local .secrets/prod-smoke.mjs` ينشئ اختبارًا تجريبيًا على
بيئة الإنتاج، يمشي المسار (بدء → تصحيح → شهادة → تحقق → PDF) ويحذف كل ما أنشأه
(الاختبار والأسئلة والمحاولة والشهادة وملف PDF). لا تشغّله إلا وأنت موافق على
كتابة صفوف مؤقتة في قاعدة الإنتاج.

### تحديث رقم الشهادة في QR

`NEXT_PUBLIC_APP_URL` يُقرأ وقت التشغيل على السيرفر؛ أي تغيير يحتاج إعادة نشر،
والشهادات القديمة تحتفظ برابط التحقق المخزّن وقت إصدارها.

---

## 11) حالة المراحل

| المرحلة | الحالة |
| --- | --- |
| 0 — الإعداد والهوية البصرية | ✅ |
| 1 — القطاعات والمحتوى | ✅ |
| 2 — القوانين والمكافآت | ✅ |
| 3 — الدورات والسلايدات | ✅ |
| 4 — التوظيف والإعلانات والجدول | ✅ |
| 5 — نظام الاختبارات | ✅ |
| 6 — الشهادات والتحقق | ✅ |
| 7 — لوحة الإدارة والمصادقة | ✅ |
### المراحل 8–13 حسب المواصفة (ليست شرط إطلاق)

| البند | الحالة |
| --- | --- |
| 8.1 XP والرُتب | ✅ (`add_xp` + `xp_levels` + `ranks` + `member_ranks`) |
| 8.2 لوحة الصدارة | ✅ `/leaderboard` + `/sectors/[slug]/leaderboard` |
| 8.3 وضع التدريب (Practice) | ⏳ أُزيلت الصفحات؛ الحقول `is_practice` و`practice_attempts` جاهزة |
| 8.4 مركز المساعدة / FAQ | ✅ `/sectors/[slug]/help` + `/admin/faq` |
| 8.5 البحث الشامل (⌘K) | ⏳ لم يُبنَ |
| 8.6 جرس الإشعارات | ✅ |
| 8.7 الملف الشخصي العام | ⏳ يحتاج مصادقة أعضاء |
| 8.8 مشاركة اجتماعية / OG | ⏳ لم يُبنَ |
| 9.1 المصادقة الثنائية | ⏳ لم تُبنَ |
| 9.2 صلاحيات دقيقة | ✅ `role_permissions` + `has_permission` |
| 9.3 تفرد معرّف Discord | ⏳ |
| 9.4 إدارة الجلسات / 9.5 قائمة IP | ⏳ |
| 10.1 لوحة تحليلات | ⏳ |
| 10.2 تصدير Excel | ⏳ (تصدير CSV للحضور فقط) |
| 10.3 تقارير مجدولة | ⏳ الجدول `scheduled_reports` موجود |
| 11.1 توقيعات متعددة | ⏳ الجدول `certificate_signatures` موجود، الـPDF يطبع خطوط التوقيع فقط |
| 11.2 انتهاء وتجديد | 🟡 `expires_at` يُحسب وقت الإصدار؛ التنبيه والتجديد غير مبنيين |
| 11.3 إلغاء الشهادة | ✅ |
| 11.4 إصدار جماعي | ⏳ |
| 12.1 بوت Discord | ⛔ مستبعد بطلب من الإدارة (الموقع يستقبل أحداث webhook فقط) |
| 12.2 FiveM API | ⏳ الجدول `fivem_integration` موجود |
| 12.3 بريد (Resend) | ⏳ |
| 13.1 PWA | ⏳ |
| 13.2 تقويم الفعاليات | ⏳ الجدول `events` موجود |
| 13.3 إصدارات المستندات | ⏳ الجدول `document_versions` موجود |
| 13.4 مرشحات متقدمة | 🟡 تصفية أساسية في النتائج/الشهادات |
| 13.5 الوضع الفاتح | ⏳ |

إضافة إلى ذلك نُفَّذت ميزات إدارية غير مذكورة صراحةً في المواصفة: الحضور اليومي،
الترقيات والرتب، متجر النقاط، وwebhook Discord.

---

## 11.1) الأداء والتخزين المؤقت

الصفحات العامة لا تُصيَّر عند كل زيارة:

| الطبقة | التفصيل |
| --- | --- |
| ISR | `export const revalidate = 300` على الرئيسية وصفحات القطاعات كافة؛ `/verify/[id]` = 60 ثانية |
| بناء مسبق | `generateStaticParams` في `app/(public)/sectors/[slug]/layout.tsx` يبني القطاعات الخمسة وقت النشر |
| قراءة بلا كوكيز | `lib/supabase/public.ts` بدل عميل الكوكيز — الكوكيز كانت تُجبر كل صفحة على التصيير لكل طلب |
| إبطال فوري | كل Server Action إداري يستدعي `revalidatePublic()` (`lib/revalidate.ts`) فتظهر التعديلات مباشرة |
| عميل خفيف | الموج يُرسم بـ 30 إطارًا/ثانية مع لون مخزَّن، ويتوقف عند إخفاء التبويب أو `prefers-reduced-motion` |
| خطوط | Tajawal بثلاثة أوزان (400/700/800) بدل ستة |
| شاشة البداية | الصفحة الرئيسية فقط، 900ms بدل 2.6s |

قياس محلي بعد التحسين: `4–8ms` للصفحة المخزَّنة بدل `1.2–6.0s` قبلها.

الصفحات الديناميكية الملزمة: `/admin/*` (جلسة)، `/certificates` (يعتمد `searchParams`)،
`/test/[testId]` (بدء محاولة).

---

## 12) فجوات معروفة (تحتاج إدخالًا بشريًا)

1. **بنوك الأسئلة فارغة في كل القطاعات** — لا توجد أسئلة في المصادر الرسمية، ولم
   تُخترع أسئلة. تُضاف من `/admin/tests/[id]`؛ قبل ذلك يرفض `/api/test/start`
   المحاولات (503).
2. **PS**: ثلاثة عروض رجعت `401` من المصدر، فلم تُنزّل.
3. **MG**: نصوص عروض Google Slides صور داخل PDF — لا يمكن استخراجها نصيًا.
   السلايدات في القاعدة/المحتوى تشير إلى ملفات PDF فقط.
4. **FS / SB**: لا محتوى خارجي متاح؛ صفحاتهما تعمل بحالة فارغة مقصودة.
5. **روابط RCA** `/rasrca/laws`, `/rasrca/*` ترجع 404؛ استُخدمت بدائلها
   `*-content.html` والصفحات الحيّة.
6. **الشهادات**: لا تُصدر شهادة تلقائيًا لاختبار التوظيف إلا عبر نفس مسار النجاح؛
   سياسة إصدار شهادات التوظيف (إن لزمت) تحتاج قرارًا إداريًا.
7. **Discord**: الموقع يستقبل الأحداث ويتحقق من التوقيع، لكن البوت نفسه (مزامنة
   الأعضاء والرتب وحضور القنوات الصوتية) خدمة خارجية لم تُبنَ هنا. يلزم إضافة
   `DISCORD_PUBLIC_KEY` في بيئة النشر، وضبط `discord_guild_id` لكل قطاع.
8. **الإشعارات**: تُحدَّث عند إعادة تحميل الصفحة (Server Components)؛ التحديث
   الفوري عبر Supabase Realtime غير مضاف.
9. **المتجر**: الشراء يتم بمعرفة قيادة القطاع (نيابة عن العضو)؛ لا توجد بوابة
   شراء مباشرة للعضو لأن حساب الأعضاء على Discord لا يُصادَق داخل المنصة.
10. **XP للشهادات السابقة**: لا توجد نقاط لأي شهادة قديمة؛ يُحسب الرصيد من لحظة
    تشغيل `add_xp` فقط.
