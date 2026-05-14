# 🧪 دليل الاختبار والتطبيق (Implementation Guide)

## 📋 الخطوات العملية

### الخطوة 1️⃣: تثبيت المتطلبات
تأكد من وجود المكتبات المطلوبة في `package.json`:
```json
{
  "dependencies": {
    "express-rate-limit": "^7.5.1",
    "nodemailer": "^6.9.6",
    "crypto": "^1.0.1",
    "mongoose": "^7.8.8"
  }
}
```

إذا كانت غير موجودة:
```bash
npm install express-rate-limit nodemailer
```

---

### الخطوة 2️⃣: إعداد متغيرات البيئة (.env)

```env
# Server Config
NODE_ENV=development
PORT=7000
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN=7

# Database
MONGODB_URI=mongodb://localhost:27017/bluebits
DATABASE_PASSWORD=your-db-password

# Email Config (Gmail)
EMAIL_FROM=BLUE BITS <your-email@gmail.com>
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# Or using other providers like MailerSend
MAILERSEND_API_KEY=your-api-key
```

#### ⚠️ ملاحظة مهمة: Gmail App Passwords
1. اذهب إلى: https://myaccount.google.com/apppasswords
2. اختر: Mail > Windows Computer
3. انسخ Password المُنشأ (16 حرف بدون مسافات)
4. استخدمه في `EMAIL_PASSWORD`

---

### الخطوة 3️⃣: تجميع النظام (Quick Checklist)

- [x] `models/userModel.js` - تعديل الـ schema
- [x] `config/email.js` - إضافة sendVerification()
- [x] `controllers/authController.js` - تعديل signup/login + إضافة verifyEmail/resendVerification
- [x] `middlewares/authMiddlewers.js` - إضافة isEmailVerified
- [x] `routes/userRouter.js` - إضافة الـ routes الجديدة
- [x] `app.js` - إضافة rate limiting

---

## 🔍 سيناريوهات الاختبار

### ✅ السيناريو 1: Sign Up الناجح

#### Request:
```
POST /api/v1.0.0/users/signup
Content-Type: application/json

{
  "name": "أحمد محمد",
  "email": "ahmad@example.com",
  "password": "SecurePass123!"
}
```

#### Expected Response (200):
```json
{
  "status": "success",
  "message": "تم إرسال رابط التفعيل إلى بريدك الإلكتروني بنجاح",
  "data": {
    "message": "تم إنشاء الحساب بنجاح. تحقق من بريدك لتفعيل الحساب."
  }
}
```

#### التحقق من قاعدة البيانات:
```javascript
db.users.findOne({ email: "ahmad@example.com" })
// يجب أن ترى:
// isVerified: false
// emailVerificationToken: "hashed-token-here"
// emailVerificationExpires: Date (24 hours from now)
```

---

### ✅ السيناريو 2: محاولة Login بدون تفعيل

#### Request:
```
POST /api/v1.0.0/users/login
Content-Type: application/json

{
  "email": "ahmad@example.com",
  "password": "SecurePass123!"
}
```

#### Expected Response (403):
```json
{
  "status": "error",
  "message": "يرجى تفعيل بريدك الإلكتروني أولاً"
}
```

---

### ✅ السيناريو 3: تفعيل البريد (Verify Email)

#### خطوات:
1. 📧 افتح البريد الإلكتروني
2. 🔗 انسخ رابط التفعيل (مثل: `/verifyEmail/abc123def456`)

#### Request:
```
GET /api/v1.0.0/users/verifyEmail/abc123def456
```

#### Expected Response (200):
```json
{
  "status": "success",
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "أحمد محمد",
      "email": "ahmad@example.com",
      "isVerified": true,
      "role": "USER"
    }
  }
}
```

#### التحقق من قاعدة البيانات:
```javascript
db.users.findOne({ email: "ahmad@example.com" })
// يجب أن ترى:
// isVerified: true ✅
// emailVerificationToken: undefined (تم حذفه)
// emailVerificationExpires: undefined
```

