const mongoose = require('mongoose');

const questionBankSchema = new mongoose.Schema(
  {
    lectureId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Lecture',
      required: [true, 'المحاضرة مطلوبة'],
      unique: true, 
    },
    subjectId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Subject',
      required: true,
    },
    yearId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Year',
      required: true,
    },
    title: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, versionKey: false }
);

questionBankSchema.virtual('questionCount', {
  ref: 'Question',
  localField: '_id',
  foreignField: 'bankId',
  count: true,
});
questionBankSchema.set('toJSON', { virtuals: true });
questionBankSchema.set('toObject', { virtuals: true });

questionBankSchema.pre(/^find/, function (next) {
  this.populate({ path: 'lectureId', select: 'title' })
    .populate({ path: 'subjectId', select: 'name' })
    .populate({ path: 'yearId', select: 'name order' })
    .populate({ path: 'createdBy', select: 'name email' })
    .populate('questionCount');
  next();
});

const QuestionBank = mongoose.model('QuestionBank', questionBankSchema);
module.exports = QuestionBank;