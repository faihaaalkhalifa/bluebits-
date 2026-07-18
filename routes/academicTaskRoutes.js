const express = require('express');
const academicTaskController = require('../controllers/academicTaskController');
const taskSubmissionController = require('../controllers/taskSubmissionController');
const { protect, restrictTo } = require('../middlewares/authMiddlewers');
const { uploadLecture } = require('../config/cloudinary');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(academicTaskController.getAllAcademicTasks)
  .post(
    restrictTo('ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
    academicTaskController.createAcademicTask
  );

router
  .route('/:id')
  .get(academicTaskController.getAcademicTask)
  .patch(
    restrictTo('ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
    academicTaskController.updateAcademicTask
  )
  .delete(
    restrictTo('ADMIN', 'SUPER_ADMIN'),
    academicTaskController.deleteAcademicTask
  );

router.patch(
  '/:id/close',
  restrictTo('ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
  academicTaskController.closeAcademicTask
);

// تسليم الحلول
router
  .route('/:taskId/submissions')
  .post(
    restrictTo('USER'),
    uploadLecture.single('solution'),
    taskSubmissionController.submitSolution
  )
  .get(
    restrictTo('ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
    taskSubmissionController.getSubmissionsForTask
  );

router.get(
  '/:taskId/submissions/me',
  restrictTo('USER'),
  taskSubmissionController.getMySubmission
);

router.patch(
  '/submissions/:id/review',
  restrictTo('ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
  taskSubmissionController.reviewSubmission
);

module.exports = router;