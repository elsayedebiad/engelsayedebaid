# 🔐 معلومات تسجيل الدخول للأدمن

## 👤 حساب الأدمن العام

تم إنشاء حساب الأدمن بنجاح في قاعدة بيانات Neon PostgreSQL!

---

## 📧 بيانات الدخول:

```
البريد الإلكتروني: admin@alqaeid.com
كلمة المرور: Admin@123456
الصلاحية: ADMIN
```

---

## 🌐 رابط تسجيل الدخول:

### محلي (Local):
```
http://localhost:3000/login
```

### على Vercel:
```
https://your-app-name.vercel.app/login
```

---

## ✅ ما تم إنجازه:

1. ✅ تم الربط بقاعدة بيانات Neon PostgreSQL
2. ✅ تم تحديث Prisma Schema لاستخدام PostgreSQL
3. ✅ تم دفع Schema إلى قاعدة البيانات
4. ✅ تم إنشاء جميع الجداول المطلوبة
5. ✅ تم إنشاء حساب الأدمن العام
6. ✅ تم تشفير كلمة المرور باستخدام bcrypt

---

## 📊 الجداول المتوفرة في قاعدة البيانات:

1. **User** - المستخدمين
2. **CV** - السير الذاتية
3. **Session** - الجلسات
4. **Booking** - الحجوزات
5. **Contract** - العقود
6. **SalesPageConfig** - إعدادات صفحات المبيعات
7. **Banner** - البنرات الإعلانية
8. **Activity** - سجل النشاطات

---

## 🔧 الخطوة التالية - إعداد Vercel:

### 1. أضف متغير البيئة في Vercel:

انتقل إلى: **Project Settings > Environment Variables**

أضف:
```
Name: DATABASE_URL
Value: postgresql://neondb_owner:npg_LdQHjZ0kBR3v@ep-red-hill-adxo3mpm-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
Environment: Production, Preview, Development
```

### 2. أعد النشر (Redeploy):

- انتقل إلى: **Deployments**
- اضغط على "..." في آخر deployment
- اختر "Redeploy"

### 3. سجل الدخول:

استخدم البيانات أعلاه لتسجيل الدخول إلى التطبيق!

---

## 🛡️ أمان الحساب:

### ⚠️ مهم جداً:

بعد أول تسجيل دخول، يُنصح بتغيير كلمة المرور!

### كيفية تغيير كلمة المرور:

1. سجل دخول باستخدام البيانات أعلاه
2. انتقل إلى الإعدادات (Settings)
3. اختر "تغيير كلمة المرور"
4. أدخل كلمة مرور جديدة قوية

---

## 💾 قاعدة البيانات:

### معلومات الاتصال:

- **المزود**: Neon (Serverless PostgreSQL)
- **المنطقة**: us-east-1 (AWS)
- **SSL**: مفعّل (مطلوب)
- **Connection Pooling**: مفعّل

### المميزات:

- ✅ قاعدة بيانات سحابية
- ✅ نسخ احتياطي تلقائي
- ✅ توسع تلقائي (Auto-scaling)
- ✅ اتصال آمن بـSSL
- ✅ أداء عالي

---

## 📝 ملاحظات:

### البيانات:

- جميع البيانات محفوظة في Neon PostgreSQL
- البيانات مشتركة بين جميع instances
- يتم الاحتفاظ بالبيانات بين deployments

### الصور:

- ⚠️ الصور ليست محفوظة في PostgreSQL
- فقط المسارات (paths) محفوظة
- يُنصح باستخدام Vercel Blob Storage للصور

---

## 🆘 حل المشاكل:

### إذا واجهت مشكلة في تسجيل الدخول:

1. تأكد من أن متغير `DATABASE_URL` مضاف في Vercel
2. تحقق من أن Neon database يعمل
3. راجع logs في Vercel Dashboard
4. تأكد من أن الـdeployment الجديد تم بنجاح

### لإعادة إنشاء الحساب:

```bash
node create-admin.js
```

---

## ✅ الخلاصة:

🎉 **كل شيء جاهز!**

- ✅ قاعدة البيانات متصلة
- ✅ حساب الأدمن جاهز
- ✅ الكود محدّث ومرفوع على GitHub
- ⏳ انتظر فقط إعداد Vercel Environment Variables

---

**احفظ هذا الملف في مكان آمن! 🔐**

