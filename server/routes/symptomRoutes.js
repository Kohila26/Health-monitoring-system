const express = require('express');
const router = express.Router();
const symptomController = require('../controllers/symptomController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', symptomController.createSymptom);
router.get('/', symptomController.getSymptoms);
router.delete('/:id', symptomController.deleteSymptom);

module.exports = router;
