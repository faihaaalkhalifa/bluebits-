const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'المستخدم مطلوب'],
    },
    lectureId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Lecture',
      required: [true, 'المحاضرة مطلوبة'],
    },
    content: {
      type: String,
      required: [true, 'محتوى التعليق مطلوب'],
      trim: true,
      maxlength: [500, 'نحترم رأيك بس بكفي 500 حرف 🙂'],
    },
  },
  { timestamps: true, versionKey: false }
);

commentSchema.pre(/^find/, function (next) {
  this.populate({ path: 'userId', select: 'name profile_image' });
  next();
});

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;