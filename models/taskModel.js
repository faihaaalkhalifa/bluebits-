const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please enter the title'],
    },
    description: {
      type: String,
      required: [true, 'Please enter the description'],
    },
    ownerId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Please enter the owner_id'],
    },
    isComplete: {
      type: Boolean,
      default: false,
    },

    taskType: {  
      type: String,
      enum: ['NORMAL', 'DIGITAL'],
      required: true,
      default: 'NORMAL'
    },
    
    subjectName: {
      type: String,
      required: function() { 
        return this.taskType === 'DIGITAL'; 
      }
    },
    
    totalLectures: {
      type: Number,
      required: function() { 
        return this.taskType === 'DIGITAL';
      },
      min: [1, 'Lectures must be at least 1'],
      validate: {
        validator: function(value) {
          return this.taskType !== 'DIGITAL' || value > 0;
        }
      }
    },
    
    totalDays: {
      type: Number,
      required: function() { 
        return this.taskType === 'DIGITAL';
      },
      min: [1, 'Days must be at least 1'],
      max: [365, 'Days cannot exceed 1 year']
    },
    
    dailyStudyHours: {
      type: Number,
      default: 2,
      min: [0.5, 'Minimum 30 minutes per day'],
      max: [8, 'Maximum 8 hours per day']
    },
    
    // =========== الخطة الدراسية ===========
    studyPlan: {
      averageLecturesPerDay: Number,
      maxLecturesPerDay: Number,
      minLecturesPerDay: Number,
      totalStudyHours: Number,
      efficiencyScore: Number,
      
      dailyBreakdown: [{
        day: Number,
        lectures: Number,
        studyHours: Number,
        isIntensive: Boolean,
        isLight: Boolean,
        isRestDay: Boolean
      }],

    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// =========== Virtuals ===========
taskSchema.virtual('isDigital').get(function() {
  return this.taskType === 'DIGITAL';
});

taskSchema.virtual('completionPercentage').get(function() {
  if (this.taskType !== 'DIGITAL' || !this.totalLectures) return 0;
  const completed = this.studyPlan?.dailyBreakdown?.filter(d => d.isComplete)?.length || 0;
  return Math.round((completed / this.totalLectures) * 100);
});

// =========== Middleware ===========
taskSchema.pre('save', function(next) {
  // إذا كانت المهمة عادية، نزيل الحقول الرقمية
  if (this.taskType === 'NORMAL') {
    this.subjectName = undefined;
    this.totalLectures = undefined;
    this.totalDays = undefined;
    this.dailyStudyHours = undefined;
    this.difficultyLevel = undefined;
    this.studyPlan = undefined;
  }
  
  next();
});

const Task = mongoose.model("Task", taskSchema);
module.exports = Task;