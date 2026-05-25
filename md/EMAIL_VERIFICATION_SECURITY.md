# 🛡️ الأمان والعمليات المتقدمة

## 🔐 نموذج الأمان (Security Model)

### 1️⃣ طبقات الحماية

```
┌──────────────────────────────────────────────┐
│  Layer 1: Input Validation                   │
│  - Email Format Check                        │
│  - Password Strength                         │
│  - XSS Prevention (already in app.js)       │
└──────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────┐
│  Layer 2: Token Generation & Hashing         │
│  - 32 bytes random token                     │
│  - SHA256 hashing                            │
│  - Stored as hash (never plaintext)         │
└──────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────┐
│  Layer 3: Time Expiration                    │
│  - 24 hour token validity                    │
│  - Compare with Date.now()                   │
│  - Automatic cleanup possible                │
└──────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────┐
│  Layer 4: Rate Limiting                      │
│  - 5 requests per 10 minutes                 │
│  - Per email address                         │
│  - Prevents brute force attacks             │
└──────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────┐
│  Layer 5: Application Level                  │
│  - Check isVerified flag                     │
│  - Middleware enforcement                    │
│  - Audit logging possible                    │
└──────────────────────────────────────────────┘
```

---

## 🎯 معالجة الحالات الخاصة (Edge Cases)

### الحالة 1: المستخدم يحاول التسجيل مرتين بنفس الإيميل

```javascript
// الحالة الحالية: MongoDB unique constraint
// الخطأ: "E11000 duplicate key error"

// الحل المقترح: إضافة معالجة في errorController
exports.handleDuplicateFieldDB = (err) => {
  const message = `Duplicate field value: ${Object.keys(err.keyValue)}`;
  return new AppError(message, 400);
};
```

**الرد الذي سيتم إرساله:**
```json
{
  "status": "error",
  "message": "هذا الإيميل موجود بالفعل. حاول إعادة تسجيل الدخول أو استخدم إيميل آخر"
}
```

---

### الحالة 2: البريد الإلكتروني يفشل أثناء التسجيل

**الكود الحالي:**
```javascript
try {
  await new Email(newUser, verificationURL).sendVerification();
  // ✅ نجح - إرسال الرد
} catch (error) {
  // ❌ فشل - حذف الحساب
  await User.deleteOne({ _id: newUser._id });
  return next(new AppError('حدث خطأ في البريد الإلكتروني', 500));
}
```

**لماذا؟**
- ✅ لا نترك حساب بدون بريد تفعيل
- ✅ يمكن للمستخدم محاولة التسجيل مرة أخرى
- ✅ لا توجد حسابات يتيمة في النظام

---

### الحالة 3: المستخدم يحاول تفعيل حساب مفعل بالفعل

```javascript
// الحالة الحالية:
// 1. توكن غير موجود → "الرابط غير صالح"
// 2. حساب مفعل بالفعل → يعمل بدون مشاكل (آمن)

// السبب:
// بعد التفعيل، يتم حذف التوكن مباشرة
user.emailVerificationToken = undefined;
user.emailVerificationExpires = undefined;
```

---

### الحالة 4: المستخدم يضغط على الرابط مرتين

```javascript
// الرابط الأول: ✅ يعمل، يتم التفعيل
// الرابط الثاني: ❌ "الرابط غير صالح" (التوكن محذوف)

// آمن تماماً ✓
```

---

### الحالة 5: عدم استقرار الشبكة أثناء التفعيل

```javascript
// السيناريو: المستخدم يضغط الرابط
// - الخادم يعالج الطلب ✓
// - يقوم بالتفعيل ✓
// - يحاول إرسال الرد...
// - الشبكة تنقطع ✗

// المشكلة: المستخدم يعتقد أن التفعيل فشل
// الحل: المستخدم مفعل بالفعل في قاعدة البيانات
// - يمكنه محاولة Login
// - يمكنه إعادة الضغط على الرابط (آمن)
```

---

## 🐛 استكشاف الأخطاء الشائعة

### المشكلة 1: البريد الإلكتروني لا يصل

**الأسباب المحتملة:**
```javascript
❌ EMAIL_FROM لم يتم تعيينها
❌ EMAIL_USERNAME خاطئ
❌ EMAIL_PASSWORD خاطئ (أو password عادي بدلاً من app password)
❌ Gmail 2FA مفعل ولم تُنشئ app password
❌ الإيميل معطل في محفظة الجيميل
```

