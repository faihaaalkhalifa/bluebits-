const Subject = require('../models/subjectModel');
const factory = require('../utils/handlerFactory');
const catchAsync = require('../utils/catchAsync');
const { successResponse } = require('../utils/response');

exports.setCreatedBy = (req, res, next) => {
  req.body.createdBy = req.user._id;
  next();
};

exports.getAllSubjects = factory.getAll(Subject);
exports.getSubject = factory.getOne(Subject);
exports.createSubject = factory.createOne(Subject);
exports.updateSubject = factory.updateOne(Subject);
exports.deleteSubject = factory.deleteOne(Subject);