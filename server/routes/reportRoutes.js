const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, reportController.generateReport);
router.get('/', protect, reportController.getReports);
router.get('/download/:filename', reportController.downloadReportFile);

module.exports = router;
