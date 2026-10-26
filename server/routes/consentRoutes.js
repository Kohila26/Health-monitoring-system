const express = require('express');
const router = express.Router();
const consentController = require('../controllers/consentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', consentController.grantConsent);
router.put('/:id/revoke', consentController.revokeConsent);
router.get('/', consentController.getMyConsents);

module.exports = router;
