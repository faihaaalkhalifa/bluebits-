const SubjectGroup = require('../models/subjectGroupModel');
const Subject = require('../models/subjectModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { successResponse } = require('../utils/response');

exports.setCreatedBy = (req, res, next) => {
  req.body.createdBy = req.user._id;
  next();
};

exports.createGroup = catchAsync(async (req, res, next) => {
  const group = await SubjectGroup.create({
    name: req.body.name,
    yearId: req.body.yearId,
    semesterId: req.body.semesterId,
    createdBy: req.user._id,
  });

  return successResponse(res, 201, 'تم إنشاء الغروب بنجاح', group);
});


exports.getAllGroups = catchAsync(async (req, res, next) => {
  const groups = await SubjectGroup.find().sort('-createdAt');
  return successResponse(res, 200, `success, number of documents ${groups.length}`, groups);
});

exports.getGroup = catchAsync(async (req, res, next) => {
  const group = await SubjectGroup.findById(req.params.id);
  if (!group) return next(new AppError('الغروب غير موجود', 404));

  const subjects = await Subject.find({ groupId: group._id });

  return successResponse(res, 200, 'success', {
    ...group.toObject(),
    subjects,
  });
});

exports.getGroupsByYear = catchAsync(async (req, res, next) => {
  const groups = await SubjectGroup.find({ yearId: req.params.yearId }).sort('-createdAt');
  return successResponse(res, 200, `success, number of documents ${groups.length}`, groups);
});


exports.getGroupsBySemester = catchAsync(async (req, res, next) => {
  const groups = await SubjectGroup.find({ semesterId: req.params.semesterId }).sort('-createdAt');
  return successResponse(res, 200, `success, number of documents ${groups.length}`, groups);
});


exports.getGroupsByYearAndSemester = catchAsync(async (req, res, next) => {
  const { yearId, semesterId } = req.params;
  const groups = await SubjectGroup.find({ yearId, semesterId }).sort('-createdAt');
  return successResponse(res, 200, `success, number of documents ${groups.length}`, groups);
});


exports.updateGroup = catchAsync(async (req, res, next) => {
  const group = await SubjectGroup.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      yearId: req.body.yearId,
      semesterId: req.body.semesterId,
    },
    { new: true, runValidators: true }
  );
  if (!group) return next(new AppError('الغروب غير موجود', 404));
  return successResponse(res, 200, 'تم تعديل الغروب بنجاح', group);
});


exports.deleteGroup = catchAsync(async (req, res, next) => {
  const group = await SubjectGroup.findById(req.params.id);
  if (!group) return next(new AppError('الغروب غير موجود', 404));

  await Subject.updateMany({ groupId: group._id }, { groupId: null });

  await SubjectGroup.findByIdAndDelete(req.params.id);

  return successResponse(res, 200, 'تم حذف الغروب وفك ارتباط المواد التابعة له', null);
});

exports.addSubjectToGroup = catchAsync(async (req, res, next) => {
  const { subjectId } = req.body;
  if (!subjectId) return next(new AppError('يجب تحديد معرف المادة (subjectId)', 400));

  const group = await SubjectGroup.findById(req.params.id);
  if (!group) return next(new AppError('الغروب غير موجود', 404));

  const subject = await Subject.findById(subjectId);
  if (!subject) return next(new AppError('المادة غير موجودة', 404));

  
  const subjectYearId = subject.yearId._id || subject.yearId;
  const subjectSemesterId = subject.semesterId._id || subject.semesterId;
  const groupYearId = group.yearId._id || group.yearId;
  const groupSemesterId = group.semesterId._id || group.semesterId;

  if (
    subjectYearId.toString() !== groupYearId.toString() ||
    subjectSemesterId.toString() !== groupSemesterId.toString()
  ) {
    return next(
      new AppError('لا يمكن إضافة مادة من سنة أو فصل مختلف عن الغروب', 400)
    );
  }

  await Subject.findByIdAndUpdate(
    subjectId,
    { groupId: group._id },
    { new: true }
  );

  
  const updatedGroup = await SubjectGroup.findById(group._id)
    .populate({
      path: 'subjects',
      populate: [
        { path: 'yearId', select: 'name order' },
        { path: 'semesterId', select: 'name' },
        { path: 'createdBy', select: 'name email' },
        { path: 'lecturerIds', select: 'name email role' }
      ]
    });

  return successResponse(res, 200, 'تمت إضافة المادة إلى الغروب بنجاح', updatedGroup);
});




exports.removeSubjectFromGroup = catchAsync(async (req, res, next) => {
  const { subjectId } = req.body;
  if (!subjectId) return next(new AppError('يجب تحديد معرف المادة (subjectId)', 400));

  const subject = await Subject.findById(subjectId);
  if (!subject) return next(new AppError('المادة غير موجودة', 404));

  const currentGroupId = subject.groupId?._id || subject.groupId;
  if (!currentGroupId || currentGroupId.toString() !== req.params.id) {
    return next(new AppError('هذه المادة ليست ضمن هذا الغروب', 400));
  }

  subject.groupId = null;
  await subject.save();

  return successResponse(res, 200, 'تمت إزالة المادة من الغروب بنجاح', subject);
});


exports.getSubjectsInGroup = catchAsync(async (req, res, next) => {
  const group = await SubjectGroup.findById(req.params.id);
  if (!group) return next(new AppError('الغروب غير موجود', 404));

  const subjects = await Subject.find({ groupId: group._id });

  return successResponse(
    res,
    200,
    `success, number of documents ${subjects.length}`,
    subjects
  );
});