const express = require('express');
const surveyFormController = require('../controllers/surveyFormController');
const surveyResponseController = require('../controllers/surveyResponseController');
const { protect, restrictTo } = require('../middlewares/authMiddlewers');

const router = express.Router();

router.use(protect);

router.get(
  '/forms/active',
  restrictTo('USER', 'ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
  surveyFormController.getActiveSurveyForm
);

router
  .route('/forms')
  .get(
    restrictTo('ADMIN', 'SUPER_ADMIN'),
    surveyFormController.getAllSurveyForms
  )
  .post(
    restrictTo('ADMIN', 'SUPER_ADMIN'),
    surveyFormController.createSurveyForm
  );

router
  .route('/forms/:id')
  .get(
    restrictTo('ADMIN', 'SUPER_ADMIN'),
    surveyFormController.getSurveyForm
  );


router.patch(
  '/forms/:id/open',
  restrictTo('ADMIN', 'SUPER_ADMIN'),
  surveyFormController.openSurveyForm
);

router.patch(
  '/forms/:id/close',
  restrictTo('ADMIN', 'SUPER_ADMIN'),
  surveyFormController.closeSurveyForm
);


router.get(
  '/forms/:id/responses',
  restrictTo('ADMIN', 'SUPER_ADMIN'),
  surveyFormController.getSurveyFormResponses
);
//من هون بس روتات لطالب

router.post(
  '/responses',
  restrictTo('USER', 'ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
  surveyResponseController.submitSurveyResponse
);

router.get(
  '/responses/my',
  restrictTo('USER', 'ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
  surveyResponseController.getMyResponse
);

router.get(
  '/responses/my/:formId',
  restrictTo('USER', 'ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
  surveyResponseController.getMyResponseByForm
);

module.exports = router;