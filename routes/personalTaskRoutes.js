const express = require('express');
const personalTaskController = require('../controllers/personalTaskController');
const { protect } = require('../middlewares/authMiddlewers');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(personalTaskController.getMyPersonalTasks)
  .post(personalTaskController.createPersonalTask);

router
  .route('/:id')
  .get(personalTaskController.getPersonalTask)
  .patch(personalTaskController.updatePersonalTask)
  .delete(personalTaskController.deletePersonalTask);

router.patch('/:id/check', personalTaskController.toggleComplete);

module.exports = router;