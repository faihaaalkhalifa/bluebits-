const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'عنوان الإعلان مطلوب'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'محتوى الإعلان مطلوب'],
      trim: true,
    },
    image: {
      type: String,
    },
    yearId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Year',
      required: [true, 'يجب تحديد الدفعة المستهدفة بالإعلان'],
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

announcementSchema.pre(/^find/, function (next) {
  this.populate({ path: 'yearId', select: 'name order' })
    .populate({ path: 'createdBy', select: 'name email' });
  next();
});

const Announcement = mongoose.model('Announcement', announcementSchema);
module.exports = Announcement;