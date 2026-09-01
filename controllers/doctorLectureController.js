const Lecture = require('../models/lectureModel');
const Subject = require('../models/subjectModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const QuestionBank = require('../models/questionBankModel');
const Question = require('../models/questionModel');
const { successResponse } = require('../utils/response');
const { cloudinary } = require('../config/cloudinary');
const streamifier = require('streamifier');

const getMimeTypeFromFileName = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase();
  const mimeTypes = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    mkv: 'video/x-matroska',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

const getResourceType = (fileUrl) => {
  if (!fileUrl) return 'raw';
  const ext = fileUrl.split('.').pop().split('?')[0].toLowerCase();
  if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return 'video';
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'image';
  return 'raw';
};

const uploadToCloudinary = (buffer, mimetype) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'bluebits/lectures', resource_type: 'auto' },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });

const checkOwnership = async (subjectId, doctorId) => {
  const subject = await Subject.findById(subjectId);
  if (!subject) throw new AppError('المادة غير موجودة', 404);

  const isOwner = subject.lecturerIds.some(
    (lecturerId) => lecturerId._id
      ? lecturerId._id.toString() === doctorId.toString()
      : lecturerId.toString() === doctorId.toString()
  );

  if (!isOwner) {
    throw new AppError('هذه المادة ليست من ضمن موادك، لا يمكنك رفع محاضرات لها', 403);
  }
  return subject;
};


exports.createLecture = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('يرجى رفع ملف المحاضرة', 400));
  }

  const { subjectId } = req.body;
  if (!subjectId) return next(new AppError('يجب تحديد المادة (subjectId)', 400));


  await checkOwnership(subjectId, req.user._id);

  const correctFileType = getMimeTypeFromFileName(req.file.originalname);
  const result = await uploadToCloudinary(req.file.buffer, correctFileType);

  let isPublishedValue = false;
  const isPublishedRaw = req.body.isPublished ? req.body.isPublished.toString().trim() : '';
  if (isPublishedRaw === 'true' || isPublishedRaw === '1') {
    isPublishedValue = true;
  }

  const lecture = await Lecture.create({
    title: req.body.title,
    description: req.body.description,
    subjectId: req.body.subjectId,
    type: req.body.type,
    isPublished: isPublishedValue,
    uploadedBy: req.user._id,
    fileUrl: result.secure_url,
    publicId: result.public_id,
    fileSize: req.file.size,
    fileType: correctFileType,
  });

  return successResponse(res, 201, 'تم رفع المحاضرة بنجاح', lecture);
});


exports.updateLecture = catchAsync(async (req, res, next) => {
  const lecture = await Lecture.findById(req.params.id);
  if (!lecture) return next(new AppError('المحاضرة غير موجودة', 404));

  const subjectId = lecture.subjectId._id || lecture.subjectId;
  await checkOwnership(subjectId, req.user._id);


  const uploadedById = lecture.uploadedBy._id || lecture.uploadedBy;
  if (uploadedById.toString() !== req.user._id.toString()) {
    return next(new AppError('لا يمكنك تعديل محاضرة رفعها دكتور آخر', 403));
  }

  const updateData = {};
  if (req.body.title !== undefined) updateData.title = req.body.title;
  if (req.body.description !== undefined) updateData.description = req.body.description;
  if (req.body.isPublished !== undefined) {
    updateData.isPublished = req.body.isPublished === 'true' || req.body.isPublished === true;
  }

  if (req.file) {
    await cloudinary.uploader.destroy(lecture.publicId, {
      resource_type: getResourceType(lecture.fileUrl),
    });
    const correctFileType = getMimeTypeFromFileName(req.file.originalname);
    const result = await uploadToCloudinary(req.file.buffer, correctFileType);
    updateData.fileUrl = result.secure_url;
    updateData.publicId = result.public_id;
    updateData.fileSize = req.file.size;
    updateData.fileType = correctFileType;
  }

  const updated = await Lecture.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  return successResponse(res, 200, 'تم تحديث المحاضرة بنجاح', updated);
});


