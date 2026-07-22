const mongoose = require('mongoose');

const aiMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'model'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, _id: false }
);

const aiConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'المستخدم مطلوب'],
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    messages: {
      type: [aiMessageSchema],
      default: [],
    },
  },
  { timestamps: true, versionKey: false }
);

aiConversationSchema.index({ userId: 1, updatedAt: -1 });

const AIConversation = mongoose.model('AIConversation', aiConversationSchema);
module.exports = AIConversation;