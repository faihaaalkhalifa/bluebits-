const User = require("./../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("./../utils/appError");
const factory = require("../utils/handlerFactory");
const APIFeatures = require("../utils/apiFeatures");
const { Permission } = require("../utils/enum");
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
const streamifier = require('streamifier');
const { cloudinary } = require('../config/cloudinary');

const uploadUserPhotoToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'bluebits/users', resource_type: 'image' },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword.",
        400,
      ),
    );
  }

  const filteredBody = filterObj(req.body, "name", "email", "yearId");

  if (req.file) {
  
    const currentUser = await User.findById(req.user.id);
    if (currentUser.profile_image_publicId) {
      await cloudinary.uploader
        .destroy(currentUser.profile_image_publicId, { resource_type: 'image' })
        .catch(() => {});
    }

    const result = await uploadUserPhotoToCloudinary(req.file.buffer);
    filteredBody.profile_image = result.secure_url;
    filteredBody.profile_image_publicId = result.public_id;
  }

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  return successResponse(res, 200, "success", updatedUser);
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

exports.getUsersByYear = catchAsync(async (req, res, next) => {
  const { yearId } = req.params;

  const features = new APIFeatures(
    User.find({ yearId: new mongoose.Types.ObjectId(yearId) }),
    req.query,
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const users = await features.query;

  return successResponse(
    res,
    200,
    `success, number of documents ${users.length}`,
    users,
  );
});




exports.grantPermission = catchAsync(async (req, res, next) => {
  const { permission } = req.body;

  if (!Object.values(Permission).includes(permission)) {
    return next(new AppError("صلاحية غير معروفة", 400));
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { permissions: permission } }, 
    { new: true },
  );

  if (!user) return next(new AppError("المستخدم غير موجود", 404));

  return successResponse(res, 200, `تمت إضافة صلاحية ${permission} بنجاح`, user);
});

exports.revokePermission = catchAsync(async (req, res, next) => {
  const { permission } = req.body;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $pull: { permissions: permission } },
    { new: true },
  );

  if (!user) return next(new AppError("المستخدم غير موجود", 404));

  return successResponse(res, 200, `تم سحب صلاحية ${permission} بنجاح`, user);
});
