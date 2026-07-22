const { GoogleGenAI } = require('@google/genai');
const AIConversation = require('../models/aiConversationModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { successResponse } = require('../utils/response');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `
أنت مساعد ذكاء اصطناعي اسمك "بلوبتس رفيق الدرب و تتكلم المستخدمين بأنو هنن بشمهندسين" داخل منصة تعليمية اسمها BlueBits.
- جاوب بالعربية دائماً ما لم يطلب المستخدم لغة أخرى صراحة.
- كن ودوداً ومفصلاً وواضحاً في شرحك.
- إذا سُئلت عن أمور دينية بسيطة (متل: كيف أصلي، أذكار، إلخ) جاوب بمعلومات عامة صحيحة دون التنطع بالفتوى.
- إذا كان السؤال يحتاج تفصيل خطوات، رتبه بشكل مرقم وواضح.
`

const makeTitle = (text) =>
  text.length > 40 ? `${text.slice(0, 40)}...` : text;

exports.askAI = catchAsync(async (req, res, next) => {
  const { question, conversationId } = req.body;

  if (!question || !question.trim()) {
    return next(new AppError('يرجى إدخال سؤال', 400));
  }

  let conversation;

  if (conversationId) {
    conversation = await AIConversation.findOne({
      _id: conversationId,
      userId: req.user._id,
    });

    if (!conversation) {
      return next(new AppError('المحادثة غير موجودة', 404));
    }
  } else {
    conversation = await AIConversation.create({
      userId: req.user._id,
      title: makeTitle(question.trim()),
      messages: [],
    });
  }

  const contents = conversation.messages.map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.content }],
  }));

  contents.push({ role: 'user', parts: [{ text: question }] });

  const response = await ai.models.generateContent({
    model: 'gemini-flash-latest',
    contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
  });

  const answer = response.text;

  // نضيف السؤال والجواب للمحادثة ونحفظ
  conversation.messages.push({ role: 'user', content: question });
  conversation.messages.push({ role: 'model', content: answer });
  await conversation.save();

  return successResponse(res, 200, 'success', {
    conversationId: conversation._id,
    title: conversation.title,
    question,
    answer,
  });
});

exports.getMyConversations = catchAsync(async (req, res, next) => {
  const conversations = await AIConversation.find({ userId: req.user._id })
    .select('title createdAt updatedAt')
    .sort('-updatedAt');

  return successResponse(
    res,
    200,
    `success, number of documents ${conversations.length}`,
    conversations
  );
});

exports.getConversation = catchAsync(async (req, res, next) => {
  const conversation = await AIConversation.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!conversation) {
    return next(new AppError('المحادثة غير موجودة', 404));
  }

  return successResponse(res, 200, 'success', conversation);
});

exports.deleteConversation = catchAsync(async (req, res, next) => {
  const conversation = await AIConversation.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!conversation) {
    return next(new AppError('المحادثة غير موجودة', 404));
  }

  return successResponse(res, 200, 'تم حذف المحادثة', null);
});