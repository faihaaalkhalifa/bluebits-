const mongoose = require('mongoose');

const yearSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'اسم السنة مطلوب'],
      trim: true,
      unique: true,
      // "Year 1" | "Year 2" | ...
    },
    order: {
      type: Number,
      required: [true, 'ترتيب السنة مطلوب'],
    },
  },
  { timestamps: true, versionKey: false }
);

const Year = mongoose.model('Year', yearSchema);
module.exports = Year;