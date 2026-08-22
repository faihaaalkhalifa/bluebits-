const express = require('express');
const controller = require('../controllers/questionBankController');
const { protect, restrictTo, authorize } = require('../middlewares/authMiddlewers');
const { Permission } = require('../utils/enum')

const router = express.Router();

router.use(protect);

router.post(
  '/bulk-upload',
  authorize(['ADMIN', 'DOCTOR', 'SUPER_ADMIN'], Permission.CREATE_QUESTION_BANK),
  controller.bulkUploadQuestions
);

router.post(
  '/upload-docx',
  authorize(['ADMIN', 'DOCTOR', 'SUPER_ADMIN'], Permission.CREATE_QUESTION_BANK),
  controller.uploadDocxMiddleware,
  controller.uploadDocx
);
router.get('/sorted-by-year', controller.getAllBanksSortedByYearOrder);
router.get('/lecture/:lectureId', controller.getBankByLecture);
router.get('/subject/:subjectId', controller.getBanksBySubject);
router.get('/year/:yearId', controller.getBanksByYear);
router.get('/:id', controller.getBank);


router.post('/:id/submit', controller.submitAnswers);
router.get('/:id/my-attempts', controller.getMyAttempts);
router.get(
  '/:id/results',
  restrictTo('ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
  controller.getBankResults
);

router.patch('/:id/publish', restrictTo('ADMIN', 'SUPER_ADMIN'), controller.publishBank);
router.patch('/:id/unpublish', restrictTo('ADMIN', 'SUPER_ADMIN'), controller.unpublishBank);


router.delete('/:id', restrictTo('ADMIN', 'SUPER_ADMIN'), controller.deleteBank);


router.patch(
  '/questions/:questionId',
  authorize(['ADMIN', 'DOCTOR', 'SUPER_ADMIN'], Permission.UPDATE_QUESTION),
  controller.updateQuestion
);
router.delete(
  '/questions/:questionId',
  authorize(['ADMIN', 'DOCTOR', 'SUPER_ADMIN'], Permission.DELETE_QUESTION),
  controller.deleteQuestion
);

module.exports = router;