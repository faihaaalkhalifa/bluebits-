const SurveyResponse = require('../models/surveyResponseModel');
const SurveyForm = require('../models/surveyFormModel');
const Subject = require('../models/subjectModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { successResponse } = require('../utils/response');

exports.submitSurveyResponse = catchAsync(async (req, res, next) => {
  const { formId, subjectResponses } = req.body;

  // 1
  const form = await SurveyForm.findById(formId);

  if (!form) {
    return next(new AppError('الفورم غير موجود', 404));
  }

  if (form.status !== 'open') {
    return next(new AppError('هذا الفورم غير مفتوح للإجابة حالياً', 400));
  }

  // 2) 
  const existingResponse = await SurveyResponse.findOne({
    formId,
    userId: req.user._id,
  });

  if (existingResponse) {
    return next(new AppError('لقد أرسلت ردك على هذا الفورم مسبقاً', 400));
  }

  // 3) 
  const subjectIds = [...new Set(subjectResponses.map((r) => r.subjectId))];

  const targetYearId = form.yearId._id ? form.yearId._id.toString() : form.yearId.toString();
  const targetSemesterId = form.semesterId._id ? form.semesterId._id.toString() : form.semesterId.toString();

  // (Populated)
  const validSubjects = await Subject.find({
    _id: { $in: subjectIds },
    $and: [
      { $or: [{ yearId: targetYearId }, { 'yearId._id': targetYearId }] },
      { $or: [{ semesterId: targetSemesterId }, { 'semesterId._id': targetSemesterId }] }
    ]
  });

  if (validSubjects.length !== subjectIds.length) {
    return next(
      new AppError(
        'بعض المواد المُدخلة لا تنتمي لسنتك الدراسية أو فصلك الحالي',
        400
      )
    );
  }

  // 4) 
  const response = await SurveyResponse.create({
    formId,
    userId: req.user._id,
    yearId: targetYearId,
    semesterId: targetSemesterId,
    subjectResponses,
    submittedAt: Date.now(),
  });

  return successResponse(res, 201, 'شكراً يا بشمهندس ! تم إرسال ردك بنجاح 🎉', response);
});

exports.getMyResponse = catchAsync(async (req, res, next) => {

  const response = await SurveyResponse.findOne({
    userId: req.user._id,
  }).sort('-submittedAt');

  if (!response) {
    return next(new AppError('لم تقم بملء أي فورم بعد', 404));
  }

  return successResponse(res, 200, 'success', response);
});

exports.getMyResponseByForm = catchAsync(async (req, res, next) => {
  const response = await SurveyResponse.findOne({
    formId: req.params.formId,
    userId: req.user._id,
  });

  if (!response) {
    return next(new AppError('لم تقم بملء هذا الفورم بعد', 404));
  }

  return successResponse(res, 200, 'success', response);
});