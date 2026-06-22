const SurveyForm = require('../models/surveyFormModel');
const SurveyResponse = require('../models/surveyResponseModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { successResponse } = require('../utils/response');

exports.createSurveyForm = catchAsync(async (req, res, next) => {
  const existingOpen = await SurveyForm.findOne({
    semesterId: req.body.semesterId,
    yearId: req.body.yearId,
    status: 'open',
  });

  if (existingOpen) {
    return next(
      new AppError(
        'يوجد فورم مفتوح بالفعل لهذه السنة والفصل، أغلقه أولاً',
        400
      )
    );
  }

  const form = await SurveyForm.create({
    semesterId: req.body.semesterId,
    yearId: req.body.yearId,
    academicYear: req.body.academicYear,
    createdBy: req.user._id,
    status: 'draft',
  });

  return successResponse(res, 201, 'تم إنشاء الفورم بنجاح', form);
});

exports.openSurveyForm = catchAsync(async (req, res, next) => {
  const form = await SurveyForm.findById(req.params.id);

  if (!form) {
    return next(new AppError('الفورم غير موجود', 404));
  }

  if (form.status === 'open') {
    return next(new AppError('الفورم مفتوح بالفعل', 400));
  }

  if (form.status === 'closed') {
    return next(new AppError('لا يمكن إعادة فتح فورم مغلق', 400));
  }
  const existingOpen = await SurveyForm.findOne({
    semesterId: form.semesterId,
    yearId: form.yearId,
    status: 'open',
    _id: { $ne: form._id },
  });

  if (existingOpen) {
    return next(
      new AppError(
        'يوجد فورم مفتوح بالفعل لهذه السنة والفصل',
        400
      )
    );
  }

  form.status = 'open';
  form.openedAt = Date.now();
  await form.save();

  return successResponse(res, 200, 'تم فتح الفورم للطلاب بنجاح', form);
});

exports.closeSurveyForm = catchAsync(async (req, res, next) => {
  const form = await SurveyForm.findById(req.params.id);

  if (!form) {
    return next(new AppError('الفورم غير موجود', 404));
  }

  if (form.status !== 'open') {
    return next(new AppError('الفورم ليس مفتوحاً حتى يُغلق', 400));
  }

  form.status = 'closed';
  form.closedAt = Date.now();
  await form.save();

  return successResponse(res, 200, 'تم إغلاق الفورم بنجاح', form);
});

exports.getAllSurveyForms = catchAsync(async (req, res, next) => {
  const forms = await SurveyForm.find().sort('-createdAt');

  return successResponse(
    res,
    200,
    `success, number of documents ${forms.length}`,
    forms
  );
});

exports.getSurveyForm = catchAsync(async (req, res, next) => {
  const form = await SurveyForm.findById(req.params.id);

  if (!form) {
    return next(new AppError('الفورم غير موجود', 404));
  }

  return successResponse(res, 200, 'success', form);
});

exports.getActiveSurveyForm = catchAsync(async (req, res, next) => {
  const form = await SurveyForm.findOne({
    yearId: req.user.yearId, 
    status: 'open',
  });

  if (!form) {
    return next(new AppError('لا يوجد فورم مفتوح لسنتك الدراسية حالياً', 404));
  }

  const existingResponse = await SurveyResponse.findOne({
    formId: form._id,
    userId: req.user._id,
  });

  return successResponse(res, 200, 'success', {
    form,
    alreadySubmitted: !!existingResponse,
  });
});

exports.getSurveyFormResponses = catchAsync(async (req, res, next) => {
  const form = await SurveyForm.findById(req.params.id);

  if (!form) {
    return next(new AppError('الفورم غير موجود', 404));
  }

  const responses = await SurveyResponse.find({
    formId: req.params.id,
  }).sort('-submittedAt');

  return successResponse(
    res,
    200,
    `success, number of responses ${responses.length}`,
    {
      form,
      totalResponses: responses.length,
      responses,
    }
  );
});