**الحل:**
```bash
# 1. التحقق من .env
grep EMAIL_ .env

# 2. اختبر البريد مباشرة
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});
transporter.verify((err, success) => {
  console.log(err || 'Email ready:', success);
});
"

# 3. شغّل السيرفر بـ DEBUG
DEBUG=* npm start
```

---

### المشكلة 2: "429 Too Many Requests"

**الأسباب:**
```javascript
❌ طلبت أكثر من 5 مرات في 10 دقائق
❌ الـ Rate Limiter فعال
```

**الحل:**
```javascript
// مؤقتاً (للاختبار فقط):
// قلل قيمة max في Rate Limiter
const resendVerificationLimiter = rateLimit({
  max: 100, // ← زيّد الحد
  windowMs: 10 * 60 * 1000,
});

// دائماً: انتظر 10 دقائق أو استخدم إيميل مختلف
```

---

### المشكلة 3: "الرابط غير صالح أو منتهي"

**الأسباب:**
```javascript
❌ انتظرت أكثر من 24 ساعة
❌ التوكن خاطئ
❌ نسخت الرابط بشكل خاطئ
❌ استخدمت إيميل مختلف
```

**الحل:**
```javascript
// استخدم resendVerification
POST /api/v1.0.0/users/resendVerification
{
  "email": "your-email@example.com"
}
```

---

### المشكلة 4: "يرجى تفعيل بريدك الإلكتروني"

**الأسباب:**
```javascript
❌ لم تضغط على رابط التفعيل بعد
❌ الرابط منتهي الصلاحية
❌ حساب قديم من قبل تحديث النظام
```

**الحل:**
```javascript
// استخدم resendVerification للحصول على رابط جديد
```

---

## 🔄 الصيانة والنظافة

### التنظيف التلقائي (Cron Job)

```javascript
// models/userModel.js - أضف هذا
const schedule = require('node-schedule');

// تنظيف البيانات كل ساعة
schedule.scheduleJob('0 * * * *', async () => {
  await User.deleteMany({
    isVerified: false,
    createdAt: { $lt: new Date(Date.now() - 48 * 60 * 60 * 1000) } // 48 ساعة
  });
  console.log('✅ Cleaned up unverified accounts');
});
```

**قم بتثبيت:**
```bash
npm install node-schedule
```

---

## 📊 المراقبة والإحصائيات

### مثال: Dashboard للإحصائيات

```javascript
// controllers/statsController.js
exports.getEmailStats = catchAsync(async (req, res, next) => {
  const stats = {
    totalUsers: await User.countDocuments(),
    verifiedUsers: await User.countDocuments({ isVerified: true }),
    unverifiedUsers: await User.countDocuments({ isVerified: false }),
    verificationRate: (
      (await User.countDocuments({ isVerified: true })) / 
      (await User.countDocuments())
    ).toFixed(2),
    recentSignups: await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email isVerified createdAt'),
  };
  
  return successResponse(res, 200, 'success', stats);
});
```

---

## 🔒 التعامل مع البيانات الحساسة

### عدم الكشف عن معلومات

```javascript
// ❌ خطير:
"Email not found" ← يكشف أن الإيميل لا يوجد

// ✅ آمن:
"If the email exists, a verification link will be sent"
↓ يكون نفس الرد حتى لو كان الإيميل غير موجود
```

---

## 🧪 اختبار الأمان

### OWASP Top 10 Compliance

| الهجمة | المكان | الحماية |
|------|-------|--------|
| SQL Injection | - | MongoDB (لا توجد SQL) ✅ |
| XSS | app.js | xss-clean middleware ✅ |
| CSRF | routes | SameSite cookies ✅ |
| Broken Auth | controllers | JWT + token expiry ✅ |
| Sensitive Data | config/email.js | Hashed tokens ✅ |
| XML XXE | - | لا نستخدم XML ✅ |
| Broken Access | middlewares | isEmailVerified ✅ |
| Crypto | utils | SHA256 hashing ✅ |
| Logging | controllers | معالج أخطاء ✅ |
| SSRF | - | لا نستخدم URLs خارجية ✅ |

---

## 🚨 قائمة أمان نهائية

- [ ] لا تخزن التوكن raw
- [ ] التوكن له صلاحية محدودة
- [ ] جميع الأخطاء معالجة
- [ ] المسارات المحمية بـ middleware
- [ ] لا كشف لمعلومات المستخدم
- [ ] Rate limiting مفعل
- [ ] HTTPS في الإنتاج
- [ ] ENV variables آمنة
- [ ] Logging للأحداث المشبوهة
- [ ] Audit trail للعمليات الهامة

---

**🎯 نظام آمن وموثوق! ✅**
