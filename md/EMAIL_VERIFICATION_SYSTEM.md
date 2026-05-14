# 📧 نظام Email Verification الشامل

## 🎯 نظرة عامة

نظام آمن وكامل للتحقق من البريد الإلكتروني يمنع:

- التسجيل بإيميلات وهمية
- استخدام الحساب بدون تأكيد البريد
- هجمات الـ Spam والإساءة

---

## 🏗️ البنية المعمارية

### 1️⃣ الحقول في User Model

```javascript
isVerified: Boolean (default: false)           // حالة تفعيل البريد
emailVerificationToken: String                 // التوكن المشفر
emailVerificationExpires: Date                 // انتهاء صلاحية التوكن (24h)
lastVerificationSentAt: Date                   // وقت آخر إرسال
```

### 2️⃣ طبقات الأمان

✅ **Token Hashing** - التوكن يُخزن مشفراً (SHA256)
✅ **Expiration** - انتهاء صلاحية التوكن بعد 24 ساعة
✅ **Rate Limiting** - حد أقصى 5 محاولات في 10 دقائق
✅ **Cooldown** - دقيقة واحدة بين الطلبات
✅ **Generic Messages** - عدم الكشف عن وجود الإيميل
✅ **Email Verification Middleware** - منع الوصول بدون تفعيل

---

## 🚀 API Endpoints

### 📝 1. التسجيل (Sign Up)

```
POST /api/v1.0.0/users/signup
Content-Type: application/json

{
  "name": "محمد أحمد",
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**الرد:**

```json
{
  "status": "success",
  "message": "تم إرسال رابط التفعيل إلى بريدك الإلكتروني بنجاح",
  "data": {
    "message": "تم إنشاء الحساب بنجاح. تحقق من بريدك لتفعيل الحساب."
  }
}
```

**العملية:**

1. ✅ تم إنشاء الحساب مع `isVerified: false`
2. ✅ تم توليد توكن عشوائي وتشفيره
3. ✅ تم إرسال رابط التفعيل عبر البريد الإلكتروني
4. ❌ لا يمكن تسجيل الدخول بدون تفعيل البريد

---

### ✅ 2. تفعيل البريد (Verify Email)

```
GET /api/v1.0.0/users/verifyEmail/{verificationToken}
```

**العملية:**

1. ✅ يتم التحقق من صحة التوكن
2. ✅ يتم التحقق من عدم انتهاء صلاحية التوكن
3. ✅ يتم تفعيل الحساب (`isVerified: true`)
4. ✅ يتم حذف التوكن من قاعدة البيانات
5. ✅ يتم إرسال JWT token تلقائياً

**الرد:**

```json
{
  "status": "success",
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "محمد أحمد",
      "email": "user@example.com",
      "isVerified": true
    }
  }
}
```

---

### 🔄 3. إعادة إرسال رابط التفعيل (Resend)

```
POST /api/v1.0.0/users/resendVerification
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**الحماية من الـ Spam:**

- ⏳ دقيقة واحدة cooldown بين الطلبات
- 🚫 حد أقصى 5 محاولات في 10 دقائق
- 🔐 رسالة عامة حتى لو كان الإيميل غير موجود

**الرد:**

```json
{
  "status": "success",
  "message": "تم إعادة إرسال رابط التفعيل بنجاح. تحقق من بريدك الإلكتروني"
}
```

---

### 🔐 4. تسجيل الدخول (Login)

```
POST /api/v1.0.0/users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**التحقق:**

1. ✅ التحقق من البريد والكلمة المرور
2. ✅ **التحقق من تفعيل البريد** ← جديد
3. ✅ إرسال JWT token

**حالة الخطأ (إذا لم يتم التفعيل):**

```json
{
  "status": "error",
  "message": "يرجى تفعيل بريدك الإلكتروني أولاً"
}
```

---

## 🔒 Middleware الجديد

### ✨ `isEmailVerified`

```javascript
// في أي endpoint يحتاج تفعيل البريد
router.get(
  "/me",
  authMiddlewers.protect,
  authMiddlewers.isEmailVerified, // ← جديد
  userController.getMe,
);
```

**الفحص:**

```javascript
if (!req.user.isVerified) {
  return next(new AppError("يرجى تفعيل بريدك الإلكتروني", 403));
}
```

---

## 📧 البريد الإلكتروني

### HTML Template

```html
<h2>أهلا محمد! 👋</h2>
<p>شكراً لتسجيلك في منصة BLUE BITS</p>
<p>الرجاء الضغط على الرابط أدناه لتفعيل حسابك:</p>
<a href="https://bluebits.com/api/v1.0.0/users/verifyEmail/token123">
  تفعيل الحساب
