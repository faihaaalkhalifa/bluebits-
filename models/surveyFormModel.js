const mongoose = require('mongoose');

const surveyFormSchema = new mongoose.Schema(
  {
    semesterId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Semester',
      required: [true, 'الفصل الدراسي مطلوب'],
    },

    yearId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Year',
      required: [true, 'السنة الدراسية مطلوبة'],
    },

    academicYear: {
      type: String,
      required: [true, 'العام الدراسي مطلوب'],
      trim: true,
    },

    status: {
      type: String,
      enum: ['draft', 'open', 'closed'],
      default: 'draft',
    },

    openedAt: {
      type: Date,
      default: null,
    },

    closedAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

// ضمان عدم وجود فورمين مفتوحين لنفس السنة + الفصل
surveyFormSchema.index(
  { semesterId: 1, yearId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'open' },
  }
);

surveyFormSchema.pre(/^find/, function (next) {
  this.populate({ path: 'semesterId', select: 'name' })
    .populate({ path: 'yearId', select: 'name order' })
    .populate({ path: 'createdBy', select: 'name email' });
  next();
});

const SurveyForm = mongoose.model('SurveyForm', surveyFormSchema);
module.exports = SurveyForm;