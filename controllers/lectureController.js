const Lecture = require('../models/lectureModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { successResponse } = require('../utils/response');
const Subject = require('../models/subjectModel');
const { cloudinary } = require('../config/cloudinary');
const factory = require('../utils/handlerFactory');
const streamifier = require('streamifier');
const axios = require('axios');

// ========== دالة مساعدة لاستخراج نوع الملف من اسم الملف ==========
const getMimeTypeFromFileName = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase();
  const mimeTypes = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
    'mkv': 'video/x-matroska',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

// ========== دالة الرفع إلى Cloudinary ==========
const uploadToCloudinary = (buffer, mimetype) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { 
        folder: 'bluebits/lectures', 
        resource_type: 'auto', 
      },
      (error, result) => {
        if (error) {
          console.error('خطأ في Cloudinary:', error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};
const getResourceType = (fileUrl) => {
  if (!fileUrl) return 'raw'; // الافتراضي للملفات
  const ext = fileUrl.split('.').pop().split('?')[0].toLowerCase();
  
  if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return 'video';
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'image';
  
  // الـ pdf, doc, ppt وكل شيء تاني يعتبر raw
  return 'raw'; 
};
// ========== رفع محاضرة جديدة ==========
exports.createLecture = catchAsync(async (req, res, next) => {

  if (!req.file) {
    return next(new AppError('يرجى رفع ملف المحاضرة', 400));
  }

  const correctFileType = getMimeTypeFromFileName(req.file.originalname);

  const result = await uploadToCloudinary(req.file.buffer, correctFileType);

let isPublishedValue = false;
const isPublishedRaw = req.body.isPublished ? req.body.isPublished.toString().trim() : '';
if (isPublishedRaw === 'true' || isPublishedRaw === '1') {
  isPublishedValue = true;
}
  // حفظ في قاعدة البيانات
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

  return successResponse(res, 201, ' تم رفع المحاضرة بنجاح شكراً أيها البت العظيم 🥳', lecture);
});

// ========== تعديل محاضرة ==========
exports.updateLecture = catchAsync(async (req, res, next) => {
  const lecture = await Lecture.findById(req.params.id);

  if (!lecture) {
    return next(new AppError('المحاضرة غير موجودة', 404));
  }

  const updateData = {};

  if (req.body.title !== undefined) updateData.title = req.body.title;
  if (req.body.description !== undefined) updateData.description = req.body.description;
  if (req.body.isPublished !== undefined) {
    updateData.isPublished = req.body.isPublished === 'true' || req.body.isPublished === true;
  }

  if (req.file) {
    // حذف الملف القديم
    await cloudinary.uploader.destroy(lecture.publicId, {
      resource_type: getResourceType(lecture.fileUrl),
    });
    
    // استخراج نوع الملف الجديد
    const correctFileType = getMimeTypeFromFileName(req.file.originalname);
    const result = await uploadToCloudinary(req.file.buffer, correctFileType);

    updateData.fileUrl = result.secure_url;
    updateData.publicId = result.public_id;
    updateData.fileSize = req.file.size;
    updateData.fileType = correctFileType;
  }

  const updated = await Lecture.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  return successResponse(res, 200, 'تم تحديث المحاضرة بنجاح', updated);
});

// ========== حذف محاضرة ==========
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

// ========== تحميل محاضرة ==========
exports.downloadLecture = catchAsync(async (req, res, next) => {
  const lecture = await Lecture.findById(req.params.id);

  if (!lecture) {
    return next(new AppError('المحاضرة غير موجودة', 404));
  }

  if (!lecture.isPublished) {
    return next(new AppError('هذه المحاضرة غير منشورة', 403));
  }
  let directDownloadUrl = lecture.fileUrl;
  
  if (directDownloadUrl.includes('/upload/')) {
   
    directDownloadUrl = directDownloadUrl.replace('/upload/', '/upload/fl_attachment/');
  }

  return successResponse(res, 200, 'success', {
    downloadUrl: directDownloadUrl,
    title: lecture.title,
    fileType: lecture.fileType,
    fileSize: lecture.fileSize,
  });
});
exports.getAllLectures = factory.getAll(Lecture);
exports.getLecture = factory.getOne(Lecture);

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

exports.getLecturesByYearSemesterSubjectType = catchAsync(async (req, res, next) => {
  const { yearId, semesterId, subjectId, type } = req.params;

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