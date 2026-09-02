const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'اسم المادة مطلوب'],
      trim: true,
    },

  
    // FK → Year
  yearId: {
  type: mongoose.Schema.ObjectId,
  ref: 'Year',
  required: [true, 'السنة مطلوبة'],
},

    // FK → Semester
   semesterId: {
  type: mongoose.Schema.ObjectId,
  ref: 'Semester',
  required: [true, 'الفصل مطلوب'],
},

    // FK → Department
    //departmentId: {
      //type: mongoose.Schema.ObjectId,
      //ref: 'Department',
    //},

     groupId: {
      type: mongoose.Schema.ObjectId,
      ref: 'SubjectGroup',
      default: null,
    },

     description: {
      type: String,
    },
    
    difficultyDefault: {
      type: Number,
      min: 1,
      max: 5,
    },

    studyDaysDefault: {
      type: Number,
    },

    examDuration: {
      type: Number, // بالدقائق
    },

    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },

     lecturerIds: {
      type: [
        {
          type: mongoose.Schema.ObjectId,
          ref: 'User',
        },
      ],
      default: [],
    },
  },
  { timestamps: true, versionKey: false }
);

subjectSchema.pre(/^find/, function (next) {
  this.populate({ path: 'yearId', select: 'name order' })
      .populate({ path: 'semesterId', select: 'name' })
      .populate({ path: 'createdBy', select: 'name email' })
      .populate({ path: 'lecturerIds', select: 'name email role' })
      .populate({ path: 'groupId', select: 'name' }); 
  next();
})

const Subject = mongoose.model('Subject', subjectSchema);
module.exports = Subject;