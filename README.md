# اپ مربی/شاگرد (نمونه بدون بک‌اند)

این یک نمونه‌ی ساده از اپ دو-پنلی (پنل مربی و پنل شاگرد) است که فقط با HTML/CSS/JS سمت کلاینت پیاده‌سازی شده و داده‌ها در `localStorage` ذخیره می‌شوند. برای نمایش جریان کلی محصول مناسب است و می‌تواند بعداً به بک‌اند واقعی متصل شود.

## امکانات

- پنل مربی:
  - ساخت برنامه (Program) با عنوان و توضیحات
  - ساخت گروه (Group)
  - افزودن شاگرد به گروه
  - انتساب برنامه به یک گروه یا یک شاگرد
  - مشاهده لیست برنامه‌ها، گروه‌ها و شاگردها

- پنل شاگرد:
  - ورود با ایمیل
  - مشاهده برنامه‌های اختصاصی و برنامه‌های گروهی منتسب به گروه خودش
  - آپلود تصویر رسید پرداخت ماهانه (نمونه ذخیره‌سازی سمت کلاینت)
  - تب هدف‌ها: تعریف هدف و پیش‌هدف، تیک انجام
  - دفترچه تمرین: ثبت روزانه حال عمومی (نمره یا ایموجی)، کیفیت/مدت خواب، تغذیه، RPE، مسافت/زمان/HR/پیس، محل دویدن، کفش، همراهان و یادداشت + اتصال به تمرین/برنامه

## اجرا

فایل‌ها کاملاً استاتیک هستند. کافی‌ست `index.html` را با مرورگر باز کنید:

- `index.html` صفحه ورود/انتخاب پنل
- `coach.html` پنل مربی
- `student.html` پنل شاگرد

## اجرای روی موبایل

سه روش ساده دارید:

1) اجرای محلی روی شبکه داخلی (LAN)
- روی لپ‌تاپ/کامپیوتر، از ریشه پروژه یک سرور ساده اجرا کنید و موبایل را روی همان وای‌فای وصل کنید:
  - با پایتون: `python3 -m http.server 8080`
  - یا با Node: `npx http-server -p 8080`
- آدرس IP دستگاه‌تان را پیدا کنید (مثلاً 192.168.1.10) و در موبایل باز کنید: `http://192.168.1.10:8080/index.html`
- نکته‌ها:
  - iOS/Android هر دو از ورودی دوربین پشتیبانی می‌کنند؛ ورودی «تصویر رسید» در موبایل، دوربین را باز می‌کند.
  - اگر صفحه باز نشد، فایروال سیستم یا “Local Network” permission (iOS 14+) را بررسی کنید.

2) میزبانی آنلاین (HTTPS)
- ساده‌ترین راه‌ها: GitHub Pages، Netlify، Vercel یا Surge. چون پروژه استاتیک است، فقط پوشه همین پروژه را دیپلوی کنید و آدرس را در موبایل باز کنید.
- مثال GitHub Pages: ریپو را روی GitHub بگذارید، از Settings > Pages شاخه `main` و مسیر ریشه را انتخاب کنید.

3) بسته‌بندی به اپ موبایل (Capacitor)
- اگر آیکن روی موبایل و تجربه فول‌اسکرین می‌خواهید، می‌توانید اپ را با Capacitor به iOS/Android تبدیل کنید:
  - `npm i -D @capacitor/cli && npm i @capacitor/core`
  - `npx cap init coach-student-app com.example.coachstudent`
  - در `capacitor.config.*` مقدار `webDir` را روی ریشه پروژه (`"."`) یا پوشه خروجی استاتیک تنظیم کنید.
  - `npx cap add ios` و/یا `npx cap add android`
  - `npx cap open ios` یا `npx cap open android` و سپس بیلد/ران از داخل Xcode/Android Studio
- ورودی فایل با `accept="image/*"` در موبایل کار می‌کند؛ برای دسترسی مستقیم به Camera می‌توانید بعدها پلاگین Camera اضافه کنید.

گزینه تکمیلی (PWA): در صورت نیاز، می‌توانیم Manifest + Service Worker اضافه کنیم تا «Add to Home Screen» و اجرای آفلاین فراهم شود. اگر می‌خواهید، اعلام کنید تا پیاده‌سازی کنم.

## ساختار داده (localStorage)

کلید: `coach_student_app_db_v1`

ساختار:

```
{
  programs: [ { id, title, description, createdAt } ],
  groups:   [ { id, name, studentIds: [] } ],
  students: [ { id, name, email } ],
  assignments: [ { id, programId, targetType: 'group'|'student', targetId, createdAt } ],
  payments: [ { id, studentId, imageDataUrl, note, month, createdAt } ],
  goals: [ { id, studentId, title, milestones: [ { id, text, done } ], createdAt } ]
  logs: [ { id, studentId, date, assignmentId, programId, dayKey, mood, moodEmoji, sleepQuality, sleepHours, nutrition, rpe, distanceKm, durationSec, hrAvg, location, shoe, companions, note, createdAt, updatedAt } ]
}
```

## نکات توسعه

- این نسخه بک‌اند ندارد. برای اتصال به بک‌اند، کافی است عملیات CRUD در `js/db.js` را به فراخوانی API‌ها تغییر دهید.
- می‌توانید قابلیت حذف/ویرایش و وضعیت انجام برنامه‌ها (Progress) را اضافه کنید.
-
توجه: تصاویر پرداخت در این نسخه به صورت Base64 در localStorage ذخیره می‌شوند و برای نمونه آزمایشی مناسب است. برای نسخه‌ی واقعی حتماً باید آپلود فایل سمت سرور انجام شود.
