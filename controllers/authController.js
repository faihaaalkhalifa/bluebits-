const jwt = require("jsonwebtoken");
const User = require("./../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("./../utils/appError");
const { successResponse, errorResponse } = require("../utils/response");
const Email = require("../config/email");
const crypto = require("crypto");
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);
  res.cookie("jwt", token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  }); // Remove password from output
  user.password = undefined; // 🚀 استبدال الرد القديم بالرد الموحد الجديد
  return successResponse(
    res,
    statusCode,
    "success", // رسالة واضحة
    {
      token: token, // التوكن
      user: user, // بيانات المستخدم
    }, // هذا الكائن يمثل حقل 'data'
  ); // تم حذف الكود القديم:
  // res.status(statusCode).json({
  //   status: 'success',
  //   token,
  //   user,
  // });
};
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    //  property signup
  });

  // Generate email verification token
  const verificationToken = newUser.createEmailVerificationToken();
  await newUser.save({ validateBeforeSave: false });

  // Create verification URL
  const verificationURL = `${req.protocol}://${req.get(
    "host",
  )}/api/v1.0.0/users/verifyEmail/${verificationToken}`;

  try {
    // Send verification email
    await new Email(newUser, verificationURL).sendVerification();

    // Return success response
    return successResponse(
      res,
      200,
      "تم إرسال رابط التفعيل إلى بريدك الإلكتروني بنجاح. يرجى التحقق من بريدك الآن.",
      {
        message: "تم إنشاء الحساب بنجاح. تحقق من بريدك لتفعيل الحساب.",
      },
    );
  } catch (error) {
    // Delete user if email sending failed
    await User.deleteOne({ _id: newUser._id });
    return next(
      new AppError(
        "حدث خطأ أثناء إرسال البريد الإلكتروني. يرجى المحاولة لاحقاً!",
        500,
      ),
    );
  }
});
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }
  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // 3) Check if email is verified
  if (!user.isVerified) {
    return next(new AppError("يرجى تفعيل بريدك الإلكتروني أولاً", 403));
  }

  // 4) If everything ok, send token to client
  createSendToken(user, 200, req, res);
});
exports.logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  }); // 🚀 استبدال الرد القديم بالرد الموحد الجديد
  return successResponse(
    res,
    200, // رمز الحالة (200 OK)
    "success", // رسالة النجاح
    null, // لا توجد بيانات لإرسالها في عملية تسجيل الخروج
  );

  // تم حذف الكود القديم:
  // res.status(200).json({ status: 'success' });
};
//password
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    // 🛑 الرد الفاشل يتم عبر AppError
    return next(new AppError("There is no user with that email address.", 404));
  } // 2) Generate the random reset token

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); // 3) Send it to user's email

  try {
    const resetURL = `${req.protocol}://${req.get("host")}${req.originalUrl
      .split("/", 4)
      .join("/")}/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset(); // 🚀 استبدال الرد القديم بالرد الموحد الجديد

    return successResponse(
      res,
      200,
      "تم إرسال رمز استعادة كلمة المرور إلى بريدك الإلكتروني بنجاح.", // رسالة النجاح
      null, // لا يوجد بيانات صريحة لإرسالها
    );

    // تم حذف الكود القديم:
    // res.status(200).json({
    //   status: 'success',
    //   message: 'Token sent to email!',
    // });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false }); // 🛑 الرد الفاشل يتم عبر AppError

    return next(
      new AppError(
        "حدث خطأ أثناء إرسال البريد الإلكتروني. يرجى المحاولة لاحقاً!",
        500,
      ),
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }); // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    // 🛑 الرد الفاشل يتم عبر AppError
    return next(new AppError("Token is invalid or has expired", 400));
  }
  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save(); // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  // 🚀 هذا الرد يستخدم createSendToken (التي أصبحت موحدة)
  return createSendToken(user, 200, req, res); // 👈🏽 إضافة 'return' للإنهاء
});
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select("+password"); // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    // 🛑 الرد الفاشل يتم عبر AppError
    return next(new AppError("Your current password is wrong.", 401));
  } // 3) If so, update password
  user.password = req.body.password;
  await user.save(); // User.findByIdAndUpdate will NOT work as intended!
  // 4) Log user in, send JWT
  // 🚀 هذا الرد يستخدم createSendToken (التي أصبحت موحدة)
  return createSendToken(user, 200, req, res); // 👈🏽 إضافة 'return' للإنهاء
});

// Email Verification
exports.verifyEmail = catchAsync(async (req, res, next) => {
  // 1) Hash the token from URL
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  // 2) Find user with valid token and not expired
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  });

  // 3) If no user found, token is invalid or expired
  if (!user) {
    return next(new AppError("الرابط غير صالح أو منتهي", 400));
  }

  // 4) Mark email as verified
  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;

  await user.save({ validateBeforeSave: false });

  // 5) Log the user in and send JWT
  return createSendToken(user, 200, req, res);
});

// Resend Verification Email
exports.resendVerification = catchAsync(async (req, res, next) => {
  // 1) Get user from email
  const user = await User.findOne({ email: req.body.email });

  // 2) If user doesn't exist, return generic message (security best practice)
  if (!user) {
    return successResponse(
      res,
      200,
      "إذا كان الإيميل موجوداً في النظام، سيتم إرسال رابط التفعيل",
      null,
    );
  }

  // 3) If already verified, return error
  if (user.isVerified) {
    return next(new AppError("الحساب مفعل بالفعل", 400));
  }

  // 4) Check cooldown - prevent spam (60 seconds between requests)
  if (
    user.lastVerificationSentAt &&
    Date.now() - user.lastVerificationSentAt < 60 * 1000
  ) {
    return next(new AppError("انتظر دقيقة واحدة قبل إعادة الإرسال", 429));
  }

  // 5) Generate new verification token
  const verificationToken = user.createEmailVerificationToken();
  user.lastVerificationSentAt = Date.now();

  await user.save({ validateBeforeSave: false });

  // 6) Create verification URL
  const verificationURL = `${req.protocol}://${req.get(
    "host",
  )}/api/v1.0.0/users/verifyEmail/${verificationToken}`;

  try {
    // 7) Send verification email
    await new Email(user, verificationURL).sendVerification();

    return successResponse(
      res,
      200,
      "تم إعادة إرسال رابط التفعيل بنجاح. تحقق من بريدك الإلكتروني",
      null,
    );
  } catch (error) {
    // Reset verification fields if email fails
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    user.lastVerificationSentAt = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "حدث خطأ أثناء إرسال البريد الإلكتروني. يرجى المحاولة لاحقاً!",
        500,
      ),
    );
  }
});
