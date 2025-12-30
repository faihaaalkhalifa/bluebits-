const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv').config();
const AppError = require('./utils/appError');
const errorGlobal = require('./controllers/errorController');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./Swagger/swagger');

const app = express();

app.timeout = 30000; // 30 ثانية

// 1) MIDDLEWARES العامة

// خدمة الملفات الثابتة
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// تمكين CORS
app.use(cors());
app.options('*', cors());

// أمان HTTP headers
app.use(helmet());

// تسجيل الطلبات في وضع التطوير
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// تحديد معدل الطلبات
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// تحليل الجسم من الطلبات
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// إعدادات القوالب (إذا كنت تستخدمها)
app.set('view engine', 'ejs');
app.use(express.static('public'));

// الحماية من هجمات NoSQL injection
app.use(mongoSanitize());

// الحماية من هجمات XSS
app.use(xss());

// منع تلوث المعاملات
app.use(
  hpp({
    whitelist: ['duration', 'difficulty', 'price'],
  }),
);

// ضغط البيانات
app.use(compression());
app.use((req, res, next) => {
    console.log('📨 الطلب الوارد:', {
        method: req.method,
        url: req.url,
        params: req.params,
        query: req.query,
        body: req.body
    });
    next();
});
// 2) ROUTES

userRouter = require('./routes/userRouter');

app.use('/api/v1.0.0/users', userRouter);

// Swagger documentation route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Event Manager API Documentation'
}));
// معالجة الروابط غير الموجودة
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// معالجة الأخطاء العامة
app.use(errorGlobal);

// 3) الاتصال بقاعدة البيانات وتشغيل الخادم
const PORT = process.env.PORT || 7000;
const MONGODB_URI = process.env.MONGO_URL;

// التحقق من وجود رابط قاعدة البيانات
if (!MONGODB_URI) {
  console.error('MONGO_URL is not defined in environment variables');
  process.exit(1);
}

// الاتصال بقاعدة البيانات
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully');

    // تشغيل الخادم بعد الاتصال الناجح بقاعدة البيانات
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}
Example app listening at http://localhost:${PORT}
Example app listening at http://localhost:${PORT}/docs`,
      );
    });

    // إعدادات إضافية للخادم
    server.keepAliveTimeout = 120000; // 120 ثانية
    server.headersTimeout = 120000; // 120 ثانية
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// 5) معالجة الأخطاء غير الملتقطة
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;
