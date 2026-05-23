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