const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('../controllers/authController');
const authMiddlewers = require('../middlewares/authMiddlewers');
const imguserMiddlewers = require('../middlewares/imguserMiddlewers');
const router = express.Router();

router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.get('/resetPassword/:token', (req, res) => {
  res.render('user/resetPassword4');
});
router.post('/signup', authController.signup);
// عمليات المستخدم على حسابه الخاص
router.patch('/updateMe', authMiddlewers.protect, userController.updateMe);
router.patch(
  '/updateMyPassword',
  authMiddlewers.protect,
  authController.updatePassword,
);
router
  .route('/')
  .get(
    authMiddlewers.protect,
    authMiddlewers.isactive,
    authMiddlewers.restrictTo('ADMIN'),
    userController.getAllUsers, //,الحصول على جميع المستخدمين
  )
  .post(
    authMiddlewers.protect,
    authMiddlewers.isactive,
    authMiddlewers.restrictTo('ADMIN'),
    userController.createUser, //انشاء مستخدم جديد
  );
router
  .route('/:id')
  .get(
    authMiddlewers.protect,
    authMiddlewers.isactive,
    authMiddlewers.restrictTo('ADMIN'),
    userController.getUser, //الحصول على مستخدم معين
  )
  .patch(
    authMiddlewers.protect,
    authMiddlewers.isactive,
    authMiddlewers.restrictTo('ADMIN'),
    userController.updateUser, //تحديث مستخدم معين
  )
  .delete(
    authMiddlewers.protect,
    authMiddlewers.isactive,
    authMiddlewers.restrictTo('ADMIN'),
    userController.deleteUser, //حذف مستخدم معين
  );

module.exports = router;
