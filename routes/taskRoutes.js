const taskController = require("../controllers/taskController");
const { protect, restrictTo } = require("./../middlewares/authMiddlewers");
const { RoleCode } = require("./../utils/enum");
const { USER, ADMIN, BLUE, DOCTOR } = RoleCode;
const express = require("express");
const router = express.Router();
router.use(protect);
  router
  .route('/:id/Completed')
  .patch(restrictTo(USER,ADMIN,BLUE,DOCTOR),taskController.Completed);
  router
  .route('/getMyTask')
  .get(restrictTo(USER,ADMIN,BLUE,DOCTOR),taskController.getMyTask);
   router
  .route('/getMyCompletedTask')
  .get(restrictTo(USER,ADMIN,BLUE,DOCTOR),taskController.getMyCompletedTask);
   router
  .route('/getMyNotCompletedTask')
  .get(restrictTo(USER,ADMIN,BLUE,DOCTOR),taskController.getMyNotCompletedTask);
   
router
  .route("/")
  .get(restrictTo(ADMIN), taskController.getAllTask)
  .post(restrictTo(USER, BLUE, DOCTOR), taskController.createTask);

router
  .route("/:id")
  .get(restrictTo(USER, ADMIN, BLUE, DOCTOR), taskController.getTask)
  .patch(restrictTo(USER, BLUE, DOCTOR), taskController.updateTask)
  .delete(restrictTo(USER, BLUE, DOCTOR), taskController.deleteTask);
module.exports = router;
