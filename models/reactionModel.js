const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ['like', 'dislike'],
      required: [true, 'نوع التفاعل مطلوب'],
    },
  },
  { timestamps: true, versionKey: false }
);

reactionSchema.index({ userId: 1, lectureId: 1 }, { unique: true });

const Reaction = mongoose.model('Reaction', reactionSchema);
module.exports = Reaction;