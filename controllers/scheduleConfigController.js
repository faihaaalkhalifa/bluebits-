
const axios = require('axios');
const catchAsync = require('../utils/catchAsync');
const ScheduleConfig = require('../models/scheduleConfigModel');
const AppError = require('../utils/appError');
const { successResponse } = require('../utils/response');
exports.createScheduleConfig = catchAsync(async (req, res, next) => {
  const { 
    semesterId, 
    academicYear, 
    startDate, 
    endDate, 
    excludedDates, 
    excludedDaysOfWeek, 
    timeslotsPerDay,
    subjectsConfig 
  } = req.body;

  const existingConfig = await ScheduleConfig.findOne({ semesterId });

  if (existingConfig) {
    return next(
      new AppError(
        'عذراً، تم ضبط إعدادات الجدولة لهذا الفصل مسبقاً. لا يمكنك إنشاء إعدادات جديدة، يرجى استخدام خاصية التعديل لتغيير البيانات الحالية.',
        400 
      )
    );
  }

  
  const newConfig = await ScheduleConfig.create({
    semesterId,
    academicYear,
    startDate,
    endDate,
    excludedDates,
    excludedDaysOfWeek,
    timeslotsPerDay,
    subjectsConfig,
    createdBy: req.user._id, 
  });

  return successResponse(res, 201, 'تم إنشاء إعدادات الجدولة وبيانات المواد بنجاح ', newConfig);
});

exports.getScheduleConfigBySemester = catchAsync(async (req, res, next) => {
  const config = await ScheduleConfig.findOne({ semesterId: req.params.semesterId })
    .populate('semesterId')
    .populate('subjectsConfig.subjectId', 'name yearId'); 

  if (!config) {
    return next(new AppError('لم يتم ضبط إعدادات الجدولة لهذا الفصل بعد.', 404));
  }

  return successResponse(res, 200, 'success', config);
});


exports.updateScheduleConfigById = catchAsync(async (req, res, next) => {
  const { academicYear, startDate, endDate, excludedDates, excludedDaysOfWeek, timeslotsPerDay, subjectsConfig } = req.body;

  const updatedConfig = await ScheduleConfig.findByIdAndUpdate(
    req.params.id,
    {
      academicYear,
      startDate,
      endDate,
      excludedDates,
      excludedDaysOfWeek,
      timeslotsPerDay,
      subjectsConfig,
    },
    {
      new: true, 
      runValidators: true, 
    }
  );

  if (!updatedConfig) {
    return next(new AppError('لم يتم العثور على إعدادات بهذا المعرّف (ID)', 404));
  }

  return successResponse(res, 200, 'تم تعديل إعدادات الجدولة بنجاح ', updatedConfig);
});


exports.deleteScheduleConfigById = catchAsync(async (req, res, next) => {
  const deletedConfig = await ScheduleConfig.findByIdAndDelete(req.params.id);

  if (!deletedConfig) {
    return next(new AppError('لم يتم العثور على إعدادات بهذا المعرّف (ID) لحذفها', 404));
  }


  return successResponse(res, 200, 'تم حذف إعدادات الجدولة بنجاح ', null);
});

exports.triggerScheduling = catchAsync(async (req, res, next) => {
    // احضار بياناتنا اللي جمعتها 
    const scheduleData = await generateAggregatedData(req.params.semesterId);

    // 2. يشتغل شغلو TIMEFOLD
    const response = await axios.post('http://localhost:8080/solve', scheduleData);

    // 3. استقبال الجدول النهائي
    const finalSchedule = response.data;

    // 4.حفظ(ExamSchedule)
    const savedSchedule = await ExamSchedule.create({
        semesterId: req.params.semesterId,
        schedule: finalSchedule
    });

    res.status(200).json({ success: true, data: savedSchedule });
});