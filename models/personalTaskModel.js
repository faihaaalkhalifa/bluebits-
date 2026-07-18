const mongoose = require('mongoose');

const personalTaskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'المستخدم مطلوب'],
    },
    title: {
      type: String,
      required: [true, 'عنوان المهمة مطلوب'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    dueDate: {
      type: Date,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, versionKey: false }
);

personalTaskSchema.index({ userId: 1, isCompleted: 1 });

const PersonalTask = mongoose.model('PersonalTask', personalTaskSchema);
module.exports = PersonalTask;