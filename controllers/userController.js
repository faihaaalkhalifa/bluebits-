const User = require("./../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("./../utils/appError");
const factory = require("../utils/handlerFactory");
const mongoose = require("mongoose");
const { successResponse, errorResponse } = require("../utils/response");
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.createUser = factory.createOne(User);
exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);
// Do NOT update passwords with this!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword.",
        400,
      ),
    );
  } 
 const filteredBody = filterObj(
  req.body,
  "name",
  "email", 
  "profile_image",
  "yearId", 
);
  if (req.file)
    filteredBody.photo = `${req.protocol}://${req.get("host")}/img/users/${
      req.file.filename
    }`; // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  // 🚀 استبدال الرد القديم بالرد الموحد الجديد
  return successResponse(
    res,
    200, // رمز الحالة (200 OK)
    "success", // رسالة النجاح
    updatedUser, // المستند المُحدَّث يذهب مباشرةً إلى حقل 'data'
  );
});
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(200).json({
    status: "success",
  });
});
exports.activeMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: true });
  res.status(200).json({
    status: "success",
  });
});
