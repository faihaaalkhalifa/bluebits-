const express = require('express');
const subjectController = require('../controllers/subjectController');
const { protect, restrictTo } = require('../middlewares/authMiddlewers');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(
    restrictTo('USER', 'ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
    subjectController.getAllSubjects
  )
  .post(
    restrictTo('ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
    subjectController.setCreatedBy,
    subjectController.createSubject
  );
  router
  .route('/year/:yearId')
  .get(
    restrictTo('USER', 'ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
    subjectController.getSubjectsByYear
  );
  router
  .route('/semester/:semesterId')
  .get(
    restrictTo('USER', 'ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
    subjectController.getSubjectsBySemester
  );
  router
  .route('/year/:yearId/semester/:semesterId')
  .get(
    restrictTo('USER', 'ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
    subjectController.getSubjectsByYearAndSemester
  );

router
  .route('/:id')
  .get(
    restrictTo('USER', 'ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
    subjectController.getSubject
  )
  .patch(
    restrictTo('ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
    subjectController.updateSubject
  )
  .delete(
    restrictTo('ADMIN', 'SUPER_ADMIN'),
    subjectController.deleteSubject
  );

module.exports = router;