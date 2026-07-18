const streamifier = require('streamifier');
const AcademicTask = require('../models/academicTaskModel');
const TaskSubmission = require('../models/taskSubmissionModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { successResponse } = require('../utils/response');
const { cloudinary } = require('../config/cloudinary');

const getMimeTypeFromFileName = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase();
  const mimeTypes = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    zip: 'application/zip',
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

const uploadToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'bluebits/task-submissions', resource_type: 'auto' },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });

exports.submitSolution = catchAsync(async (req, res, next) => {
  const task = await AcademicTask.findById(req.params.taskId);
  if (!task) return next(new AppError('التاسك غير موجود', 404));

  if (task.status !== 'open' || task.closesAt.getTime() < Date.now()) {
    return next(new AppError('التاسك مغلق، لا يمكنك رفع الحل', 400));
  }

  if (!req.file) {
    return next(new AppError('يرجى رفع ملف الحل', 400));
  }

  const result = await uploadToCloudinary(req.file.buffer);

  const submission = await TaskSubmission.findOneAndUpdate(
    { taskId: req.params.taskId, userId: req.user._id },
    {
      taskId: req.params.taskId,
      userId: req.user._id,
      fileUrl: result.secure_url,
      publicId: result.public_id,
      fileType: getMimeTypeFromFileName(req.file.originalname),
      note: req.body.note,
      status: 'pending',
      reviewNote: undefined,
      reviewedBy: undefined,
      reviewedAt: undefined,
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  return successResponse(res, 201, 'تم رفع الحل بنجاح، بانتظار مراجعة الأدمن', submission);
});

exports.getMySubmission = catchAsync(async (req, res, next) => {
  const submission = await TaskSubmission.findOne({
    taskId: req.params.taskId,
    userId: req.user._id,
  });

  if (!submission) return next(new AppError('لم تقم برفع حل لهذا التاسك بعد', 404));

  return successResponse(res, 200, 'success', submission);
});

exports.getSubmissionsForTask = catchAsync(async (req, res, next) => {
  const submissions = await TaskSubmission.find({ taskId: req.params.taskId }).sort(
    '-createdAt'
  );

  return successResponse(
    res,
    200,
    `success, number of documents ${submissions.length}`,
    submissions
  );
});

exports.reviewSubmission = catchAsync(async (req, res, next) => {
  const { status, reviewNote } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return next(new AppError('الحالة يجب أن تكون approved أو rejected', 400));
  }

  const submission = await TaskSubmission.findByIdAndUpdate(
    req.params.id,
    {
      status,
      reviewNote,
      reviewedBy: req.user._id,
      reviewedAt: Date.now(),
    },
    { new: true, runValidators: true }
  );

  if (!submission) return next(new AppError('الحل غير موجود', 404));

  return successResponse(
    res,
    200,
    status === 'approved' ? 'تم قبول الحل ✅' : 'تم رفض الحل ❌',
    submission
  );
});