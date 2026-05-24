const Year = require('../models/yearModel');
const factory = require('../utils/handlerFactory');

exports.getAllYears = factory.getAll(Year);
exports.getYear = factory.getOne(Year);
exports.createYear = factory.createOne(Year);
exports.updateYear = factory.updateOne(Year);
exports.deleteYear = factory.deleteOne(Year);