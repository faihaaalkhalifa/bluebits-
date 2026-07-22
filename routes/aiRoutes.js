const express = require('express');
const aiController = require('../controllers/aiController');
const { protect } = require('../middlewares/authMiddlewers');

const router = express.Router();

router.use(protect);

router.post('/ask', aiController.askAI);
router.get('/conversations', aiController.getMyConversations);
router.get('/conversations/:id', aiController.getConversation);
router.delete('/conversations/:id', aiController.deleteConversation);

module.exports = router;