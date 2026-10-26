const express = require('express');
const router = express.Router();
const medicationController = require('../controllers/medicationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', medicationController.getMedications);
router.post('/', medicationController.createMedication);
router.put('/:id', medicationController.updateMedication);
router.delete('/:id', medicationController.deleteMedication);

// Reminders
router.get('/reminders/today', medicationController.getReminders);
router.put('/reminders/:id/status', medicationController.updateReminderStatus);

module.exports = router;
