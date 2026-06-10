const express = require('express');
const reactionController = require('../controllers/reactionController');
const { protect, restrictTo } = require('../middlewares/authMiddlewers');

const router = express.Router();

router.use(protect);

router
  .route('/lecture/:lectureId')
  .get(
    restrictTo('USER', 'ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
    reactionController.getLectureReactions
  )
  .post(
    restrictTo('USER', 'ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
    reactionController.toggleReaction
  );

module.exports = router;