const mongoose = require('mongoose');

// فيحاء هون هي سكيما بقلب سكيما انتبهي يا زيكو
const subjectConfigSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Subject',
      required: [true, 'يجب تحديد المادة'],
    },
    carriedStudentsCount: {
      type: Number,
      default: 0,
      min: [0, 'لا يمكن أن يكون عدد الحملة بالسالب'],
    },
    examDurationOverride: {
      type: Number, 
      default: null,     }
  },
  { _id: false }
);

//  كمان فيحاء هي للمواد الثابتة 
const fixedSubjectSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Subject',
      required: [true, 'يجب تحديد المادة'],
    },
    examDate: {
      type: Date,
      required: [true, 'تاريخ الامتحان مطلوب'],
    },
    timeslot: {
      type: Number,
      required: [true, 'الفترة الزمنية مطلوبة'],
      min: [1, 'الفترة الزمنية يجب أن تبدأ من 1'],
    },
  },
  { _id: false }
);

const scheduleConfigSchema = new mongoose.Schema(
  {
    semesterId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Semester',
      required: [true, 'الفصل الدراسي مطلوب لربط الإعدادات'],
      unique: true, 
    },
    academicYear: {
      type: String,
      required: [true, 'العام الدراسي مطلوب (مثال: 2025-2026)'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'تاريخ بدء الامتحانات مطلوب'],
    },
    endDate: {
      type: Date,
      required: [true, 'تاريخ انتهاء الامتحانات مطلوب'],
    },
    excludedDates: {
      type: [Date],
      default: [], 
    },
    excludedDaysOfWeek: {
      type: [Number],
      default: [5, 6], 
    },
    timeslotsPerDay: {
      type: Number,
      required: [true, 'عدد الفترات الامتحانية في اليوم الواحد مطلوب'],
      min: [1, 'يجب أن تكون هناك فترة واحدة على الأقل باليوم'],
      default: 3, 
    },

    subjectsConfig: {
      type: [subjectConfigSchema],
      default: [],
    },

      fixedSubjects: {
      type: [fixedSubjectSchema],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

scheduleConfigSchema.pre('save', function (next) {
  if (this.endDate <= this.startDate) {
    return next(new Error('تاريخ انتهاء الامتحانات يجب أن يكون بعد تاريخ البدء.'));
  }
  next();
});

const ScheduleConfig = mongoose.model('ScheduleConfig', scheduleConfigSchema);
module.exports = ScheduleConfig;