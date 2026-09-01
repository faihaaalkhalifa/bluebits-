const Subject = require('../models/subjectModel');
const factory = require('../utils/handlerFactory');
const catchAsync = require('../utils/catchAsync');
const { successResponse } = require('../utils/response');
const mongoose = require('mongoose');
exports.setCreatedBy = (req, res, next) => {
  req.body.createdBy = req.user._id;
  next();
};

exports.getAllSubjects = factory.getAll(Subject);
exports.getSubject = factory.getOne(Subject);
exports.createSubject = factory.createOne(Subject);
exports.updateSubject = factory.updateOne(Subject);
exports.deleteSubject = factory.deleteOne(Subject);
exports.getSubjectsByYear = catchAsync(async (req, res, next) => {
  const { yearId } = req.params;

  const subjects = await Subject.find({ 
    yearId: new mongoose.Types.ObjectId(yearId)
  });

  return successResponse(
    res,
    200,
    'تم جلب المواد بنجاح',
    { count: subjects.length, subjects }
  );
});
exports.getSubjectsBySemester = catchAsync(async (req, res, next) => {
  const { semesterId } = req.params;

  const subjects = await Subject.find({ 
    semesterId: new mongoose.Types.ObjectId(semesterId)
  });

  return successResponse(
    res,
    200,
    'تم جلب المواد بنجاح',
    { count: subjects.length, subjects }
  );
});

exports.getSubjectsByYearAndSemester = catchAsync(async (req, res, next) => {
  const { yearId, semesterId } = req.params;

  const subjects = await Subject.find({ 
    yearId: new mongoose.Types.ObjectId(yearId),
    semesterId: new mongoose.Types.ObjectId(semesterId)
  });

  return successResponse(
    res,
    200,
    'تم جلب المواد بنجاح',
    { count: subjects.length, subjects }
  );
});


exports.assignLecturer = catchAsync(async (req, res, next) => {
  const { lecturerId } = req.body;
  if (!lecturerId) return next(new AppError('يجب تحديد معرف الدكتور (lecturerId)', 400));

  const lecturer = await mongoose.model('User').findById(lecturerId);
  if (!lecturer) return next(new AppError('الدكتور غير موجود', 404));
  if (!['DOCTOR', 'ADMIN', 'SUPER_ADMIN'].includes(lecturer.role)) {
    return next(new AppError('هذا المستخدم ليس دكتوراً', 400));
  }

  const subject = await Subject.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { lecturerIds: lecturerId } },
    { new: true, runValidators: true }
  );
  if (!subject) return next(new AppError('المادة غير موجودة', 404));

  return successResponse(res, 200, 'تم إسناد المادة للدكتور بنجاح', subject);
});


exports.unassignLecturer = catchAsync(async (req, res, next) => {
  const { lecturerId } = req.body;
  if (!lecturerId) return next(new AppError('يجب تحديد معرف الدكتور (lecturerId)', 400));

  const subject = await Subject.findByIdAndUpdate(
    req.params.id,
    { $pull: { lecturerIds: lecturerId } },
    { new: true }
  );
  if (!subject) return next(new AppError('المادة غير موجودة', 404));

  return successResponse(res, 200, 'تمت إزالة الدكتور من المادة بنجاح', subject);
});


exports.getMySubjects = catchAsync(async (req, res, next) => {
  const subjects = await Subject.find({ lecturerIds: req.user._id }).sort('-createdAt');

  return successResponse(
    res,
    200,
    `success, number of documents ${subjects.length}`,
    subjects
  );
});


exports.getSubjectsByLecturer = catchAsync(async (req, res, next) => {
  const { lecturerId } = req.params;

  const subjects = await Subject.find({ lecturerIds: lecturerId }).sort('-createdAt');

  return successResponse(
    res,
    200,
    `success, number of documents ${subjects.length}`,
    subjects
  );
});