---

### ✅ السيناريو 4: Login الناجح بعد التفعيل

#### Request:
```
POST /api/v1.0.0/users/login
Content-Type: application/json

{
  "email": "ahmad@example.com",
  "password": "SecurePass123!"
}
```

#### Expected Response (200):
```json
{
  "status": "success",
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "أحمد محمد",
      "email": "ahmad@example.com",
      "isVerified": true
    }
  }
}
```

---

### ✅ السيناريو 5: Resend Verification Email

#### حالة الاستخدام:
- لم أتلق البريد
- انتهت صلاحية الرابط
- أريد إرسالية جديدة

#### Request:
```
POST /api/v1.0.0/users/resendVerification
Content-Type: application/json

{
  "email": "ahmad@example.com"
}
```

#### Expected Response (200):
```json
{
  "status": "success",
  "message": "تم إعادة إرسال رابط التفعيل بنجاح. تحقق من بريدك الإلكتروني"
}
```

#### Note:
- ✅ نفس الرسالة حتى لو كان الإيميل غير موجود (security)
- ⏳ يجب أن تنتظر 60 ثانية قبل المحاولة مرة أخرى
- 🚫 حد أقصى 5 محاولات في 10 دقائق

---

### ❌ السيناريو 6: Rate Limiting (Spam Protection)

#### محاولة إرسال أكثر من 5 مرات في 10 دقائق:

```
Request 1: ✅ 200 OK
Request 2: ✅ 200 OK
Request 3: ✅ 200 OK
Request 4: ✅ 200 OK
Request 5: ✅ 200 OK
Request 6: ❌ 429 Too Many Requests
```

#### Expected Response (429):
```json
{
  "status": "error",
  "message": "تم تجاوز حد الطلبات. حاول مرة أخرى لاحقاً!"
}
```

---

### ❌ السيناريو 7: Cooldown (60 seconds)

#### نفس الإيميل في غضون 60 ثانية:

```
Request 1: POST /resendVerification
✅ 200 OK - "تم إعادة الإرسال"

[بعد 30 ثانية...]

Request 2: POST /resendVerification
❌ 429 Too Many Requests - "انتظر دقيقة واحدة قبل إعادة الإرسال"
```

---

### ❌ السيناريو 8: توكن منتهي الصلاحية

#### بعد 24 ساعة من إرسال التوكن:

```
GET /api/v1.0.0/users/verifyEmail/abc123def456
```

#### Expected Response (400):
```json
{
  "status": "error",
  "message": "الرابط غير صالح أو منتهي"
}
```

---

### ❌ السيناريو 9: توكن خاطئ

#### استخدام توكن غير موجود:

```
GET /api/v1.0.0/users/verifyEmail/wrongtoken123
```

#### Expected Response (400):
```json
{
  "status": "error",
  "message": "الرابط غير صالح أو منتهي"
}
```

---

### ✅ السيناريو 10: الوصول إلى مسار محمي

#### لديك JWT token وتم تفعيل البريد:

```
GET /api/v1.0.0/users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Expected Response (200):
```json
{
  "status": "success",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "أحمد محمد",
    "email": "ahmad@example.com",
    "isVerified": true
  }
}
```

---

### ❌ السيناريو 11: محاولة الوصول بدون تفعيل البريد

#### لديك JWT صحيح لكن لم تفعل البريد:

```
GET /api/v1.0.0/users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Expected Response (403):
```json
{
  "status": "error",
  "message": "يرجى تفعيل بريدك الإلكتروني أولاً قبل استخدام النظام"
}
```

---

## 📊 جداول اختبار شاملة

### جدول حالات النجاح
| الحالة | الـ Endpoint | Status | التفاصيل |
|-------|----------|--------|----------|
| Sign Up | POST /signup | 200 | بريد أرسل ✅ |
| Verify Email | GET /verifyEmail/:token | 200 | تم التفعيل ✅ |
| Resend | POST /resendVerification | 200 | أرسل مرة أخرى ✅ |
| Login | POST /login | 200 | تسجيل دخول ✅ |
| Protected | GET /me | 200 | وصول متاح ✅ |

