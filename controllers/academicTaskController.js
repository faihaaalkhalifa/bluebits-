const AcademicTask = require('../models/academicTaskModel');
const TaskSubmission = require('../models/taskSubmissionModel'); 
const Subject = require('../models/subjectModel');
const Lecture = require('../models/lectureModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { successResponse } = require('../utils/response');
const { cloudinary } = require('../config/cloudinary');

const isAdminRole = (role) => ['ADMIN', 'DOCTOR', 'SUPER_ADMIN'].includes(role);

const getResourceType = (fileUrl) => {
  if (!fileUrl) return 'raw';
  const ext = fileUrl.split('.').pop().split('?')[0].toLowerCase();
  if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return 'video';
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'image';
  return 'raw';
};

exports.createAcademicTask = catchAsync(async (req, res, next) => {
  const {
    title,
    description,
    yearId,
    subjectId,
    lectureId,
    durationDays,
    durationHours,
    durationMinutes,
  } = req.body;

  const totalMinutes =
    (Number(durationDays) || 0) * 24 * 60 +
    (Number(durationHours) || 0) * 60 +
    (Number(durationMinutes) || 0);

  if (totalMinutes <= 0) {
    return next(new AppError('يجب تحديد مدة صالحة للتاسك (يوم/ساعة/دقيقة)', 400));
  }

  const subject = await Subject.findById(subjectId);
  if (!subject) return next(new AppError('المادة غير موجودة', 404));

  const lecture = await Lecture.findById(lectureId);
  if (!lecture) return next(new AppError('المحاضرة غير موجودة', 404));

  const task = await AcademicTask.create({
    title,
    description,
    yearId,
    subjectId,
    lectureId,
    createdBy: req.user._id,
    durationDays,
    durationHours,
    durationMinutes,
  });

  return successResponse(res, 201, 'تم إنشاء التاسك وفتحه للطلاب بنجاح', task);
});

exports.getAllAcademicTasks = catchAsync(async (req, res, next) => {
  const filter = {};

  if (!isAdminRole(req.user.role)) {
    // الطالب يشوف بس تاسكات سنته، ومفتوحة افتراضياً
    filter.yearId = req.user.yearId;
    filter.status = req.query.status === 'all' ? undefined : 'open';
  } else if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.subjectId) filter.subjectId = req.query.subjectId;
  if (req.query.lectureId) filter.lectureId = req.query.lectureId;

  Object.keys(filter).forEach((k) => filter[k] === undefined && delete filter[k]);

  const tasks = await AcademicTask.find(filter).sort('-createdAt');

  return successResponse(
    res,
    200,
    `success, number of documents ${tasks.length}`,
    tasks
  );
});

exports.getAcademicTask = catchAsync(async (req, res, next) => {
  const task = await AcademicTask.findById(req.params.id);
  if (!task) return next(new AppError('التاسك غير موجود', 404));
  return successResponse(res, 200, 'success', task);
});

exports.updateAcademicTask = catchAsync(async (req, res, next) => {
  const task = await AcademicTask.findById(req.params.id);
  if (!task) return next(new AppError('التاسك غير موجود', 404));

  const allowed = ['title', 'description', 'durationDays', 'durationHours', 'durationMinutes'];
  let durationChanged = false;
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) {
      task[field] = req.body[field];
      if (field.startsWith('duration')) durationChanged = true;
    }
  });

  if (durationChanged) {
    const ms =
      (task.durationDays || 0) * 24 * 60 * 60 * 1000 +
      (task.durationHours || 0) * 60 * 60 * 1000 +
      (task.durationMinutes || 0) * 60 * 1000;
    task.closesAt = new Date(task.opensAt.getTime() + ms);
    if (task.closesAt.getTime() > Date.now()) task.status = 'open';
  }

  await task.save();

  return successResponse(res, 200, 'تم تعديل التاسك بنجاح', task);
});

exports.closeAcademicTask = catchAsync(async (req, res, next) => {
  const task = await AcademicTask.findByIdAndUpdate(
    req.params.id,
    { status: 'closed' },
    { new: true }
  );
  if (!task) return next(new AppError('التاسك غير موجود', 404));
  return successResponse(res, 200, 'تم إغلاق التاسك يدوياً', task);
});

exports.deleteAcademicTask = catchAsync(async (req, res, next) => {
  const task = await AcademicTask.findById(req.params.id);
  if (!task) return next(new AppError('التاسك غير موجود', 404));

  const submissions = await TaskSubmission.find({ taskId: task._id });

  for (const submission of submissions) {
    try {
      await cloudinary.uploader.destroy(submission.publicId, {
        resource_type: getResourceType(submission.fileUrl),
      });
    } catch (error) {
      console.error(` فشل حذف ملف Cloudinary للحل ${submission._id}:`, error.message);
    }
  }

  await TaskSubmission.deleteMany({ taskId: task._id });

  await AcademicTask.findByIdAndDelete(req.params.id);
  
  return successResponse(
    res,
    200,
    `تم حذف التاسك و ${submissions.length} حل مرتبط فيه (من قاعدة البيانات و Cloudinary)`,
    null
  );
});