const Lecture = require('../models/lectureModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { successResponse } = require('../utils/response');
const Subject = require('../models/subjectModel');
const { cloudinary } = require('../config/cloudinary');
const factory = require('../utils/handlerFactory');
const streamifier = require('streamifier');
const axios = require('axios');
// دوال مساعدة 
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'bluebits/lectures', resource_type: 'auto' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

const getResourceType = (fileUrl) => {
  if (!fileUrl) return 'image';
  const ext = fileUrl.split('.').pop().split('?')[0].toLowerCase();
  if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return 'video';
  if (['pdf', 'doc', 'docx', 'ppt', 'pptx'].includes(ext)) return 'raw';
  return 'image';
};
// رفع محاضرة جديدة
exports.createLecture = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('يرجى رفع ملف المحاضرة', 400));
  }

  const result = await uploadToCloudinary(req.file.buffer);

  const lecture = await Lecture.create({
    title: req.body.title,
    description: req.body.description,
      subjectId: req.body.subjectId,
      type: req.body.type,
    isPublished: req.body.isPublished === 'true',
    uploadedBy: req.user._id,
    fileUrl: result.secure_url,
    publicId: result.public_id,
    fileSize: req.file.size,
    fileType: req.file.mimetype,
  });

  return successResponse(res, 201, 'تم رفع المحاضرة بنجاح', lecture);
});

// تعديل محاضرة
exports.updateLecture = catchAsync(async (req, res, next) => {
  console.log('Body:', req.body);
  console.log('File:', req.file);

  const lecture = await Lecture.findById(req.params.id);

  if (!lecture) {
    return next(new AppError('المحاضرة غير موجودة', 404));
  }

  const updateData = {};

  if (req.body.title !== undefined) updateData.title = req.body.title;
  if (req.body.description !== undefined) updateData.description = req.body.description;
  if (req.body.isPublished !== undefined) updateData.isPublished = req.body.isPublished === 'true';

  if (req.file) {
    await cloudinary.uploader.destroy(lecture.publicId, {
      resource_type: getResourceType(lecture.fileUrl),
    });
;
    const result = await uploadToCloudinary(req.file.buffer);

    updateData.fileUrl = result.secure_url;
    updateData.publicId = result.public_id;
    updateData.fileSize = req.file.size;
    updateData.fileType = req.file.mimetype;
  }

  const updated = await Lecture.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  return successResponse(res, 200, 'تم تحديث المحاضرة بنجاح', updated);
});

// حذف محاضرة
exports.deleteLecture = catchAsync(async (req, res, next) => {
  const lecture = await Lecture.findById(req.params.id);

  if (!lecture) {
    return next(new AppError('المحاضرة غير موجودة', 404));
  }

  await cloudinary.uploader.destroy(lecture.publicId, {
    resource_type: getResourceType(lecture.fileUrl),
  });

  await Lecture.findByIdAndDelete(req.params.id);

  return successResponse(res, 200, 'تم حذف المحاضرة بنجاح', null);
});

// تحميل محاضرة
exports.downloadLecture = catchAsync(async (req, res, next) => {
  const lecture = await Lecture.findById(req.params.id);

  if (!lecture) {
    return next(new AppError('المحاضرة غير موجودة', 404));
  }

  if (!lecture.isPublished) {
    return next(new AppError('هذه المحاضرة غير منشورة', 403));
  }

  const response = await axios({
    method: 'GET',
    url: lecture.fileUrl,
    responseType: 'stream',
  });

  const extension = lecture.fileUrl.split('.').pop().split('?')[0];
  const filename = `${lecture.title}.${extension}`;

  res.setHeader('Content-Type', lecture.fileType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  res.setHeader('Content-Length', lecture.fileSize);

  response.data.pipe(res);
});

exports.getAllLectures = factory.getAll(Lecture);
exports.getLecture = factory.getOne(Lecture);

//  عدد المحاضرات من كل مادة
exports.getLecturesCountPerSubject = catchAsync(async (req, res, next) => {
  const data = await Lecture.aggregate([
    {
      $group: {
        _id: '$subjectId',
        totalLectures: { $sum: 1 },
        theoreticalCount: {
          $sum: { $cond: [{ $eq: ['$type', 'theoretical'] }, 1, 0] },
        },
        practicalCount: {
          $sum: { $cond: [{ $eq: ['$type', 'practical'] }, 1, 0] },
        },
      },
    },
    {
      $lookup: {
        from: 'subjects',
        localField: '_id',
        foreignField: '_id',
        as: 'subject',
      },
    },
    { $unwind: '$subject' },
    {
      $project: {
        _id: 0,
        subjectId: '$_id',
        subjectName: '$subject.name',
        totalLectures: 1,
        theoreticalCount: 1,
        practicalCount: 1,
      },
    },
  ]);

  return successResponse(res, 200, 'success', data);
});

// 2. محاضرات مادة معينة حسب النوع (عملي أو نظري)
exports.getLecturesByType = catchAsync(async (req, res, next) => {
  const { subjectId, type } = req.params;

  if (!['theoretical', 'practical'].includes(type)) {
    return next(new AppError('النوع يجب أن يكون theoretical أو practical', 400));
  }

  const lectures = await Lecture.find({ subjectId, type });

  return successResponse(
    res,
    200,
    `success, number of documents ${lectures.length}`,
    { count: lectures.length, lectures }
  );
});

// 3. محاضرات حسب السنة والفصل والمادة والنوع
exports.getLecturesByYearSemesterSubjectType = catchAsync(async (req, res, next) => {
  const { yearId, semesterId, subjectId, type } = req.params;

  // تحقق من المادة تابعة للسنة والفصل
  const subject = await require('../models/subjectModel').findOne({
    _id: subjectId,
    yearId,
    semesterId,
  });

  if (!subject) {
    return next(new AppError('المادة غير موجودة في هذه السنة أو الفصل', 404));
  }

  const filter = { subjectId };
  if (type && ['theoretical', 'practical'].includes(type)) {
    filter.type = type;
  }

  const lectures = await Lecture.find(filter);

  return successResponse(
    res,
    200,
    `success, number of documents ${lectures.length}`,
    { count: lectures.length, type: type || 'all', lectures }
  );
});