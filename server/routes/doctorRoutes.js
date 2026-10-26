const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Public directory of doctors for patients to view
router.get('/directory', protect, doctorController.getDoctorDirectory);

// Doctor-only routes
router.get('/patients', protect, authorize('doctor', 'admin'), doctorController.getSharedPatients);
router.get('/patients/:patientId/records', protect, authorize('doctor', 'admin'), doctorController.getPatientRecords);
router.post('/patients/:patientId/notes', protect, authorize('doctor'), doctorController.addProfessionalNotes);

module.exports = router;
