const mongoose = require('mongoose');

const subjectGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'اسم الغروب مطلوب'],
      trim: true,
    },
    yearId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Year',
      required: [true, 'السنة مطلوبة'],
    },
    semesterId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Semester',
      required: [true, 'الفصل مطلوب'],
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

// virtual: كل المواد التابعة لهالغروب
subjectGroupSchema.virtual('subjects', {
  ref: 'Subject',
  localField: '_id',
  foreignField: 'groupId',
});
subjectGroupSchema.set('toJSON', { virtuals: true });
subjectGroupSchema.set('toObject', { virtuals: true });

subjectGroupSchema.pre(/^find/, function (next) {
  this.populate({ path: 'yearId', select: 'name order' })
    .populate({ path: 'semesterId', select: 'name' })
    .populate({ path: 'createdBy', select: 'name email' });
  next();
});

const SubjectGroup = mongoose.model('SubjectGroup', subjectGroupSchema);
module.exports = SubjectGroup;