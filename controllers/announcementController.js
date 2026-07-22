const Announcement = require('../models/announcementModel');
const factory = require('../utils/handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { successResponse } = require('../utils/response');

exports.setCreatedBy = (req, res, next) => {
  req.body.createdBy = req.user._id;
  next();
};

exports.createAnnouncement = factory.createOne(Announcement);
exports.getAnnouncement = factory.getOne(Announcement);
exports.updateAnnouncement = factory.updateOne(Announcement);
exports.deleteAnnouncement = factory.deleteOne(Announcement);
exports.getAllAnnouncements = factory.getAll(Announcement);

exports.getMyAnnouncements = catchAsync(async (req, res, next) => {
  if (!req.user.yearId) {
    return next(new AppError('لا تنتمي لأي دفعة حالياً', 400));
  }

  const announcements = await Announcement.find({
    yearId: req.user.yearId,
  }).sort('-createdAt');

  if (announcements.length === 0) {
    return successResponse(res, 200, 'لا يوجد لدفعتك اعلانات', []);
  }

  return successResponse(
    res,
    200,
    `success, number of documents ${announcements.length}`,
    announcements
  );
});