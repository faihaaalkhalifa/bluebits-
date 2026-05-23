
const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const AppError = require("./utils/appError");
const errorGlobal = require("./controllers/errorController");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./Swagger/swagger");

const app = express();

// 1) MIDDLEWARES العامة
// أمان HTTP headers (يجب أن يكون أول middleware)
app.use(helmet());

// تمكين CORS
app.use(cors());
app.options("*", cors());

// تسجيل الطلبات في وضع التطوير
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// تحديد معدل الطلبات
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api", limiter);

// تحليل الجسم من الطلبات
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// الحماية من هجمات NoSQL injection
app.use(mongoSanitize());

// الحماية من هجمات XSS
app.use(xss());

// منع تلوث المعاملات
app.use(
  hpp({
    whitelist: ["duration", "difficulty", "price"],
  }),
);

// ضغط البيانات
app.use(compression());

// تسجيل الطلبات الواردة (مفيد للتصحيح)
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    console.log("📨 الطلب الوارد:", {
      method: req.method,
      url: req.url,
      params: req.params,
      query: req.query,
      body: req.body,
      timestamp: new Date().toISOString(),
    });
  }
  next();
});

// 2) خدمة الملفات الثابتة
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "public")));

// 3) إعدادات القوالب (إذا كنت تستخدمها)
app.set("view engine", "ejs");

// 4) معالجة favicon - حل واحد فقط
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No Content (الأفضل لـ APIs)
});

// 5) ROUTES
const userRouter = require("./routes/userRouter"); 
const lectureRouter = require('./routes/lectureRoutes');
const subjectRouter = require('./routes/subjectRoutes');
app.use('/api/v1.0.0/subjects', subjectRouter);
app.use('/api/v1.0.0/lectures', lectureRouter);
app.use("/api/v1.0.0/users", userRouter);


// 6) الصفحة الرئيسية
app.get("/", (req, res) => {
  const PORT = process.env.PORT || 7000; // تعريف PORT هنا
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Server is Running</title>
        <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background-color: #f5f5f5;
            }
            .container { 
              max-width: 800px; 
              margin: 0 auto; 
              background: white; 
              padding: 30px; 
              border-radius: 10px; 
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .success { 
              color: #28a745; 
              font-size: 28px; 
              margin-bottom: 20px;
            }
            .info { 
              color: #666; 
              margin: 15px 0;
            }
            .endpoints { 
              margin-top: 30px; 
              text-align: left; 
              display: inline-block;
            }
            .endpoint-list { 
              list-style: none; 
              padding: 0;
            }
            .endpoint-list li { 
              margin: 10px 0; 
              padding: 10px; 
              background: #f8f9fa; 
              border-radius: 5px;
            }
            a { 
              color: #007bff; 
              text-decoration: none; 
              font-weight: bold;
            }
            a:hover { 
              text-decoration: underline;
            }
            .badge {
              display: inline-block;
              padding: 5px 10px;
              border-radius: 20px;
              background: #17a2b8;
              color: white;
              font-size: 12px;
              margin-left: 10px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1 class="success">✅ Server is Running!</h1>
            
            <div class="info">
                <p><strong>Port:</strong> ${PORT}</p>
                <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
                <p><strong>API Version:</strong> 1.0.0</p>
            </div>
            
            <div class="endpoints">
                <h3> Available Endpoints:</h3>
                <ul class="endpoint-list">
                    <li>
                        <a href="/api-docs" target="_blank">API Documentation (Swagger)</a>
                        <span class="badge">Docs</span>
                    </li>
                </ul>
            </div>
            
            <script>
                // اختبار الاتصال التلقائي
                async function testConnection() {
                    try {
                        const response = await fetch('/api/v1.0.0/users');
                        const data = await response.json();
                        console.log('✅ API Test Successful:', data);
                        
                        // إضافة حالة الاتصال في الصفحة
                        const statusDiv = document.createElement('div');
                        statusDiv.innerHTML = '<p style="color: green; margin-top: 20px;">✓ API Connection Successful</p>';
                        document.querySelector('.container').appendChild(statusDiv);
                    } catch (err) {
                        console.error('❌ API Error:', err);
                    }
                }
                
                // تأخير التشغيل قليلاً لتحميل الصفحة أولاً
                setTimeout(testConnection, 1000);
            </script>
        </div>
    </body>
    </html>
  `);
});

// 7) Redirect للـ Swagger Docs
app.get('/docs', (req, res) => res.redirect('/api-docs'));
app.get('/docs/', (req, res) => res.redirect('/api-docs'));

// 8) Swagger documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Task Manager API Documentation",
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none'
    }
  }),
);

// 9) معالجة الروابط غير الموجودة
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 10) معالجة الأخطاء العامة
app.use(errorGlobal);

// 11) الاتصال بقاعدة البيانات وتشغيل الخادم
const PORT = process.env.PORT || 7000;
const MONGODB_URI = process.env.MONGO_URL;

// التحقق من وجود رابط قاعدة البيانات
if (!MONGODB_URI) {
  console.error("❌ MONGO_URL is not defined in environment variables");
  process.exit(1);
}

// إعدادات Mongoose
mongoose.set('strictQuery', true);

// الاتصال بقاعدة البيانات
mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 30000, // 30 ثانية
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log("Connected to MongoDB successfully");
    console.log(`Database: ${mongoose.connection.name}`);

    // تشغيل الخادم بعد الاتصال الناجح
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`API Docs: http://localhost:${PORT}/api-docs`);
      console.log(`Homepage: http://localhost:${PORT}`);
      
    });

    // إعدادات إضافية للخادم
    server.keepAliveTimeout = 120000; // 120 ثانية
    server.headersTimeout = 120000; // 120 ثانية
  // إغلاق نظيف عند إشارات النظام
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  
  try {
    await new Promise((resolve) => {
      server.close(resolve);
    });
    
    console.log('HTTP server closed');
    
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  
  try {
    await new Promise((resolve) => {
      server.close(resolve);
    });
    
    console.log('HTTP server closed');
    
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});  
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    console.error("   Please check your MONGO_URL in .env file");
    process.exit(1);
  });

// 12) معالجة الأخطاء غير الملتقطة
process.on("uncaughtException", (err) => {
  console.error("🔥 Uncaught Exception:", err.message);
  console.error(err.stack);
  
  // إعطاء وقت للتسجيل قبل الخروج
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise);
  console.error("Reason:", reason);
  
  // إعطاء وقت للتسجيل قبل الخروج
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// 13) تصدير التطبيق للاختبارات
module.exports = app;