const PersonalTask = require('../models/personalTaskModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { successResponse } = require('../utils/response');

exports.createPersonalTask = catchAsync(async (req, res, next) => {
  const task = await PersonalTask.create({
    userId: req.user._id,
    title: req.body.title,
    description: req.body.description,
    dueDate: req.body.dueDate,
  });

  return successResponse(res, 201, 'تم إنشاء المهمة بنجاح', task);
});

exports.getMyPersonalTasks = catchAsync(async (req, res, next) => {
  const filter = { userId: req.user._id };
  if (req.query.isCompleted !== undefined) {
    filter.isCompleted = req.query.isCompleted === 'true';
  }

  const tasks = await PersonalTask.find(filter).sort('-createdAt');

  return successResponse(
    res,
    200,
    `success, number of documents ${tasks.length}`,
    tasks
  );
});

exports.getPersonalTask = catchAsync(async (req, res, next) => {
  const task = await PersonalTask.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });
  if (!task) return next(new AppError('المهمة غير موجودة', 404));
  return successResponse(res, 200, 'success', task);
});

exports.updatePersonalTask = catchAsync(async (req, res, next) => {
  const task = await PersonalTask.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    {
      title: req.body.title,
      description: req.body.description,
      dueDate: req.body.dueDate,
    },
    { new: true, runValidators: true }
  );
  if (!task) return next(new AppError('المهمة غير موجودة', 404));
  return successResponse(res, 200, 'تم تعديل المهمة', task);
});

exports.deletePersonalTask = catchAsync(async (req, res, next) => {
  const task = await PersonalTask.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });
  if (!task) return next(new AppError('المهمة غير موجودة', 404));
  return successResponse(res, 200, 'تم حذف المهمة', null);
});

exports.toggleComplete = catchAsync(async (req, res, next) => {
  const task = await PersonalTask.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });
  if (!task) return next(new AppError('المهمة غير موجودة', 404));

  task.isCompleted = !task.isCompleted;
  task.completedAt = task.isCompleted ? Date.now() : null;
  await task.save();

  return successResponse(
    res,
    200,
    task.isCompleted ? 'تم تحديد المهمة كمنجزة ✅' : 'تم إلغاء إنجاز المهمة',
    task
  );
});