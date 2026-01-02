const mongoose = require("mongoose");
const taskSchema = new mongoose.Schema(
  {
    title: {
            type: String,
             required: [true, 'Please enter the title '],
 }
,
    description: {
            type: String,
             required: [true, 'Please enter the description'],
}
,

    ownerId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
                required: [true, 'Please enter the owner_id'],
 },
 isComplete: {
      type: Boolean,
      default: false,
    },

},
{
    timestamps: true,
    versionKey: false,

  }
  

);

const Task = mongoose.model("Task", taskSchema);
module.exports = Task;
