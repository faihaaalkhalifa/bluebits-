
const axios = require('axios');
const catchAsync = require('../utils/catchAsync');
const ScheduleConfig = require('../models/scheduleConfigModel');
const Subject = require('../models/subjectModel');
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
    subjectsConfig,
    fixedSubjects, 
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

  
  if (Array.isArray(fixedSubjects) && fixedSubjects.length > 0) {
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const excludedDatesSet = new Set(
      (excludedDates || []).map((d) => new Date(d).toISOString().substring(0, 10))
    );
    const excludedDaysSet = new Set(excludedDaysOfWeek || [5, 6]);

    for (const fs of fixedSubjects) {
      if (!fs.subjectId || !fs.examDate || fs.timeslot === undefined) {
        return next(
          new AppError('كل مادة ذات موعد ثابت يجب أن تحتوي على subjectId و examDate و timeslot', 400)
        );
      }

      const subject = await Subject.findById(fs.subjectId);
      if (!subject) {
        return next(new AppError(`المادة ${fs.subjectId} غير موجودة`, 404));
      }

      const examDateObj = new Date(fs.examDate);
      if (examDateObj < startDateObj || examDateObj > endDateObj) {
        return next(
          new AppError(
            `تاريخ امتحان المادة ${subject.name} يجب أن يكون ضمن فترة الامتحانات المحددة`,
            400
          )
        );
      }

      if (fs.timeslot < 1 || fs.timeslot > timeslotsPerDay) {
        return next(
          new AppError(
            `الفترة الزمنية لمادة ${subject.name} يجب أن تكون رقم بين 1 و ${timeslotsPerDay}`,
            400
          )
        );
      }

      
      const dayOfWeek = examDateObj.getUTCDay(); // 0=Sunday ... 6=Saturday
      if (excludedDaysSet.has(dayOfWeek)) {
        return next(
          new AppError(
            `لا يمكن تحديد موعد ثابت لمادة ${subject.name} في يوم مستثنى من فترة الامتحانات (excludedDaysOfWeek)`,
            400
          )
        );
      }

      const examDateKey = examDateObj.toISOString().substring(0, 10);
      if (excludedDatesSet.has(examDateKey)) {
        return next(
          new AppError(
            `لا يمكن تحديد موعد ثابت لمادة ${subject.name} في تاريخ مستثنى صراحة (excludedDates)`,
            400
          )
        );
      }
    }

    
    const subjectIds = fixedSubjects.map((fs) => fs.subjectId);
    const uniqueSubjectIds = new Set(subjectIds);
    if (uniqueSubjectIds.size !== subjectIds.length) {
      return next(new AppError('لا يمكن تكرار نفس المادة أكثر من مرة بقائمة المواد ذات المواعيد الثابتة', 400));
    }
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
    fixedSubjects, 
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
  const { academicYear, startDate, endDate, excludedDates, excludedDaysOfWeek, timeslotsPerDay, subjectsConfig, fixedSubjects } = req.body;

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
      fixedSubjects, // 👈 جديد
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
    const response = await axios.post('https://exam-solver24.onrender.com/api/solve', scheduleData);

    // 3. استقبال الجدول النهائي
    const finalSchedule = response.data;

    // 4.حفظ(ExamSchedule)
    const savedSchedule = await ExamSchedule.create({
        semesterId: req.params.semesterId,
        schedule: finalSchedule
    });

    res.status(200).json({ success: true, data: savedSchedule });
});