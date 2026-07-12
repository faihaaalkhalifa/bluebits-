const mongoose = require('mongoose');

const examScheduleSchema = new mongoose.Schema(
  {
    semesterId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Semester',
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    timetable: [
      {
        subjectId: {
          type: mongoose.Schema.ObjectId,
          ref: 'Subject',
          required: true,
        },
        subjectName: String,
        examDate: {
          type: Date,
          required: true,
        },
        timeslot: {
          type: Number,
          required: true,
        },
      },
    ],
    score: {
      hardScore: { type: Number, default: 0 },
      softScore: { type: Number, default: 0 },
      raw: { type: String },
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('ExamSchedule', examScheduleSchema);