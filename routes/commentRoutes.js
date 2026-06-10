const express = require('express');
const commentController = require('../controllers/commentController');
const { protect, restrictTo } = require('../middlewares/authMiddlewers');

const router = express.Router();

router.use(protect);

router
  .route('/lecture/:lectureId')
  .get(
    restrictTo('USER', 'ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
    commentController.getLectureComments
  )
  .post(
    restrictTo('USER', 'ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
    commentController.createComment
  );

router
  .route('/:id')
  .patch(
    restrictTo('USER', 'ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
    commentController.updateComment
  )
  .delete(
    restrictTo('USER', 'ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
    commentController.deleteComment
  );

module.exports = router;