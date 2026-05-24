// models/lectureModel.js
const mongoose = require('mongoose');

const lectureSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'عنوان المحاضرة مطلوب'],
      trim: true,
    },
    description: {
      type: String,
    },
    subjectId: {
  type: mongoose.Schema.ObjectId,
  ref: 'Subject',
  required: [true, 'المادة مطلوبة'],
},
  type: {
  type: String,
  enum: ['theoretical', 'practical'],
  required: [true, 'نوع المحاضرة مطلوب'],
},

    uploadedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'رابط الملف مطلوب'],
    },
    publicId: {
      type: String, // مهم للحذف من Cloudinary
      required: true,
    },
    fileSize: {
      type: Number,
    },
    fileType: {
      type: String,
    },
  },
  { timestamps: true, versionKey: false }
);

// Populate تلقائي
lectureSchema.pre(/^find/, function (next) {
  this.populate({ path: 'uploadedBy', select: 'name email' });
  this.populate({ path: 'subjectId', select: 'name' });
  next();
});

const Lecture = mongoose.model('Lecture', lectureSchema);
module.exports = Lecture;