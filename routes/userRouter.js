const express = require("express");
const userController = require("./../controllers/userController");
const authController = require("../controllers/authController");
const authMiddlewers = require("../middlewares/authMiddlewers");
const imguserMiddlewers = require("../middlewares/imguserMiddlewers");
const { protect, restrictTo } = require("./../middlewares/authMiddlewers");
const rateLimit = require("express-rate-limit");
const router = express.Router();

// Rate Limiter for resend verification
const resendVerificationLimiter = rateLimit({
  max: 5,
  windowMs: 10 * 60 * 1000, // 10 minutes
  message: "تم تجاوز حد الطلبات. حاول مرة أخرى لاحقاً!",
  skipSuccessfulRequests: false,
  keyGenerator: (req, res) => {
    return req.body.email || req.ip; // Use email as key, fallback to IP
  },
});

router.post("/login", authController.login);
router.get("/logout", authController.logout);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);
router.get("/resetPassword/:token", (req, res) => {
  res.render("user/resetPassword4");
});
router.post("/signup", authController.signup);

// Email Verification Routes
router.get("/verifyEmail/:token", authController.verifyEmail);
router.post(
  "/resendVerification",
  resendVerificationLimiter,
  authController.resendVerification,
);

// عمليات المستخدم على حسابه الخاص
router.patch(
  "/activeMe",
  authMiddlewers.protect,
  authMiddlewers.isEmailVerified,
  userController.activeMe,
);
router.get(
  "/me",
  authMiddlewers.protect,
  authMiddlewers.isEmailVerified,
  userController.getMe,
  userController.getUser,
);
router.delete(
  "/deleteMe",
  authMiddlewers.protect,
  authMiddlewers.isEmailVerified,
  userController.deleteMe,
);
router.patch(
  "/updateMe",
  authMiddlewers.protect,
  authMiddlewers.isEmailVerified,
  userController.updateMe,
);
router.patch(
  "/updateMeAndUpload",
  authMiddlewers.protect,
  authMiddlewers.isEmailVerified,
  imguserMiddlewers.uploadUserPhoto,
  userController.updateMe,
);
router.patch(
  "/updateMyPassword",
  authMiddlewers.protect,
  authMiddlewers.isEmailVerified,
  authController.updatePassword,
  authMiddlewers.restrictTo("USER", "SUPER_ADMIN", "ADMIN"),
);
router
  .route("/")
  .get(
    authMiddlewers.protect,
    authMiddlewers.isactive,
    authMiddlewers.isEmailVerified,
    authMiddlewers.restrictTo("ADMIN", "SUPER_ADMIN"),
    userController.getAllUsers, //,الحصول على جميع المستخدمين
  )
  .post(
    authMiddlewers.protect,
    authMiddlewers.isactive,
    authMiddlewers.isEmailVerified,
    authMiddlewers.restrictTo("ADMIN", "SUPER_ADMIN"),
    userController.createUser, //انشاء مستخدم جديد
  );
router
  .route("/:id")
  .get(
    authMiddlewers.protect,
    authMiddlewers.isactive,
    authMiddlewers.isEmailVerified,
    authMiddlewers.restrictTo("ADMIN", "USER", "SUPER_ADMIN"),
    userController.getUser, //الحصول على مستخدم معين
  )
  .patch(
    authMiddlewers.protect,
    authMiddlewers.isactive,
    authMiddlewers.isEmailVerified,
    authMiddlewers.restrictTo("SUPER_ADMIN"),
    userController.updateUser, //تحديث مستخدم معين
  )
  .delete(
    authMiddlewers.protect,
    authMiddlewers.isactive,
    authMiddlewers.isEmailVerified,
    authMiddlewers.restrictTo("ADMIN", "SUPER_ADMIN"),
    userController.deleteUser, //حذف مستخدم معين
  );

module.exports = router;
