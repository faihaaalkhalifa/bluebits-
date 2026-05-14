const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const { RoleCode, levelEnum } = require("../utils/enum");
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please tell us your name!"],
      trim: true,
    },
    year: {
      type: String,
    },
    number: {
      type: String,
    },
    email: {
      type: String,
      required: [true, "Please provide your email"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },

    role: {
      type: String,
      enum: Object.values(RoleCode),
      default: "USER",
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: 8,
      select: false,
    },
    profile_image: {
      type: String,
      default: "default.jpg",
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    // Email Verification Fields
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: Date,
    lastVerificationSentAt: Date,
    // حالة الحظر
    isBanned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);


//هذا الجزء مسؤول عن تشفير كلمة المرور قبل حفظ المستخدم في قاعدة البيانات. إذا لم يتم تعديل كلمة المرور، فإنه يتخطى عملية التشفير.
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

  // هذا الجزء مسؤول عن تحديث حقل  عندما يتم تعديل كلمة المرور، مما يساعد في التحقق من صلاحية التوكنات القديمة بعد تغيير كلمة المرور.ذ
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// هذا الجزء مسؤول عن مقارنة كلمة المرور المدخلة مع كلمة المرور المخزنة في قاعدة البيانات أثناء عملية تسجيل الدخول.
userSchema.methods.correctPassword = async function (
  candidatePassword,// كلمة المرور المدخلة من قبل المستخدم
  userPassword,// كلمة المرور المخزنة في قاعدة البيانات (المشفرة) 
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// هذا الجزء مسؤول عن التحقق مما إذا تم تغيير كلمة المرور بعد إصدار التوكن JWT. إذا تم تغيير كلمة المرور بعد إصدار التوكن، فإن التوكن يعتبر غير صالح.
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// هذا الجزء مسؤول عن إنشاء توكن لإعادة تعيين كلمة المرور. يتم إنشاء توكن عشوائي، ثم يتم تشفيره وتخزينه في قاعدة البيانات مع تاريخ انتهاء صلاحية التوكن.
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

// هذا الجزء مسؤول عن إنشاء توكن للتحقق من البريد الإلكتروني. يتم إنشاء توكن عشوائي، ثم يتم تشفيره وتخزينه في قاعدة البيانات مع تاريخ انتهاء صلاحية التوكن.
userSchema.methods.createEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString("hex");
  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return verificationToken;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
