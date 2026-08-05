const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.ObjectId, ref: 'Question', required: true },
    selectedIndex: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false }
);

const studentAnswerSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    bankId: {
      type: mongoose.Schema.ObjectId,
      ref: 'QuestionBank',
      required: true,
    },
    answers: [answerSchema],
    correctCount: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    scorePercentage: { type: Number, required: true },
  },
  { timestamps: true, versionKey: false }
);

studentAnswerSchema.index({ studentId: 1, bankId: 1 });

const StudentAnswer = mongoose.model('StudentAnswer', studentAnswerSchema);
module.exports = StudentAnswer;