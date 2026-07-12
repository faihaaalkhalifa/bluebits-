const ScheduleConfig = require('../models/scheduleConfigModel');
const SurveyResponse = require('../models/surveyResponseModel');
const SurveyForm = require('../models/surveyFormModel');
const Subject = require('../models/subjectModel');
const AggregatedData = require('../models/aggregatedDataModel'); 
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { successResponse } = require('../utils/response');
// أقرأي هون كرمال التعارضات 
// فرق 0 أو 1 سنة  → HARD   (ممنوع كلياً)
// فرق 2 سنة       → MEDIUM (غير مرغوب)
// فرق 3+ سنة      → SOFT   (مقبول عند الحاجة)
const getConflictType = (yearOrderA, yearOrderB) => {
  const diff = Math.abs(yearOrderA - yearOrderB);
  if (diff <= 1) return 'HARD';
  if (diff === 2) return 'MEDIUM';
  return 'SOFT';
};

exports.generateScheduleData = catchAsync(async (req, res, next) => {
  const { semesterId } = req.params;

  // 1
  const config = await ScheduleConfig.findOne({ semesterId });
  if (!config) {
    return next(new AppError('لم يتم ضبط إعدادات الجدولة لهذا الفصل بعد', 404));
  }

  // 2
  const form = await SurveyForm.findOne({ semesterId }).sort('-createdAt');
  if (!form) {
    return next(new AppError('لا يوجد فورم لهذا الفصل', 404));
  }

  // 3
  const surveyStats = await SurveyResponse.aggregate([
    { $match: { formId: form._id } },
    { $unwind: '$subjectResponses' },
    {
      $group: {
        _id: '$subjectResponses.subjectId',
        totalStudents: { $sum: 1 },
        carryingCount: {
          $sum: { $cond: ['$subjectResponses.isCarrying', 1, 0] },
        },
        avgPreferredDays: { $avg: '$subjectResponses.preferredDaysBefore' },
        avgDifficulty: { $avg: '$subjectResponses.difficultyRating' },
      },
    },
  ]);

  // Map 
  const statsMap = {};
  surveyStats.forEach((s) => {
    statsMap[s._id.toString()] = s;
  });

  // 4
  const subjects = await Subject.find({ semesterId })
    .populate('yearId', 'name order')
    .populate('semesterId', 'name');

  if (subjects.length === 0) {
    return next(new AppError('لا توجد مواد مسجلة لهذا الفصل', 404));
  }

  // 5
  const exams = subjects.map((subject) => {
    const subjectId = subject._id.toString();
    const stats = statsMap[subjectId] || {};

    const adminConfig = config.subjectsConfig?.find(
      (sc) => sc.subjectId.toString() === subjectId
    );

    const carryingCount =
      adminConfig?.carriedStudentsCount ?? stats.carryingCount ?? 0;
    const avgPreferredDays =
      stats.avgPreferredDays ?? subject.studyDaysDefault ?? 3;
    const avgDifficulty =
      stats.avgDifficulty ?? subject.difficultyDefault ?? 3;
    const examDuration =
      adminConfig?.examDurationOverride ?? subject.examDuration ?? 120;

  
    let priority = 'MEDIUM';
    if (avgDifficulty >= 4 || carryingCount > 10) priority = 'HIGH';
    if (avgDifficulty <= 2 && carryingCount <= 3) priority = 'LOW';

    return {
      id: subjectId,
      name: subject.name,
      year: subject.yearId?.name ?? 'Unknown',
      yearOrder: subject.yearId?.order ?? 0,
      semester: subject.semesterId?.name ?? 'Unknown',
      examDuration,
      carryingCount,
      avgPreferredDaysBefore: Math.round((avgPreferredDays) * 10) / 10,
      avgDifficulty: Math.round((avgDifficulty) * 10) / 10,
      priority,
    };
  });


  const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  exams.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

  // 6
  const conflicts = [];

  for (let i = 0; i < exams.length; i++) {
    for (let j = i + 1; j < exams.length; j++) {
      const examA = exams[i];
      const examB = exams[j];

      const conflictType = getConflictType(examA.yearOrder, examB.yearOrder);

      conflicts.push({
        examA: examA.id,
        examAName: examA.name,
        examB: examB.id,
        examBName: examB.name,
        type: conflictType,
      });
    }
  }


  const conflictStats = {
    total: conflicts.length,
    hard: conflicts.filter((c) => c.type === 'HARD').length,
    medium: conflicts.filter((c) => c.type === 'MEDIUM').length,
    soft: conflicts.filter((c) => c.type === 'SOFT').length,
  };

  // 7
  const timefoldPayload = {
    examPeriod: {
      startDate: config.startDate,
      endDate: config.endDate,
      excludedDates: config.excludedDates,
      excludedDaysOfWeek: config.excludedDaysOfWeek,
      timeslotsPerDay: config.timeslotsPerDay,
    },
    exams,
    conflicts,
    metadata: {
      semesterId,
      academicYear: config.academicYear,
      totalExams: exams.length,
      totalResponses: await SurveyResponse.countDocuments({ formId: form._id }),
      conflictStats,
      generatedAt: new Date().toISOString(),
    },
  };

  const savedData = await AggregatedData.findOneAndUpdate(
    { semesterId }, 
    {
      semesterId,
      examPeriod: timefoldPayload.examPeriod,
      exams: timefoldPayload.exams,
      conflicts: timefoldPayload.conflicts,
      metadata: timefoldPayload.metadata,
      status: 'PENDING' 
    },
    { new: true, upsert: true, runValidators: true }
  );

  return successResponse(
    res,
    200,
    'تم تجميع بيانات الجدولة وحفظها في قاعدة البيانات بنجاح ',
    savedData
  );
});