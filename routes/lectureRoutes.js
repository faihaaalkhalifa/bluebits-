// routes/lectureRoutes.js
const express = require('express');
const lectureController = require('../controllers/lectureController');
const { protect, restrictTo } = require('../middlewares/authMiddlewers');
const { uploadLecture } = require('../config/cloudinary');
const multer = require('multer');
const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(
    restrictTo('USER', 'ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
    lectureController.getAllLectures
  )
  .post(
    restrictTo('ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
    uploadLecture.single('lecture'),
    (req, res, next) => {
  
      console.log('Body after multer:', req.body);
      next();
    },
    lectureController.createLecture
  );

router
  .route('/:id')
  .get(
    restrictTo('USER', 'ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
    lectureController.getLecture
  )
   .patch(
    restrictTo('ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
    (req, res, next) => {
      uploadLecture.single('lecture')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          return next(err);
        } else if (err) {
          return next(err);
        }
        next();
      });
    },
    lectureController.updateLecture
  )
  .delete(
    restrictTo('ADMIN', 'SUPER_ADMIN'),
    lectureController.deleteLecture
  );
  router
  .route('/:id/download')
  .get(
    restrictTo('USER', 'ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
    lectureController.downloadLecture
  );

module.exports = router;