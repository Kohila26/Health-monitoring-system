const healthAnalyticsService = require('../services/healthAnalyticsService');
const HealthAlert = require('../models/HealthAlert');
const { logAudit } = require('../middleware/auditMiddleware');

// @desc Get overview summary of user's vitals & alerts
// @route GET /api/health/summary
exports.getSummary = async (req, res) => {
  try {
    const summary = await healthAnalyticsService.getHealthSummary(req.user.id);
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get time-series trends for charts
// @route GET /api/health/trends
exports.getTrends = async (req, res) => {
  try {
    const { vitalType = 'heartRate', days = 30 } = req.query;
    const trends = await healthAnalyticsService.getTrends(req.user.id, vitalType, days);
    res.json({ success: true, data: trends });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get list of clinical health alerts
// @route GET /api/health/alerts
exports.getAlerts = async (req, res) => {
  try {
    const { status = 'all', severity } = req.query;
    const query = { user: req.user.id };

    if (status === 'unacknowledged') {
      query.isAcknowledged = false;
    } else if (status === 'acknowledged') {
      query.isAcknowledged = true;
    }

    if (severity && severity !== 'all') {
      query.severity = severity;
    }

    const alerts = await HealthAlert.find(query)
      .sort({ createdAt: -1 })
      .populate('measurement')
      .lean();

    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Acknowledge an alert
// @route POST /api/health/alerts/:id/acknowledge
exports.acknowledgeAlert = async (req, res) => {
  try {
    const { userResponseNote = '' } = req.body;

    const alert = await HealthAlert.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found or unauthorized.' });
    }

    alert.isAcknowledged = true;
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = req.user.id;
    if (userResponseNote) alert.userResponseNote = userResponseNote;

    await alert.save();

    await logAudit({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'ALERT_ACKNOWLEDGED',
      resourceType: 'HealthAlert',
      resourceId: alert._id,
      ipAddress: req.ip,
      details: { severity: alert.severity, vitalType: alert.vitalType }
    });

    res.json({ success: true, message: 'Alert successfully acknowledged.', data: alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