exports.deleteLecture = catchAsync(async (req, res, next) => {
  const lecture = await Lecture.findById(req.params.id);
  if (!lecture) return next(new AppError('المحاضرة غير موجودة', 404));

  const subjectId = lecture.subjectId._id || lecture.subjectId;
  await checkOwnership(subjectId, req.user._id);

  const uploadedById = lecture.uploadedBy._id || lecture.uploadedBy;
  if (uploadedById.toString() !== req.user._id.toString()) {
    return next(new AppError('لا يمكنك حذف محاضرة رفعها دكتور آخر', 403));
  }

  await cloudinary.uploader.destroy(lecture.publicId, {
    resource_type: getResourceType(lecture.fileUrl),
  });

  await Lecture.findByIdAndDelete(req.params.id);

  return successResponse(res, 200, 'تم حذف المحاضرة بنجاح', null);
});


exports.getMyLectures = catchAsync(async (req, res, next) => {
  const mySubjects = await Subject.find({ lecturerIds: req.user._id }).select('_id');
  const subjectIds = mySubjects.map((s) => s._id);

  const filter = { subjectId: { $in: subjectIds } };
  if (req.query.subjectId) filter.subjectId = req.query.subjectId;

  const lectures = await Lecture.find(filter).sort('-createdAt');

  return successResponse(
    res,
    200,
    `success, number of documents ${lectures.length}`,
    lectures
  );
});


exports.getMyStats = catchAsync(async (req, res, next) => {
  const mySubjects = await Subject.find({ lecturerIds: req.user._id });

  if (mySubjects.length === 0) {
    return successResponse(res, 200, 'لا توجد مواد مسندة لك حالياً', []);
  }
//1
  const subjectIds = mySubjects.map((s) => s._id);

 
  const lectureStats = await Lecture.aggregate([
    { $match: { subjectId: { $in: subjectIds }, uploadedBy: req.user._id } },
    {
      $group: {
        _id: '$subjectId',
        totalLectures: { $sum: 1 },
        publishedLectures: {
          $sum: { $cond: ['$isPublished', 1, 0] },
        },
        draftLectures: {
          $sum: { $cond: ['$isPublished', 0, 1] },
        },
      },
    },
  ]);
//2
  const bankStats = await QuestionBank.aggregate([
    { $match: { subjectId: { $in: subjectIds }, createdBy: req.user._id } },
    {
      $lookup: {
        from: 'questions',
        localField: '_id',
        foreignField: 'bankId',
        as: 'questions',
      },
    },
    {
      $group: {
        _id: '$subjectId',
        totalBanks: { $sum: 1 },
        publishedBanks: {
          $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] },
        },
        draftBanks: {
          $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] },
        },
        totalQuestions: { $sum: { $size: '$questions' } },
      },
    },
  ]);

 //3
  const lectureStatsMap = {};
  lectureStats.forEach((s) => { lectureStatsMap[s._id.toString()] = s; });

  const bankStatsMap = {};
  bankStats.forEach((s) => { bankStatsMap[s._id.toString()] = s; });

  const result = mySubjects.map((subject) => {
    const subjectId = subject._id.toString();
    const lStats = lectureStatsMap[subjectId] || {};
    const bStats = bankStatsMap[subjectId] || {};

    return {
      subjectId: subject._id,
      subjectName: subject.name,
      year: subject.yearId?.name ?? null,
      semester: subject.semesterId?.name ?? null,
      lectures: {
        total: lStats.totalLectures || 0,
        published: lStats.publishedLectures || 0,
        draft: lStats.draftLectures || 0,
      },
      questionBanks: {
        total: bStats.totalBanks || 0,
        published: bStats.publishedBanks || 0,
        draft: bStats.draftBanks || 0,
        totalQuestions: bStats.totalQuestions || 0,
      },
    };
  });

  return successResponse(res, 200, 'success', result);
});