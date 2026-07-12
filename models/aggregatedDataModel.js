const mongoose = require('mongoose');

const aggregatedDataSchema = new mongoose.Schema(
  {
    semesterId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Semester',
      required: true,
      unique: true, 
    },
    examPeriod: {
      type: Object,
      required: true,
    },
    exams: {
      type: Array, 
      required: true,
    },
    conflicts: {
      type: Array,
      required: true,
    },
    metadata: {
      type: Object,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'PENDING', 
    },
  },
  { timestamps: true, versionKey: false }
);

const AggregatedData = mongoose.model('AggregatedData', aggregatedDataSchema);
module.exports = AggregatedData;