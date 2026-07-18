const mongoose = require('mongoose');

const academicTaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'عنوان التاسك مطلوب'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    yearId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Year',
      required: [true, 'السنة مطلوبة'],
    },
    subjectId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Subject',
      required: [true, 'المادة مطلوبة'],
    },
    lectureId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Lecture',
      required: [true, 'المحاضرة مطلوبة'],
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    durationDays: { type: Number, default: 0, min: 0 },
    durationHours: { type: Number, default: 0, min: 0 },
    durationMinutes: { type: Number, default: 0, min: 0 },
    opensAt: {
      type: Date,
      default: Date.now,
    },
    closesAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
  },
  { timestamps: true, versionKey: false }
);

//closesAt تلقائياً وقت الإنشاء فقط (التعديلات اللاحقة بتصير من الكنترولر)
academicTaskSchema.pre('validate', function (next) {
  if (this.isNew) {
    const ms =
      (this.durationDays || 0) * 24 * 60 * 60 * 1000 +
      (this.durationHours || 0) * 60 * 60 * 1000 +
      (this.durationMinutes || 0) * 60 * 1000;
    this.opensAt = this.opensAt || new Date();
    this.closesAt = new Date(this.opensAt.getTime() + ms);
  }
  next();
});

academicTaskSchema.pre(/^find/, function (next) {
  this.populate({ path: 'yearId', select: 'name order' })
    .populate({ path: 'subjectId', select: 'name' })
    .populate({ path: 'lectureId', select: 'title' })
    .populate({ path: 'createdBy', select: 'name email' });
  next();
});

const AcademicTask = mongoose.model('AcademicTask', academicTaskSchema);
module.exports = AcademicTask;