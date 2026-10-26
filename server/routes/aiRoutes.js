const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/health-summary', aiController.getHealthSummary);
router.post('/explain-measurement', aiController.explainMeasurement);
router.post('/chat', aiController.chatWithAssistant);
router.get('/chat/history', aiController.getChatHistory);

module.exports = router;
