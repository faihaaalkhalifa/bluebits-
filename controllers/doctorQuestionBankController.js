const multer = require('multer');
const QuestionBank = require('../models/questionBankModel');
const Question = require('../models/questionModel');
const Lecture = require('../models/lectureModel');
const Subject = require('../models/subjectModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { successResponse } = require('../utils/response');
const { docxBufferToQuestions } = require('../utils/docxToQuestions');

exports.uploadDocxMiddleware = multer({ storage: multer.memoryStorage() }).single('file');

const checkLectureOwnership = async (lectureId, doctorId) => {
  const lecture = await Lecture.findById(lectureId);
  if (!lecture) throw new AppError('المحاضرة غير موجودة', 404);

  const subjectId = lecture.subjectId._id || lecture.subjectId;
  const subject = await Subject.findById(subjectId);
  if (!subject) throw new AppError('المادة غير موجودة', 404);

  const isOwner = subject.lecturerIds.some(
    (lecturerId) => lecturerId._id
      ? lecturerId._id.toString() === doctorId.toString()
      : lecturerId.toString() === doctorId.toString()
  );

  if (!isOwner) {
    throw new AppError('هذه المحاضرة ليست من ضمن موادك', 403);
  }
  return { lecture, subject };
};

const getOrCreateBank = async (lectureId, userId) => {
  const { lecture, subject } = await checkLectureOwnership(lectureId, userId);

  const existing = await QuestionBank.findOne({ lectureId });
  if (existing) return existing;

  const yearId = subject.yearId._id || subject.yearId;

  return QuestionBank.create({
    lectureId,
    subjectId: subject._id,
    yearId,
    title: lecture.title,
    createdBy: userId,
  });
};

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
      new AppError('لم يتم العثور على أي أسئلة بالملف، تأكد إنو الملف ملتزم بالصيغة المطلوبة', 400)
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
      new AppError(`تم استخراج ${questions.length} سؤال من الملف لكن فشل حفظهم، راجع الصيغة: ${err.message}`, 400)
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


exports.deleteBank = catchAsync(async (req, res, next) => {
  const bank = await QuestionBank.findById(req.params.id);
  if (!bank) return next(new AppError('بنك الأسئلة غير موجود', 404));

  const subjectId = bank.subjectId._id || bank.subjectId;
  const subject = await Subject.findById(subjectId);
  const isOwner = subject.lecturerIds.some(
    (lecturerId) => lecturerId._id
      ? lecturerId._id.toString() === req.user._id.toString()
      : lecturerId.toString() === req.user._id.toString()
  );
  if (!isOwner) return next(new AppError('هذا البنك ليس من ضمن موادك', 403));

  await QuestionBank.findByIdAndDelete(req.params.id);
  await Question.deleteMany({ bankId: bank._id });

  return successResponse(res, 200, 'تم حذف بنك الأسئلة وجميع أسئلته', null);
});


exports.getMyBanks = catchAsync(async (req, res, next) => {
  const mySubjects = await Subject.find({ lecturerIds: req.user._id }).select('_id');
  const subjectIds = mySubjects.map((s) => s._id);

  const filter = { subjectId: { $in: subjectIds } };
  if (req.query.subjectId) filter.subjectId = req.query.subjectId;

  const banks = await QuestionBank.find(filter).sort('-createdAt');

  return successResponse(
    res,
    200,
    `success, number of documents ${banks.length}`,
    banks
  );
});