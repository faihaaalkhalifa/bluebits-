const express = require('express');
const doctorLectureController = require('../controllers/doctorLectureController');
const { protect, restrictTo } = require('../middlewares/authMiddlewers');
const { uploadLecture } = require('../config/cloudinary');
const multer = require('multer');

const router = express.Router();

router.use(protect);
router.use(restrictTo('DOCTOR')); 

router.get('/', doctorLectureController.getMyLectures);

router.get('/stats/my-stats', doctorLectureController.getMyStats);

router.post(
  '/',
  uploadLecture.single('lecture'),
  doctorLectureController.createLecture
);

router
  .route('/:id')
  .patch(
    (req, res, next) => {
      uploadLecture.single('lecture')(req, res, (err) => {
        if (err instanceof multer.MulterError) return next(err);
        if (err) return next(err);
        next();
      });
    },
    doctorLectureController.updateLecture
  )
  .delete(doctorLectureController.deleteLecture);

module.exports = router;