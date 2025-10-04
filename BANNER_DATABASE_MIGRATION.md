# ✅ تخزين البنرات في قاعدة البيانات Neon

## التغييرات المطبقة

### 1. تعديل Prisma Schema ✅
```prisma
model Banner {
  id          Int         @id @default(autoincrement())
  salesPageId String
  imageUrl    String?     // اختياري - للتوافق مع البيانات القديمة
  imageData   String?     @db.Text // الصورة كـ Base64
  deviceType  DeviceType
  order       Int         @default(0)
  isActive    Boolean     @default(true)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}
```

### 2. تعديل API Routes ✅
- البنرات تُحفظ كـ Base64 في قاعدة البيانات
- لا حاجة للـ file system أو Vercel Blob Storage

### 3. تعديل Components ✅
- BannerCarousel.tsx يعرض الصور من `imageData`
- Dashboard يعرض الصور من `imageData`

---

## 📋 خطوات التطبيق على Vercel

### الخطوة 1: تشغيل Migration محلياً (اختياري)

إذا كنت تريد تجربة محلياً أولاً:

```bash
# تأكد من تشغيل PostgreSQL محلياً
npx prisma migrate dev --name add_banner_imageData

# أو generate فقط بدون migration
npx prisma generate
```

### الخطوة 2: تطبيق Migration على Neon (مباشر)

#### الطريقة 1: باستخدام Prisma Migrate Deploy (موصى به)

```bash
# من terminal
npx prisma migrate deploy
```

أو من Vercel Dashboard:
1. اذهب إلى: Settings → Environment Variables
2. تأكد من وجود `DATABASE_URL`
3. Vercel سيعمل auto-migration عند البناء التالي

#### الطريقة 2: SQL مباشر على Neon

إذا واجهت مشاكل، يمكنك تشغيل SQL مباشرة:

1. اذهب إلى: https://console.neon.tech
2. اختر مشروعك
3. اذهب إلى SQL Editor
4. قم بتشغيل:

```sql
-- إضافة عمود imageData إلى جدول banners
ALTER TABLE banners 
ADD COLUMN "imageData" TEXT;

-- جعل imageUrl اختياري (إذا لم يكن كذلك)
ALTER TABLE banners 
ALTER COLUMN "imageUrl" DROP NOT NULL;
```

### الخطوة 3: التحقق من Migration

بعد deployment، تحقق من أن:
1. ✅ البنرات الجديدة تظهر بشكل صحيح
2. ✅ البنرات القديمة (إذا وجدت) لا تزال تعمل
3. ✅ لا توجد أخطاء في logs

---

## 🎯 المزايا

### ✅ لا حاجة لـ Vercel Blob Storage
- توفير تكلفة
- كل شيء في مكان واحد

### ✅ البيانات دائمة
- البنرات محفوظة في Neon PostgreSQL
- لا تختفي بعد deployment

### ✅ Backup سهل
- نسخ احتياطي لقاعدة البيانات يشمل البنرات

### ✅ التوافق مع البيانات القديمة
- البنرات القديمة (imageUrl) لا تزال تعمل
- البنرات الجديدة (imageData) أفضل

---

## ⚠️ ملاحظات مهمة

### 1. حجم الصور
- **يُنصح:** صور أقل من 500 KB لكل بنر
- **الحد الأقصى:** 1 MB لكل بنر
- PostgreSQL يدعم حتى 1 GB لكل حقل Text

### 2. الأداء
- Base64 يزيد حجم الصورة بـ ~33%
- لكن للبنرات (عدد قليل) الأداء ممتاز
- الصور مُخزنة في قاعدة البيانات = سرعة عالية

### 3. البنرات القديمة
إذا كانت لديك بنرات قديمة في file system:
- ستختفي بعد deployment التالي
- ارفعها مرة أخرى من Dashboard
- ستُحفظ تلقائياً في قاعدة البيانات

---

## 🧪 الاختبار

### 1. محلياً
```bash
npm run dev
```
- اذهب إلى `/dashboard/banners`
- ارفع بنر جديد
- تحقق من ظهوره في صفحة Sales

### 2. على Vercel
بعد deployment:
- اذهب إلى أي صفحة sales (sales1, sales2, إلخ)
- تأكد من ظهور البنرات
- راقب Vercel Logs للتأكد من عدم وجود أخطاء

---

## 📊 الفرق بين الحلول

| الميزة | File System | Vercel Blob | Database (Neon) |
|--------|-------------|-------------|-----------------|
| **الثبات** | ❌ يختفي بعد deployment | ✅ دائم | ✅ دائم |
| **التكلفة** | ✅ مجاني | 💰 مدفوع بعد الحد المجاني | ✅ ضمن قاعدة البيانات |
| **الأداء** | ⚡ سريع جداً | ⚡ سريع (CDN) | ⚡ سريع |
| **Backup** | ❌ صعب | ⚠️ منفصل | ✅ ضمن backup القاعدة |
| **الإعداد** | ✅ بسيط | ⚠️ يحتاج Token | ✅ بسيط |

---

## 🚀 الخطوات التالية

### 1. Deploy إلى Vercel ✅
```bash
git push origin main
```

### 2. راقب البناء
- اذهب إلى Vercel Dashboard
- راقب Deployment Logs
- تأكد من نجاح Migration

### 3. اختبر البنرات
- ارفع بنر جديد من Dashboard
- تحقق من ظهوره في صفحات Sales
- جرب حذف وإعادة ترتيب

---

## ❓ استكشاف الأخطاء

### خطأ: "Column imageData does not exist"
**الحل:**
```bash
npx prisma migrate deploy
```

### خطأ: "File too large"
**الحل:** قلل حجم الصورة قبل الرفع (< 500 KB موصى به)

### البنرات لا تظهر
**تحقق من:**
1. هل البنر مفعّل (isActive = true)؟
2. هل البنر للصفحة الصحيحة (salesPageId)؟
3. هل البنر لنوع الجهاز الصحيح (MOBILE/DESKTOP)؟

---

## 📚 الموارد

- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Neon PostgreSQL](https://neon.tech/docs)
- [Base64 Images in Database](https://stackoverflow.com/questions/3748/storing-images-in-db-yea-or-nay)

---

تم التحديث: 4 أكتوبر 2025

