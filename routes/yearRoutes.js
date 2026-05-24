const express = require('express');
const yearController = require('../controllers/yearController');
const { protect, restrictTo } = require('../middlewares/authMiddlewers');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(
    restrictTo('USER', 'ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
    yearController.getAllYears
  )
  .post(
    restrictTo('ADMIN', 'SUPER_ADMIN'),
    yearController.createYear
  );

router
  .route('/:id')
  .get(
    restrictTo('USER', 'ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
    yearController.getYear
  )
  .patch(
    restrictTo('ADMIN', 'SUPER_ADMIN'),
    yearController.updateYear
  )
  .delete(
    restrictTo('ADMIN', 'SUPER_ADMIN'),
    yearController.deleteYear
  );

module.exports = router;