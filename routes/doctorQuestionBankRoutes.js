const express = require('express');
const controller = require('../controllers/doctorQuestionBankController');
const { protect, restrictTo } = require('../middlewares/authMiddlewers');

const router = express.Router();

router.use(protect);
router.use(restrictTo('DOCTOR'));

router.get('/', controller.getMyBanks);

router.post('/bulk-upload', controller.bulkUploadQuestions);
router.post('/upload-docx', controller.uploadDocxMiddleware, controller.uploadDocx);

router.delete('/:id', controller.deleteBank);

module.exports = router;