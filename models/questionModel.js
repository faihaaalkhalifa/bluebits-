const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema(
  {
    text: { type: String, required: [true, 'نص الخيار مطلوب'], trim: true },
    isCorrect: { type: Boolean, required: true, default: false },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    bankId: {
      type: mongoose.Schema.ObjectId,
      ref: 'QuestionBank',
      required: [true, 'بنك الأسئلة مطلوب'],
    },
    type: {
      type: String,
      enum: ['mcq', 'true_false'],
      required: [true, 'نوع السؤال مطلوب'],
    },
    questionText: {
      type: String,
      required: [true, 'نص السؤال مطلوب'],
      trim: true,
    },
    options: {
      type: [optionSchema],
      validate: {
        validator: function (options) {
          if (this.type === 'mcq') return options.length === 4;
          if (this.type === 'true_false') return options.length === 2;
          return false;
        },
        message: 'عدد الخيارات غير صحيح لنوع السؤال (4 خيارات MCQ، خيارين لصح/خطأ)',
      },
    },
    explanation: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true, versionKey: false }
);

questionSchema.pre('validate', function (next) {
  if (this.options && this.options.length) {
    const correctCount = this.options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      return next(
        new Error('يجب أن يكون هناك إجابة صحيحة واحدة بالضبط لكل سؤال')
      );
    }
  }
  next();
});

questionSchema.index({ bankId: 1 });

const Question = mongoose.model('Question', questionSchema);
module.exports = Question;