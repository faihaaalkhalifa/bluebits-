const axios = require('axios');
const ExamSchedule = require('../models/examScheduleModel');
const ScheduleConfig = require('../models/scheduleConfigModel');
const SurveyResponse = require('../models/surveyResponseModel');
const SurveyForm = require('../models/surveyFormModel');
const Subject = require('../models/subjectModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { successResponse } = require('../utils/response');

exports.solveAndSave = catchAsync(async (req, res, next) => {
  const { semesterId, academicYear } = req.body;

 
  const config = await ScheduleConfig.findOne({ semesterId });
  if (!config) return next(new AppError('لم يتم ضبط إعدادات الجدولة لهذا الفصل', 404));


  const form = await SurveyForm.findOne({ semesterId }).sort('-createdAt');
  if (!form) return next(new AppError('لا يوجد فورم لهذا الفصل', 404));

  const surveyStats = await SurveyResponse.aggregate([
    { $match: { formId: form._id } },
    { $unwind: '$subjectResponses' },
    {
      $group: {
        _id: '$subjectResponses.subjectId',
        carryingCount: { $sum: { $cond: ['$subjectResponses.isCarrying', 1, 0] } },
        avgPreferredDays: { $avg: '$subjectResponses.preferredDaysBefore' },
        avgDifficulty: { $avg: '$subjectResponses.difficultyRating' },
      },
    },
  ]);

  const statsMap = {};
  surveyStats.forEach((s) => { statsMap[s._id.toString()] = s; });

 
  const subjects = await Subject.find({ semesterId })
    .populate('yearId', 'name order')
    .populate('semesterId', 'name');

  if (!subjects.length) return next(new AppError('لا توجد مواد لهذا الفصل', 404));


  const exams = subjects.map((subject) => {
    const subjectId = subject._id.toString();
    const stats = statsMap[subjectId] || {};
    const adminConfig = config.subjectsConfig?.find(
      (sc) => sc.subjectId.toString() === subjectId
    );

    const carryingCount = adminConfig?.carriedStudentsCount ?? stats.carryingCount ?? 0;
    const avgPreferredDays = stats.avgPreferredDays ?? 3;
    const avgDifficulty = stats.avgDifficulty ?? 3;

    let priority = 'MEDIUM';
    if (avgDifficulty >= 4 || carryingCount > 10) priority = 'HIGH';
    if (avgDifficulty <= 2 && carryingCount <= 3) priority = 'LOW';

    return {
      id: subjectId,
      name: subject.name,
      yearOrder: subject.yearId?.order ?? 0,
      priority,
      avgPreferredDaysBefore: Math.round(avgPreferredDays),
      carryingCount,
    };
  });

  
  const TIMEFOLD_URL = process.env.TIMEFOLD_API_URL || 'https://exam-solver24.onrender.com';
  let solvedData;
  try {
    const response = await axios.post(TIMEFOLD_URL, {
      examPeriod: {
        startDate: config.startDate,
        endDate: config.endDate,
        excludedDates: config.excludedDates,
        excludedDaysOfWeek: config.excludedDaysOfWeek,
        timeslotsPerDay: config.timeslotsPerDay,
      },
      exams,
    }, { timeout: 65000 });
    solvedData = response.data;
  } catch (error) {
    return next(new AppError(`فشل الاتصال بـ Timefold: ${error.message}`, 500));
  }


  const scoreStr = solvedData.score || '0hard/0medium/0soft';
  const hardScore = parseInt(scoreStr.split('hard')[0]) || 0;
  const softScore = parseInt(scoreStr.split('-').pop()) || 0;

  const timetable = solvedData.exams
    .filter((exam) => exam.examSlot)
    .map((exam) => ({
      subjectId: exam.id,
      subjectName: exam.name,
      examDate: new Date(exam.examSlot.date),
      timeslot: exam.examSlot.slotIndex,
    }));

 
  await ExamSchedule.findOneAndDelete({ semesterId });

  const finalSchedule = await ExamSchedule.create({
    semesterId,
    academicYear,
    status: 'draft',
    timetable,
    score: { hardScore, softScore, raw: scoreStr },
  });

  return successResponse(res, 201, 'تم توليد الجدول وحفظه بنجاح ', finalSchedule);
});




exports.getSchedule = catchAsync(async (req, res, next) => {
  const schedule = await ExamSchedule.findOne({
    semesterId: req.params.semesterId,
  });
  if (!schedule) return next(new AppError('لا يوجد جدول لهذا الفصل', 404));
  return successResponse(res, 200, 'success', schedule);
});



exports.publishSchedule = catchAsync(async (req, res, next) => {
  const schedule = await ExamSchedule.findOneAndUpdate(
    { semesterId: req.params.semesterId },
    { status: 'published' },
    { new: true }
  );
  if (!schedule) return next(new AppError('لا يوجد جدول لهذا الفصل', 404));
  return successResponse(res, 200, 'تم نشر الجدول ', schedule);
});