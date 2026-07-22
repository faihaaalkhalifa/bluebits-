const express = require('express');
const announcementController = require('../controllers/announcementController');
const { protect, restrictTo } = require('../middlewares/authMiddlewers');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(
    restrictTo('USER', 'ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
    announcementController.getAllAnnouncements
  )
  .post(
    restrictTo('ADMIN', 'SUPER_ADMIN'),
    announcementController.setCreatedBy,
    announcementController.createAnnouncement
  );

router
  .route('/my')
  .get(
    restrictTo('USER', 'ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
    announcementController.getMyAnnouncements
  );

router
  .route('/:id')
  .get(
    restrictTo('USER', 'ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
    announcementController.getAnnouncement
  )
  .patch(
    restrictTo('ADMIN', 'SUPER_ADMIN'),
    announcementController.updateAnnouncement
  )
  .delete(
    restrictTo('ADMIN', 'SUPER_ADMIN'),
    announcementController.deleteAnnouncement
  );

module.exports = router;