const express = require('express');
const subjectGroupController = require('../controllers/subjectGroupController');
const { protect, restrictTo } = require('../middlewares/authMiddlewers');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(
    restrictTo('ADMIN', 'SUPER_ADMIN'),
    subjectGroupController.getAllGroups
  )
  .post(
    restrictTo('ADMIN', 'SUPER_ADMIN'),
    subjectGroupController.setCreatedBy,
    subjectGroupController.createGroup
  );

router.get(
  '/year/:yearId',
  restrictTo('ADMIN','SUPER_ADMIN'),
  subjectGroupController.getGroupsByYear
);
router.get(
  '/semester/:semesterId',
  restrictTo('ADMIN','SUPER_ADMIN'),
  subjectGroupController.getGroupsBySemester
);
router.get(
  '/year/:yearId/semester/:semesterId',
  restrictTo('ADMIN','SUPER_ADMIN'),
  subjectGroupController.getGroupsByYearAndSemester
);

router
  .route('/:id')
  .get(
    restrictTo('ADMIN','SUPER_ADMIN'),
    subjectGroupController.getGroup
  )
  .patch(restrictTo('ADMIN', 'SUPER_ADMIN'), subjectGroupController.updateGroup)
  .delete(restrictTo('ADMIN', 'SUPER_ADMIN'), subjectGroupController.deleteGroup);

router.get(
  '/:id/subjects',
  restrictTo('ADMIN', 'SUPER_ADMIN'),
  subjectGroupController.getSubjectsInGroup
);
router.patch(
  '/:id/add-subject',
  restrictTo('ADMIN', 'SUPER_ADMIN'),
  subjectGroupController.addSubjectToGroup
);
router.patch(
  '/:id/remove-subject',
  restrictTo('ADMIN', 'SUPER_ADMIN'),
  subjectGroupController.removeSubjectFromGroup
);

module.exports = router;