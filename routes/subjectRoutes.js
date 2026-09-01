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

  router.get(
  '/my-subjects',
  restrictTo('DOCTOR', 'ADMIN', 'SUPER_ADMIN'),
  subjectController.getMySubjects
);

router.get(
  '/lecturer/:lecturerId',
  restrictTo('SUPER_ADMIN'),
  subjectController.getSubjectsByLecturer
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


  router.patch(
  '/:id/assign-lecturer',
  restrictTo('SUPER_ADMIN'),
  subjectController.assignLecturer
);
router.patch(
  '/:id/unassign-lecturer',
  restrictTo('SUPER_ADMIN'),
  subjectController.unassignLecturer
);

module.exports = router;