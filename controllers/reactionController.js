const Reaction = require('../models/reactionModel');
const catchAsync = require('../utils/catchAsync');
const { successResponse } = require('../utils/response');

// إضافة أو تغيير أو إلغاء تفاعل
exports.toggleReaction = catchAsync(async (req, res, next) => {
  const { type } = req.body;
  const lectureId = req.params.lectureId;

  const existing = await Reaction.findOne({
    userId: req.user._id,
    lectureId,
  });

  // نفس النوع روح احذفو (toggle off)
  if (existing && existing.type === type) {
    await Reaction.findByIdAndDelete(existing._id);
    return successResponse(res, 200, 'تم إلغاء التفاعل', null);
  }

  // نوع مختلف روح عدلو
  if (existing) {
    existing.type = type;
    await existing.save();
    return successResponse(res, 200, 'تم تغيير التفاعل', existing);
  }

  // جديد روح أنشئ
  const reaction = await Reaction.create({
    userId: req.user._id,
    lectureId,
    type,
  });

  return successResponse(res, 201, 'تم إضافة التفاعل بنجاح', reaction);
});

exports.getLectureReactions = catchAsync(async (req, res, next) => {
  const { lectureId } = req.params;

  const likes = await Reaction.countDocuments({ lectureId, type: 'like' });
  const dislikes = await Reaction.countDocuments({ lectureId, type: 'dislike' });

  const userReaction = await Reaction.findOne({
    userId: req.user._id,
    lectureId,
  });

  return successResponse(res, 200, 'success', {
    likes,
    dislikes,
    userReaction: userReaction ? userReaction.type : null,
  });
});