const Semester = require('../models/semesterModel');
const factory = require('../utils/handlerFactory');

exports.getAllSemesters = factory.getAll(Semester);
exports.getSemester = factory.getOne(Semester);
exports.createSemester = factory.createOne(Semester);
exports.updateSemester = factory.updateOne(Semester);
exports.deleteSemester = factory.deleteOne(Semester);