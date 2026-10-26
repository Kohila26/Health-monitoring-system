const express = require('express');
const router = express.Router();
const healthAnalyticsController = require('../controllers/healthAnalyticsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/summary', healthAnalyticsController.getSummary);
router.get('/trends', healthAnalyticsController.getTrends);
router.get('/alerts', healthAnalyticsController.getAlerts);
router.post('/alerts/:id/acknowledge', healthAnalyticsController.acknowledgeAlert);

module.exports = router;
