const mongoose = require('mongoose');

const taskSubmissionSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.ObjectId,
      ref: 'AcademicTask',
      required: [true, 'التاسك مطلوب'],
    },
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'المستخدم مطلوب'],
    },
    fileUrl: {
      type: String,
      required: [true, 'رابط الملف مطلوب'],
    },
    publicId: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
    },
    note: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewNote: {
      type: String,
      trim: true,
    },
    reviewedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  { timestamps: true, versionKey: false }
);

taskSubmissionSchema.index({ taskId: 1, userId: 1 }, { unique: true });

taskSubmissionSchema.pre(/^find/, function (next) {
  this.populate({ path: 'userId', select: 'name email' });
  next();
});

const TaskSubmission = mongoose.model('TaskSubmission', taskSubmissionSchema);
module.exports = TaskSubmission;