const express = require('express');
const router = express.Router();
const measurementController = require('../controllers/measurementController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', measurementController.createMeasurement);
router.get('/', measurementController.getMeasurements);
router.get('/:id', measurementController.getMeasurementById);
router.put('/:id', measurementController.updateMeasurement);
router.delete('/:id', measurementController.deleteMeasurement);

module.exports = router;