</a>
```

### متطلبات Environment Variables

```env
EMAIL_FROM=your-email@gmail.com
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=app-specific-password
```

---

## 🛡️ Security Best Practices ✅

| المبدأ                          | التطبيق                          |
| ------------------------------- | -------------------------------- |
| 🔐 لا تكشف وجود الإيميل         | رسالة عامة في resendVerification |
| 🔑 لا تخزن التوكن raw           | تشفير باستخدام SHA256            |
| ⏳ صلاحية محدودة                | 24 ساعة للتوكن                   |
| 🚫 حماية من الـ Spam            | Rate limiting + Cooldown         |
| 📍 لا تعطي JWT قبل التفعيل      | فحص `isVerified` في Login        |
| 🧹 حذف التوكن بعد الاستخدام     | تلقائي بعد التحقق                |
| 🔄 Middleware على جميع المسارات | إجباري للمستخدمين المفعلين       |

---

## 📊 تدفق النظام (Flow Diagram)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. المستخدم يسجل (Sign Up)                                      │
│   - يتم إنشاء الحساب مع isVerified = false                      │
│   - يتم توليد verification token وتشفيره                       │
│   - يتم إرسال رابط عبر البريد الإلكتروني                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. المستخدم يفتح الرابط (Verify Email)                         │
│   - يتم التحقق من صحة التوكن ✓                                │
│   - يتم التحقق من عدم انتهاء الصلاحية ✓                        │
│   - يتم تفعيل الحساب (isVerified = true)                      │
│   - يتم حذف التوكن من قاعدة البيانات                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. المستخدم يسجل الدخول (Login)                               │
│   - يتم فحص البريد والكلمة المرور ✓                           │
│   - يتم فحص isVerified = true ✓                              │
│   - يتم إرسال JWT token ✓                                      │
│   - يمكن استخدام النظام الآن ✓                                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. الوصول للمسارات المحمية (Protected Routes)                  │
│   - يتم فحص JWT token ✓                                        │
│   - يتم فحص isEmailVerified = true ✓                          │
│   - منح الوصول للمسار ✓                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ الملفات المعدلة

### 1. `models/userModel.js`

- ✅ إضافة `isVerified` field
- ✅ إضافة `emailVerificationToken` field
- ✅ إضافة `emailVerificationExpires` field
- ✅ إضافة `lastVerificationSentAt` field
- ✅ إضافة `createEmailVerificationToken()` method

### 2. `config/email.js`

- ✅ إضافة `sendVerification()` method
- ✅ HTML template جميل مع أيقونات

### 3. `controllers/authController.js`

- ✅ تعديل `signup()` - إرسال بريد تفعيل
- ✅ تعديل `login()` - فحص `isVerified`
- ✅ إضافة `verifyEmail()` - endpoint للتفعيل
- ✅ إضافة `resendVerification()` - إعادة الإرسال مع cooldown

### 4. `middlewares/authMiddlewers.js`

- ✅ إضافة `isEmailVerified` middleware

### 5. `routes/userRouter.js`

- ✅ إضافة `/verifyEmail/:token` route
- ✅ إضافة `/resendVerification` route مع rate limiter
- ✅ إضافة middleware على جميع routes المحمية

### 6. `app.js`

- ✅ إضافة rate limiter خاص بـ email verification

---

## 🧪 اختبار النظام

### 1. اختبر Sign Up

```bash
curl -X POST http://localhost:7000/api/v1.0.0/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "محمد",
    "email": "test@gmail.com",
    "password": "Test@1234"
  }'
```

### 2. تفقد بريدك الإلكتروني

- 📧 ستجد رسالة من BLUE BITS
- 🔗 انسخ رابط التفعيل

### 3. اختبر Verify Email

```bash
curl -X GET http://localhost:7000/api/v1.0.0/users/verifyEmail/{token}
```

### 4. اختبر Login

```bash
curl -X POST http://localhost:7000/api/v1.0.0/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@gmail.com",
    "password": "Test@1234"
  }'
```

---

## 🐛 استكشاف الأخطاء

| المشكلة               | الحل                                                 |
| --------------------- | ---------------------------------------------------- |
| لم أتلقَ بريد         | تحقق من `EMAIL_USERNAME` و `EMAIL_PASSWORD`          |
| توكن منتهي            | 24 ساعة فقط صلاحية التوكن، استخدم resendVerification |
| "Rate Limit Exceeded" | انتظر 10 دقائق أو استخدم إيميل آخر                   |
| "Email not verified"  | افتح الرابط في بريدك أولاً                           |

---

## 📈 الإحصائيات والمراقبة

```javascript
// يمكنك إضافة logging:
console.log(`📧 Email verification sent to: ${user.email}`);
console.log(`✅ Email verified for: ${user.email}`);
console.log(`⏳ Resend attempt for: ${user.email}`);
```

---

## 🎯 الخطوات القادمة (Future Enhancements)

- [ ] إضافة SMS verification (رقم الهاتف)
- [ ] Two-Factor Authentication (2FA)
- [ ] Social Login (Google, GitHub)
- [ ] Email templates بلغات أخرى
- [ ] Dashboard لمراقبة الإرسالات

---

## 📞 الدعم والمساعدة

للمزيد من التفاصيل تفضل بمراجعة:

- 📖 AGENTS.md - ارشادات المشروع
- 📚 Package.json - المكتبات المستخدمة
- 🔧 .env - متغيرات البيئة

---

**✨ تم إنشاء النظام بنجاح! Happy Coding! 🚀**
