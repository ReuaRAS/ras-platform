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
| الواجهة | Next.js 15.5 (App Router) + React 19 + TypeScript |
| التنسيق | Tailwind CSS v4 (بدون ملف config) + متغيّرات CSS لكل قطاع |
| قاعدة البيانات | Supabase (PostgreSQL + Auth + Storage + RLS) |
| الشهادات | `pdf-lib` + `arabic-persian-reshaper` + `bidi-js` (تشكيل عربي) + `qrcode` |
| التحقق من النماذج | Cloudflare Turnstile (اختياري في التطوير) |
| النشر | Netlify (`@netlify/plugin-nextjs`) |

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
| `/sectors/[slug]/certificates` | شهادات القطاع |
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

---

## 10) النشر

### Netlify

المشروع مربوط حاليًا بمستودع GitHub (`ReuaRAS/ras-platform`) على Netlify، فأي
`git push` على فرع `master` يُطلق بناءً جديدًا ونشرًا تلقائيًا على
`https://ras-sectors.netlify.app`. من جهازك: `git push origin master`.

لإعادة الربط من الصفر:

1. ارفع المستودع إلى GitHub.
2. Netlify → **Add new site → Import an existing project** → اختر المستودع.
3. إعدادات البناء تُقرأ من `netlify.toml`:
   - Build: `npm run build` — Publish: `.next` — Plugin: `@netlify/plugin-nextjs`.
4. **Project configuration → Environment variables**: أضف نفس متغيرات `.env.local`
   (مع `NEXT_PUBLIC_APP_URL` = رابط الموقع النهائي).
5. بعد النشر: أضف رابط الموقع في **Supabase → Authentication → URL Configuration**
   (Site URL + Redirect URLs) حتى تعمل الجلسات.
6. للنشر اليدوي عند الحاجة: `netlify deploy --build --prod`.

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
| 8 – 13 | 🧱 بنية فارغة في `future/` (+ جداول في السكيما) |

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
