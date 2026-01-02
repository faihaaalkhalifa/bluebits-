const Task = require("../models/taskModel");
const AppError = require("../utils/appError");
const handlerFactory = require("../utils/handlerFactory");
const catchAsync = require("../utils/catchAsync");
const path = require("path");
exports.getTask = handlerFactory.getOne(Task);
exports.createTask = handlerFactory.createOne(Task);
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
