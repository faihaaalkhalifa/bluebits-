const multer = require('multer');
const QuestionBank = require('../models/questionBankModel');
const Question = require('../models/questionModel');
const StudentAnswer = require('../models/studentAnswerModel');
const Lecture = require('../models/lectureModel');
const Subject = require('../models/subjectModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { successResponse } = require('../utils/response');
const { docxBufferToQuestions } = require('../utils/docxToQuestions');

// multer middleware 
exports.uploadDocxMiddleware = multer({ storage: multer.memoryStorage() }).single('file');


const REVIEW_ROLES = ['ADMIN', 'DOCTOR', 'SUPER_ADMIN'];


const stripCorrectAnswers = (questions) =>
  questions.map((q) => {
    const obj = q.toObject ? q.toObject() : q;
    return {
      ...obj,
      options: obj.options.map(({ text }) => ({ text })),
    };
  });


const getOrCreateBank = async (lectureId, userId) => {
  const lecture = await Lecture.findById(lectureId);
  if (!lecture) throw new AppError('المحاضرة غير موجودة', 404);

  const existing = await QuestionBank.findOne({ lectureId });
  if (existing) return existing;

  const subjectId = lecture.subjectId._id || lecture.subjectId;
  const subject = await Subject.findById(subjectId);
  if (!subject) throw new AppError('المادة الخاصة بهذه المحاضرة غير موجودة', 404);

  const yearId = subject.yearId._id || subject.yearId;

  return QuestionBank.create({
    lectureId,
    subjectId: subject._id,
    yearId,
    title: lecture.title,
    createdBy: userId,
  });
};

/**
 * body: { lectureId, questions: [ {type, questionText, options|correctAnswer, explanation} ] }
 */
exports.bulkUploadQuestions = catchAsync(async (req, res, next) => {
  const { lectureId, questions } = req.body;

  if (!lectureId) return next(new AppError('يجب تحديد المحاضرة (lectureId)', 400));
  if (!Array.isArray(questions) || questions.length === 0) {
    return next(new AppError('يجب إرسال مصفوفة أسئلة غير فارغة', 400));
  }

  const bank = await getOrCreateBank(lectureId, req.user._id);

  const docsToInsert = questions.map((q) => {
    let options = q.options;
    if (q.type === 'true_false' && !options) {
      options = [
        { text: 'صح', isCorrect: q.correctAnswer === true },
        { text: 'خطأ', isCorrect: q.correctAnswer === false },
      ];
    }
    return {
      bankId: bank._id,
      type: q.type,
      questionText: q.questionText,
      options,
      explanation: q.explanation,
      createdBy: req.user._id,
    };
  });

  let created;
  try {
    created = await Question.insertMany(docsToInsert, { ordered: true });
  } catch (err) {
    return next(new AppError(`فشل رفع الأسئلة، تأكد من صيغة الملف: ${err.message}`, 400));
  }

  if (bank.status === 'published') {
    bank.status = 'draft';
    bank.publishedAt = null;
    await bank.save();
  }

  return successResponse(
    res,
    201,
    `تم رفع ${created.length} سؤال إلى بنك الأسئلة بنجاح (بانتظار المراجعة والنشر)`,
    { bank, questionsCount: created.length }
  );
});


exports.uploadDocx = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError('يجب رفع ملف Word (.docx)', 400));

  const { lectureId } = req.body;
  if (!lectureId) return next(new AppError('يجب تحديد المحاضرة (lectureId)', 400));

  const questions = await docxBufferToQuestions(req.file.buffer);
  if (!questions.length) {
    return next(
      new AppError(
        'لم يتم العثور على أي أسئلة بالملف، تأكد إنو الملف ملتزم بالصيغة المطلوبة',
        400
      )
    );
  }

  const bank = await getOrCreateBank(lectureId, req.user._id);

  const docsToInsert = questions.map((q) => ({
    bankId: bank._id,
    type: q.type,
    questionText: q.questionText,
    options: q.options,
    explanation: q.explanation,
    createdBy: req.user._id,
  }));

  let created;
  try {
    created = await Question.insertMany(docsToInsert, { ordered: true });
  } catch (err) {
    return next(
      new AppError(
        `تم استخراج ${questions.length} سؤال من الملف لكن فشل حفظهم، راجع الصيغة: ${err.message}`,
        400
      )
    );
  }

  if (bank.status === 'published') {
    bank.status = 'draft';
    bank.publishedAt = null;
    await bank.save();
  }

  return successResponse(
    res,
    201,
    `تم استخراج ورفع ${created.length} سؤال من ملف الوورد مباشرة (بانتظار المراجعة)`,
    { bank, questions: created }
  );
});

