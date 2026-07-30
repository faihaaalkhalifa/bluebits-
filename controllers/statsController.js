const Year = require('../models/yearModel');
const SurveyForm = require('../models/surveyFormModel');
const SurveyResponse = require('../models/surveyResponseModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { successResponse } = require('../utils/response');
const aggregateSubjectsStats = (formId) =>
  SurveyResponse.aggregate([
    { $match: { formId } },
    { $unwind: '$subjectResponses' },
    {
      $group: {
        _id: '$subjectResponses.subjectId',
        carryingCount: {
          $sum: { $cond: ['$subjectResponses.isCarrying', 1, 0] },
        },
        avgPreferredDaysBefore: {
          $avg: '$subjectResponses.preferredDaysBefore',
        },
        avgDifficultyRating: {
          $avg: '$subjectResponses.difficultyRating',
        },
        totalResponsesForSubject: { $sum: 1 },
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
        carryingCount: 1,
        totalResponsesForSubject: 1,
        avgPreferredDaysBefore: { $round: ['$avgPreferredDaysBefore', 1] },
        avgDifficultyRating: { $round: ['$avgDifficultyRating', 1] },
      },
    },
    { $sort: { subjectName: 1 } },
  ]);

exports.getSubjectsStatsByYear = catchAsync(async (req, res, next) => {
  const { yearId } = req.params;
  const { formId } = req.query;

  const form = formId
    ? await SurveyForm.findOne({ _id: formId, yearId })
    : await SurveyForm.findOne({ yearId }).sort('-createdAt');

  if (!form) {
    return next(new AppError('ما في فورم لهي السنة', 404));
  }

  const totalStudentsResponded = await SurveyResponse.countDocuments({
    formId: form._id,
  });

  const subjects = totalStudentsResponded
    ? await aggregateSubjectsStats(form._id)
    : [];

  return successResponse(res, 200, 'success', {
    yearId,
    formId: form._id,
    academicYear: form.academicYear,
    formStatus: form.status,
    totalStudentsResponded,
    subjects,
  });
});

exports.getSubjectsStatsAllYears = catchAsync(async (req, res, next) => {
  const years = await Year.find().sort('order');

  const result = [];

  for (const year of years) {
    const form = await SurveyForm.findOne({ yearId: year._id }).sort(
      '-createdAt'
    );

    if (!form) {
      result.push({
        yearId: year._id,
        yearName: year.name,
        formId: null,
        totalStudentsResponded: 0,
        subjects: [],
      });
      continue;
    }

    const totalStudentsResponded = await SurveyResponse.countDocuments({
      formId: form._id,
    });

    const subjects = totalStudentsResponded
      ? await aggregateSubjectsStats(form._id)
      : [];

    result.push({
      yearId: year._id,
      yearName: year.name,
      formId: form._id,
      academicYear: form.academicYear,
      totalStudentsResponded,
      subjects,
    });
  }

  return successResponse(res, 200, 'success', result);
});