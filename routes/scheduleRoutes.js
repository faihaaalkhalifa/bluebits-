const express = require('express');
const scheduleConfigController = require('../controllers/scheduleConfigController');
const { protect, restrictTo } = require('../middlewares/authMiddlewers');
const solveController = require('../controllers/solveScheduleController');
const aggregatorController = require('../controllers/scheduleAggregatorController');
const router = express.Router();

router.use(protect);



router.post('/solve', restrictTo('ADMIN', 'SUPER_ADMIN'), solveController.solveAndSave);


router.get('/result/:semesterId', protect, solveController.getSchedule);


router.patch('/result/:semesterId/publish', restrictTo('ADMIN', 'SUPER_ADMIN'), solveController.publishSchedule);

router
  .route('/config')
  .post(restrictTo('ADMIN', 'SUPER_ADMIN'), scheduleConfigController.createScheduleConfig);

router
  .route('/config/:semesterId')
  .get(restrictTo('ADMIN', 'SUPER_ADMIN'), scheduleConfigController.getScheduleConfigBySemester);

  router
  .route('/config/manage/:id')
  .patch(restrictTo('ADMIN', 'SUPER_ADMIN'), scheduleConfigController.updateScheduleConfigById)
  .delete(restrictTo('ADMIN', 'SUPER_ADMIN'), scheduleConfigController.deleteScheduleConfigById);
  
  router
  .route('/generate-data/:semesterId')
  .get(
    restrictTo('ADMIN', 'SUPER_ADMIN'),
    aggregatorController.generateScheduleData
  );
  
module.exports = router;
