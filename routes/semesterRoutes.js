const express = require('express');
const semesterController = require('../controllers/semesterController');
const { protect, restrictTo } = require('../middlewares/authMiddlewers');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(
    restrictTo('USER', 'ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
    semesterController.getAllSemesters
  )
  .post(
    restrictTo('ADMIN', 'SUPER_ADMIN'),
    semesterController.createSemester
  );

router
  .route('/:id')
  .get(
    restrictTo('USER', 'ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
    semesterController.getSemester
  )
  .patch(
    restrictTo('ADMIN', 'SUPER_ADMIN'),
    semesterController.updateSemester
  )
  .delete(
    restrictTo('ADMIN', 'SUPER_ADMIN'),
    semesterController.deleteSemester
  );

module.exports = router;