exports.getBankByLecture = catchAsync(async (req, res, next) => {
  const bank = await QuestionBank.findOne({ lectureId: req.params.lectureId });
  if (!bank) return next(new AppError('لا يوجد بنك أسئلة لهذه المحاضرة بعد', 404));

  if (bank.status !== 'published' && !REVIEW_ROLES.includes(req.user.role)) {
    return next(new AppError('هذا البنك غير منشور بعد', 403));
  }

  const questions = await Question.find({ bankId: bank._id }).sort('createdAt');
  const payload = REVIEW_ROLES.includes(req.user.role)
    ? questions
    : stripCorrectAnswers(questions);

  return successResponse(res, 200, 'success', { bank, questions: payload });
});


exports.getBank = catchAsync(async (req, res, next) => {
  const bank = await QuestionBank.findById(req.params.id);
  if (!bank) return next(new AppError('بنك الأسئلة غير موجود', 404));

  if (bank.status !== 'published' && !REVIEW_ROLES.includes(req.user.role)) {
    return next(new AppError('هذا البنك غير منشور بعد', 403));
  }

  const questions = await Question.find({ bankId: bank._id }).sort('createdAt');
  const payload = REVIEW_ROLES.includes(req.user.role)
    ? questions
    : stripCorrectAnswers(questions);

  return successResponse(res, 200, 'success', { bank, questions: payload });
});

exports.getBanksBySubject = catchAsync(async (req, res, next) => {
  const filter = { subjectId: req.params.subjectId };
  if (!REVIEW_ROLES.includes(req.user.role)) filter.status = 'published';

  const banks = await QuestionBank.find(filter).sort('-createdAt');
  return successResponse(res, 200, `success, number of documents ${banks.length}`, banks);
});

exports.getBanksByYear = catchAsync(async (req, res, next) => {
  const filter = { yearId: req.params.yearId };
  if (!REVIEW_ROLES.includes(req.user.role)) filter.status = 'published';

  const banks = await QuestionBank.find(filter).sort('-createdAt');
  return successResponse(res, 200, `success, number of documents ${banks.length}`, banks);
});


exports.updateQuestion = catchAsync(async (req, res, next) => {
  const { questionText, options, explanation, type } = req.body;
  const question = await Question.findById(req.params.questionId);
  if (!question) return next(new AppError('السؤال غير موجود', 404));

  if (questionText !== undefined) question.questionText = questionText;
  if (explanation !== undefined) question.explanation = explanation;
  if (type !== undefined) question.type = type;
  if (options !== undefined) question.options = options;

  await question.save();

  // أي تعديل بعد النشر يرجّع البنك مسودة لإعادة المراجعة
  const bank = await QuestionBank.findById(question.bankId);
  if (bank && bank.status === 'published') {
    bank.status = 'draft';
    bank.publishedAt = null;
    await bank.save();
  }

  return successResponse(res, 200, 'تم تعديل السؤال بنجاح', question);
});


exports.deleteQuestion = catchAsync(async (req, res, next) => {
  const question = await Question.findByIdAndDelete(req.params.questionId);
  if (!question) return next(new AppError('السؤال غير موجود', 404));
  return successResponse(res, 200, 'تم حذف السؤال بنجاح', null);
});


exports.publishBank = catchAsync(async (req, res, next) => {
  const bank = await QuestionBank.findById(req.params.id);
  if (!bank) return next(new AppError('بنك الأسئلة غير موجود', 404));

  const count = await Question.countDocuments({ bankId: bank._id });
  if (count === 0) return next(new AppError('لا يمكن نشر بنك لا يحتوي على أسئلة', 400));

  bank.status = 'published';
  bank.publishedAt = Date.now();
  await bank.save();

  return successResponse(res, 200, 'تم نشر بنك الأسئلة للطلاب بنجاح', bank);
});


