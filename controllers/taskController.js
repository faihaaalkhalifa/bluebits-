const Task = require("../models/taskModel");
const AppError = require("../utils/appError");
const handlerFactory = require("../utils/handlerFactory");
const catchAsync = require("../utils/catchAsync");
const path = require("path");
exports.getTask = handlerFactory.getOne(Task);
exports.updateTask = handlerFactory.updateOne(Task);
exports.deleteTask = handlerFactory.deleteOne(Task);
exports.getAllTask = handlerFactory.getAll(Task);
exports.getMyTask=catchAsync(async(req,res,next)=>
{
    const doc= await Task.find({
        ownerId:{$eq:req.user._id},
    })
    res.status(200).json({
        status:'success',
        doc,
    });
});
exports.getMyCompletedTask=catchAsync(async(req,res,next)=>
{
    const doc= await Task.find({
        ownerId:{$eq:req.user._id},
        isComplete:'true'
    })
    res.status(200).json({
        status:'success',
        doc,
    });
});
exports.getMyNotCompletedTask=catchAsync(async(req,res,next)=>
{
    const doc= await Task.find({
        ownerId:{$eq:req.user._id},
        isComplete:'false'
    })
    res.status(200).json({
        status:'success',
        doc,
    });
});
exports.Completed = catchAsync(async (req, res, next) => {
    // تجد المهمة أولاً
    const task = await Task.findOne(req.params._id);
    
    if (!task) {
        return next(new AppError('No task found with that ID', 404));
    }
    
    // تبديل حالة isComplete
    task.isComplete = !task.isComplete;
    
    // حفظ التغييرات
    const doc = await task.save();
    
    res.status(200).json({
        isSuccess: true,
        message: 'Task status updated successfully',
        doc
    });
});
exports.createTask = catchAsync(async (req, res, next) => {
  const { taskType = 'NORMAL' } = req.body;

  // التحقق من النوع
  if (!['NORMAL', 'DIGITAL'].includes(taskType)) {
    return next(new AppError('Task type must be either NORMAL or DIGITAL', 400));
  }

  let taskData = { ...req.body, ownerId: req.user._id };

  // إذا كانت المهمة رقمية
  if (taskType === 'DIGITAL') {
    const { subjectName, totalLectures, totalDays, dailyStudyHours = 2 } = taskData;
    
    // التحقق من المدخلات المطلوبة
    if (!subjectName || !totalLectures || !totalDays) {
      return next(new AppError(
        'Digital tasks require subjectName, totalLectures, and totalDays',
        400
      ));
    }

    // توليد الخطة الدراسية
    try {
      const studyPlan = generateStudyPlan(totalLectures, totalDays, dailyStudyHours);
      taskData.studyPlan = studyPlan;
    } catch (error) {
      console.error('Error generating study plan:', error);
      return next(new AppError('Failed to generate study plan', 500));
    }
  }

  try {
    // إنشاء المهمة
    const task = await Task.create(taskData);

    // إعداد الاستجابة
    let responseMessage, responseData;
    
    if (taskType === 'DIGITAL') {
      responseMessage =  ' ☹️نمضي الليل نقلب في دفاترنا    و الدمع على الخدين ينسكب';
      responseData = {
        task: {
          _id: task._id,
          title: task.title,
          subjectName: task.subjectName,
          isComplete:task.isComplete,
          taskType: task.taskType,
          studyPlan: task.studyPlan
        }
      };
    } else {
      responseMessage ='☹️ما كل ما يدرسه المرء يدركه    تأتي الامتحانات بما لا تحتوي الكتب ';
      responseData = { 
        task: {
          _id: task._id,
          title: task.title,
          description: task.description,
          taskType: task.taskType,
          isComplete: task.isComplete
        }
      };
    }

    res.status(201).json({
      isSuccess: true,
      message: responseMessage,
      data: responseData
    });
  } catch (error) {
    console.error('Error creating task:', error);
    
    // معالجة أخطاء التحقق من Mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return next(new AppError(`Validation failed: ${messages.join(', ')}`, 400));
    }
    
    next(error);
  }
});

// =========== دوال الخوارزميات ===========
function generateStudyPlan(totalLectures, totalDays, dailyStudyHours) {
  const averageLecturesPerDay = Math.ceil(totalLectures / totalDays);
  
  const plan = {
    averageLecturesPerDay: averageLecturesPerDay,
    totalStudyHours: totalLectures * dailyStudyHours,
    dailyBreakdown: [],
    schedule: [] 
  };

  //  توزيع المحاضرات على الأيام
  let lecturesPerDay = [];
  let remaining = totalLectures;
  
  for (let day = 0; day < totalDays; day++) {
    const target = averageLecturesPerDay;
    const lectures = Math.min(target, remaining);
    
    lecturesPerDay.push(lectures);
    remaining -= lectures;
    
    if (remaining <= 0) {
      // ملء باقي الأيام بصفر
      while (lecturesPerDay.length < totalDays) {
        lecturesPerDay.push(0);
      }
      break;
    }
  }

  // 🔄 إنشاء dailyBreakdown
  for (let i = 0; i < lecturesPerDay.length; i++) {
    const lectures = lecturesPerDay[i];
    plan.dailyBreakdown.push({
      day: i + 1,
      lectures: lectures,
      studyHours: lectures * dailyStudyHours,
      isRestDay: lectures === 0
    });
    
    plan.schedule.push({
      day: i + 1,
      lectures: lectures,
      message: lectures > 0 
        ? `Study ${lectures} lecture(s) today` 
        : 'Rest day'
    });
  }

  return plan;
}