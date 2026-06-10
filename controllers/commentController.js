const Comment = require('../models/commentModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { successResponse } = require('../utils/response');

exports.createComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.create({
    userId: req.user._id,
    lectureId: req.params.lectureId,
    content: req.body.content,
  });

  return successResponse(res, 201, 'تم إضافة التعليق بنجاح', comment);
});

exports.getLectureComments = catchAsync(async (req, res, next) => {
  const comments = await Comment.find({
    lectureId: req.params.lectureId,
  }).sort('-createdAt');

  return successResponse(
    res,
    200,
    `success, number of documents ${comments.length}`,
    { count: comments.length, comments }
  );
});


exports.updateComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return next(new AppError('التعليق غير موجود', 404));
  }

  if (comment.userId._id.toString() !== req.user._id.toString()) {
    return next(new AppError('ليس لديك صلاحية تعديل هذا التعليق', 403));
  }

  comment.content = req.body.content;
  await comment.save();

  return successResponse(res, 200, 'تم تعديل التعليق بنجاح', comment);
});

exports.deleteComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return next(new AppError('التعليق غير موجود', 404));
  }

  if (
    comment.userId._id.toString() !== req.user._id.toString() &&
    !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)
  ) {
    return next(new AppError('ليس لديك صلاحية حذف هذا التعليق', 403));
  }

  await Comment.findByIdAndDelete(req.params.id);

  return successResponse(res, 200, 'تم حذف التعليق بنجاح', null);
});