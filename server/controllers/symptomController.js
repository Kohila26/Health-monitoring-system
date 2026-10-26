const SymptomRecord = require('../models/SymptomRecord');
const Notification = require('../models/Notification');
const { logAudit } = require('../middleware/auditMiddleware');

// Check for emergency red flags
const checkRedFlag = (symptom, severity) => {
  const redFlagTerms = ['chest pain', 'shortness of breath', 'difficulty breathing', 'severe headache', 'vision loss', 'unconsciousness'];
  const isTermMatch = redFlagTerms.some(term => symptom.toLowerCase().includes(term));
  return (severity === 'critical' || (severity === 'severe' && isTermMatch));
};

// @desc Log a symptom
// @route POST /api/symptoms
exports.createSymptom = async (req, res) => {
  try {
    const { symptom, severity = 'mild', onset, duration, bodyLocation, triggers, notes } = req.body;

    if (!symptom) {
      return res.status(400).json({ success: false, message: 'Symptom name is required' });
    }

    const isRedFlag = checkRedFlag(symptom, severity);

    const record = await SymptomRecord.create({
      user: req.user.id,
      symptom,
      severity,
      onset: onset || new Date(),
      duration: duration || 'Current',
      bodyLocation: bodyLocation || 'General',
      triggers: triggers || [],
      notes: notes || '',
      isRedFlag
    });

    if (isRedFlag) {
      await Notification.create({
        user: req.user.id,
        type: 'alert',
        title: 'Emergency Symptom Warning',
        message: `Your reported symptom (${symptom}) may require immediate medical attention. If symptoms are severe, seek emergency services immediately.`,
        severity: 'critical',
        actionUrl: '/patient/symptoms'
      });
    }

    await logAudit({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'SYMPTOM_LOGGED',
      resourceType: 'SymptomRecord',
      resourceId: record._id,
      ipAddress: req.ip,
      details: { symptom, severity, isRedFlag }
    });

    res.status(201).json({
      success: true,
      message: isRedFlag
        ? 'Symptom recorded. WARNING: High-severity symptom detected. Please seek emergency medical care if needed.'
        : 'Symptom logged successfully.',
      data: record
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get symptoms list
// @route GET /api/symptoms
exports.getSymptoms = async (req, res) => {
  try {
    const { severity } = req.query;
    const query = { user: req.user.id };
    if (severity && severity !== 'all') {
      query.severity = severity;
    }

    const symptoms = await SymptomRecord.find(query).sort({ recordedAt: -1 });
    res.json({ success: true, count: symptoms.length, data: symptoms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Delete symptom
// @route DELETE /api/symptoms/:id
exports.deleteSymptom = async (req, res) => {
  try {
    const symptom = await SymptomRecord.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!symptom) {
      return res.status(404).json({ success: false, message: 'Symptom not found or unauthorized.' });
    }

    res.json({ success: true, message: 'Symptom record deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
