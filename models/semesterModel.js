const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'اسم الفصل مطلوب'],
      trim: true,
      unique: true,
      // "Semester 1" | "Semester 2"
    },
  },
  { timestamps: true, versionKey: false }
);

const Semester = mongoose.model('Semester', semesterSchema);
module.exports = Semester;