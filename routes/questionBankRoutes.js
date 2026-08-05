const express = require('express');
const controller = require('../controllers/questionBankController');
const { protect, restrictTo } = require('../middlewares/authMiddlewers');

const router = express.Router();

router.use(protect);

router.post(
  '/bulk-upload',
  restrictTo('ADMIN', 'DOCTOR', 'SUPER_ADMIN','BLUE'),
  controller.bulkUploadQuestions
);

router.post(
  '/upload-docx',
  restrictTo('ADMIN', 'DOCTOR', 'SUPER_ADMIN','BLUE'),
  controller.uploadDocxMiddleware,
  controller.uploadDocx
);

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
  restrictTo('ADMIN', 'DOCTOR', 'SUPER_ADMIN','BLUE'),
  controller.updateQuestion
);
router.delete(
  '/questions/:questionId',
  restrictTo('ADMIN', 'DOCTOR', 'SUPER_ADMIN','BLUE'),
  controller.deleteQuestion
);

module.exports = router;