### جدول حالات الأخطاء
| الحالة | الـ Endpoint | Status | الرسالة |
|-------|----------|--------|---------|
| No Email | POST /signup | 400 | Please provide email |
| Weak Password | POST /signup | 400 | minlength 8 |
| Invalid Token | GET /verifyEmail/:token | 400 | الرابط غير صالح |
| Expired Token | GET /verifyEmail/:token | 400 | الرابط منتهي |
| Not Verified | POST /login | 403 | يرجى تفعيل البريد |
| Already Verified | POST /resendVerification | 400 | الحساب مفعل بالفعل |
| Rate Limited | POST /resendVerification | 429 | تجاوز حد الطلبات |
| Cooldown | POST /resendVerification | 429 | انتظر دقيقة |
| No JWT | GET /me | 401 | You are not logged in |
| Not Verified | GET /me | 403 | يرجى تفعيل البريد |

---

## 🔧 أوامر مفيدة

### اختبر من Terminal
```bash
# Sign Up
curl -X POST http://localhost:7000/api/v1.0.0/users/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Ahmed","email":"test@gmail.com","password":"Test@1234"}'

# Resend
curl -X POST http://localhost:7000/api/v1.0.0/users/resendVerification \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com"}'

# Login
curl -X POST http://localhost:7000/api/v1.0.0/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com","password":"Test@1234"}'
```

### اختبر من MongoDB
```javascript
// شاهد جميع المستخدمين
db.users.find({}).pretty()

// شاهد حالة التفعيل
db.users.find({ isVerified: false }).pretty()

// احسب عدد المستخدمين المفعلين
db.users.countDocuments({ isVerified: true })
```

---

## 📱 استخدام Postman

### 1. إنشاء Collection
```
1. Open Postman
2. Create New Collection → "BLUE BITS Email Verification"
```

### 2. إنشاء Environment Variables
```json
{
  "base_url": "http://localhost:7000/api/v1.0.0/users",
  "token": "",
  "email": "test@example.com",
  "password": "Test@1234"
}
```

### 3. Folder Structure
```
📁 BLUE BITS Email Verification
  ├─ 📁 Authentication
  │  ├─ POST Sign Up
  │  ├─ GET Verify Email
  │  ├─ POST Resend Verification
  │  └─ POST Login
  ├─ 📁 Protected Routes
  │  ├─ GET Get Me
  │  ├─ PATCH Update Me
  │  └─ DELETE Delete Me
  └─ 📁 Admin Routes
     └─ GET All Users
```

### 4. Pre-request Script (for Login test)
```javascript
// Set token after login
if (pm.response.code === 200) {
  var jsonData = pm.response.json();
  pm.environment.set("token", jsonData.data.token);
}
```

---

## 📊 قائمة التحقق النهائية

- [ ] جميع المتغيرات البيئية موضوعة
- [ ] البريد الإلكتروني يعمل
- [ ] Sign Up ينجح ويرسل بريد
- [ ] توكن محفوظ مشفراً في قاعدة البيانات
- [ ] Verify Email ينجح
- [ ] Login ينجح بعد التفعيل
- [ ] Rate limiting يعمل
- [ ] Cooldown يعمل
- [ ] Protected routes محمية
- [ ] Middleware `isEmailVerified` يعمل على جميع الـ routes

---

## 🚀 الخطوات التالية

1. **الاختبار الشامل** - استخدم جداول الاختبار أعلاه
2. **المراقبة والتسجيل** - أضف logging للتصحيح
3. **الأداء** - اختبر مع عدد كبير من المستخدمين
4. **الأمان** - مراجعة OWASP Top 10
5. **التوثيق** - أضف إلى Swagger

---

**Happy Testing! 🎉**
