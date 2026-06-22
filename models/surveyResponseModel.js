const mongoose = require('mongoose');

const subjectResponseSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Subject',
      required: [true, 'المادة مطلوبة'],
    },

    isCarrying: {
      type: Boolean,
      required: [true, 'يرجى تحديد إذا كنت حاملاً للمادة'],
    },

    preferredDaysBefore: {
      type: Number,
      required: [true, 'يرجى تحديد عدد الأيام المطلوبة للمذاكرة'],
      min: [1, 'الحد الأدنى يوم واحد'],
      max: [14, 'الحد الأقصى 14 يوم'],
    },

    difficultyRating: {
      type: Number,
      required: [true, 'يرجى تقييم صعوبة المادة'],
      min: [1, 'الحد الأدنى 1'],
      max: [5, 'الحد الأقصى 5'],
    },
  },
  { _id: false } // ما نحتاج _id لكل مادة داخل المصفوفة
);

const surveyResponseSchema = new mongoose.Schema(
  {
    formId: {
      type: mongoose.Schema.ObjectId,
      ref: 'SurveyForm',
      required: [true, 'الفورم مطلوب'],
    },

    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'المستخدم مطلوب'],
    },

    yearId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Year',
      required: [true, 'السنة الدراسية مطلوبة'],
    },

    semesterId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Semester',
      required: [true, 'الفصل الدراسي مطلوب'],
    },
    subjectResponses: {
      type: [subjectResponseSchema],
      validate: {
        validator: function (arr) {
          return arr && arr.length > 0;
        },
        message: 'يجب إدخال رد على مادة واحدة على الأقل',
      },
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true, versionKey: false }
);

surveyResponseSchema.index({ formId: 1, userId: 1 }, { unique: true });

surveyResponseSchema.pre(/^find/, function (next) {
  this.populate({ path: 'userId', select: 'name email year' })
    .populate({ path: 'yearId', select: 'name order' })
    .populate({ path: 'semesterId', select: 'name' })
    .populate({ path: 'subjectResponses.subjectId', select: 'name' });
  next();
});
const SurveyResponse = mongoose.model('SurveyResponse', surveyResponseSchema);
module.exports = SurveyResponse;