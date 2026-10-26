const PatientConsent = require('../models/PatientConsent');
const User = require('../models/User');
const { logAudit } = require('../middleware/auditMiddleware');

// @desc Grant or update consent for a doctor to access records
// @route POST /api/consent
exports.grantConsent = async (req, res) => {
  try {
    const { doctorId, permissions } = req.body;

    if (!doctorId) {
      return res.status(400).json({ success: false, message: 'Doctor ID is required.' });
    }

    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    let consent = await PatientConsent.findOne({
      patient: req.user.id,
      doctor: doctorId
    });

    if (consent) {
      consent.status = 'active';
      consent.revokedAt = null;
      if (permissions) consent.permissions = permissions;
      await consent.save();
    } else {
      consent = await PatientConsent.create({
        patient: req.user.id,
        doctor: doctorId,
        status: 'active',
        permissions: permissions || {
          measurements: true,
          symptoms: true,
          medications: true,
          reports: true,
          addNotes: true
        }
      });
    }

    await logAudit({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'CONSENT_GRANTED',
      resourceType: 'PatientConsent',
      resourceId: consent._id,
      patientAffected: req.user.id,
      ipAddress: req.ip,
      details: { doctorId, permissions: consent.permissions }
    });

    res.status(200).json({
      success: true,
      message: `Access consent granted to Dr. ${doctor.name}.`,
      data: consent
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Revoke consent for a doctor
// @route PUT /api/consent/:id/revoke
exports.revokeConsent = async (req, res) => {
  try {
    const consent = await PatientConsent.findOne({
      _id: req.params.id,
      patient: req.user.id
    });

    if (!consent) {
      return res.status(404).json({ success: false, message: 'Consent record not found.' });
    }

    consent.status = 'revoked';
    consent.revokedAt = new Date();
    await consent.save();

    await logAudit({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'CONSENT_REVOKED',
      resourceType: 'PatientConsent',
      resourceId: consent._id,
      patientAffected: req.user.id,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Doctor access consent has been revoked.',
      data: consent
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get active and revoked consent grants for authenticated patient
// @route GET /api/consent
exports.getMyConsents = async (req, res) => {
  try {
    const consents = await PatientConsent.find({ patient: req.user.id })
      .populate('doctor', 'name email phone avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: consents.length, data: consents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
