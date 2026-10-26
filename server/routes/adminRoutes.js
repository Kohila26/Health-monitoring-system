const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect, authorize('admin'));

router.get('/dashboard', adminController.getDashboardStats);
router.get('/users', adminController.listUsers);
router.put('/doctors/:id/verify', adminController.verifyDoctor);
router.put('/users/:id/status', adminController.updateUserStatus);
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/reference-ranges', adminController.getReferenceRanges);
router.put('/reference-ranges/:id', adminController.updateReferenceRange);

module.exports = router;