exports.unpublishBank = catchAsync(async (req, res, next) => {
  const bank = await QuestionBank.findByIdAndUpdate(
    req.params.id,
    { status: 'draft', publishedAt: null },
    { new: true }
  );
  if (!bank) return next(new AppError('بنك الأسئلة غير موجود', 404));
  return successResponse(res, 200, 'تم إرجاع البنك لحالة المسودة', bank);
});


exports.deleteBank = catchAsync(async (req, res, next) => {
  const bank = await QuestionBank.findByIdAndDelete(req.params.id);
  if (!bank) return next(new AppError('بنك الأسئلة غير موجود', 404));
  await Question.deleteMany({ bankId: bank._id });
  return successResponse(res, 200, 'تم حذف بنك الأسئلة وجميع أسئلته', null);
});


exports.submitAnswers = catchAsync(async (req, res, next) => {
  const bank = await QuestionBank.findById(req.params.id);
  if (!bank) return next(new AppError('بنك الأسئلة غير موجود', 404));
  if (bank.status !== 'published') {
    return next(new AppError('لا يمكن الحل، هذا البنك غير منشور بعد', 403));
  }

  const { answers } = req.body;
  if (!Array.isArray(answers) || answers.length === 0) {
    return next(new AppError('يجب إرسال إجاباتك', 400));
  }

  const questions = await Question.find({ bankId: bank._id });
  const questionsMap = new Map(questions.map((q) => [String(q._id), q]));

  const details = [];
  let correctCount = 0;

  answers.forEach(({ questionId, selectedIndex }) => {
    const question = questionsMap.get(String(questionId));
    if (!question) return;

    const selectedOption = question.options[selectedIndex];
    const correctIndex = question.options.findIndex((o) => o.isCorrect);
    const isCorrect = !!selectedOption && selectedOption.isCorrect === true;
    if (isCorrect) correctCount += 1;

    details.push({
      questionId: question._id,
      questionText: question.questionText,
      selectedIndex,
      isCorrect,
      correctIndex, 
    });
  });

  const totalQuestions = questions.length;
  const scorePercentage = totalQuestions
    ? Math.round((correctCount / totalQuestions) * 100)
    : 0;

  const attempt = await StudentAnswer.create({
    studentId: req.user._id,
    bankId: bank._id,
    answers: details.map(({ questionId, selectedIndex, isCorrect }) => ({
      questionId,
      selectedIndex,
      isCorrect,
    })),
    correctCount,
    totalQuestions,
    scorePercentage,
  });

  return successResponse(res, 201, 'تم تصحيح إجاباتك بنجاح', {
    attemptId: attempt._id,
    correctCount,
    totalQuestions,
    scorePercentage,
    details,
  });
});


exports.getMyAttempts = catchAsync(async (req, res, next) => {
  const attempts = await StudentAnswer.find({
    studentId: req.user._id,
    bankId: req.params.id,
  }).sort('-createdAt');

  return successResponse(res, 200, `success, number of documents ${attempts.length}`, attempts);
});


exports.getBankResults = catchAsync(async (req, res, next) => {
  const attempts = await StudentAnswer.find({ bankId: req.params.id })
    .populate({ path: 'studentId', select: 'name email' })
    .sort('-createdAt');

  return successResponse(res, 200, `success, number of documents ${attempts.length}`, attempts);
});

exports.getAllBanksSortedByYearOrder = catchAsync(async (req, res, next) => {
  const filter = {};
  if (!REVIEW_ROLES.includes(req.user.role)) filter.status = 'published';

  if (req.query.subjectId) filter.subjectId = req.query.subjectId;

  
  const banks = await QuestionBank.find(filter);


  const sortedBanks = banks.sort((a, b) => {
    const orderA = a.yearId?.order ?? 0;
    const orderB = b.yearId?.order ?? 0;
    return orderA - orderB;
  });

  return successResponse(
    res,
    200,
    `success, number of documents ${sortedBanks.length}`,
    sortedBanks
  );
});