const Subject = require('../models/subjectModel');
const factory = require('../utils/handlerFactory');
const catchAsync = require('../utils/catchAsync');
const { successResponse } = require('../utils/response');

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
  const subjects = await Subject.find({ yearId });
  return successResponse(
    res,
    200,
    'تم جلب المواد بنجاح',
    { count: subjects.length, subjects }
  );
});
exports.getSubjectsBySemester = catchAsync(async (req, res, next) => {
  const { semesterId } = req.params;
  const subjects = await Subject.find({ semesterId });

  return successResponse(
    res,
    200,
    'تم جلب المواد بنجاح',
    { count: subjects.length, subjects }
  );
});
exports.getSubjectsByYearAndSemester = catchAsync(async (req, res, next) => {
  const { yearId, semesterId } = req.params;
  
  const subjects = await Subject.find({ yearId, semesterId });

  return successResponse(
    res,
    200,
    'تم جلب المواد بنجاح',
    { count: subjects.length, subjects }
  );
});