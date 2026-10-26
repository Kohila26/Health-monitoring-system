const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const HealthMeasurement = require('../models/HealthMeasurement');
const HealthAlert = require('../models/HealthAlert');
const AuditLog = require('../models/AuditLog');
const ReferenceRange = require('../models/ReferenceRange');
const CLINICAL_RULES = require('../config/rules');
const { logAudit } = require('../middleware/auditMiddleware');

// @desc Admin Dashboard High-Level Metrics
// @route GET /api/admin/dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalPatients, totalDoctors, pendingDoctors, totalMeasurements, criticalAlerts] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'patient' }),
      User.countDocuments({ role: 'doctor' }),
      User.countDocuments({ role: 'doctor', isVerified: false }),
      HealthMeasurement.countDocuments(),
      HealthAlert.countDocuments({ severity: 'critical' })
    ]);

    const recentAudits = await AuditLog.find()
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(8);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalPatients,
          totalDoctors,
          pendingDoctors,
          totalMeasurements,
          criticalAlerts
        },
        systemStatus: {
          database: 'Connected (MongoDB)',
          ruleVersion: CLINICAL_RULES.version,
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
          memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
        },
        recentAudits
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc List all system users with filters
// @route GET /api/admin/users
exports.listUsers = async (req, res) => {
  try {
    const { role, search, isVerified, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role && role !== 'all') {
      query.role = role;
    }

    if (isVerified !== undefined && isVerified !== 'all') {
      query.isVerified = isVerified === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Verify doctor credential & activate profile
// @route PUT /api/admin/doctors/:id/verify
exports.verifyDoctor = async (req, res) => {
  try {
    const { status = true } = req.body;

    const doctorUser = await User.findOne({ _id: req.params.id, role: 'doctor' });
    if (!doctorUser) {
      return res.status(404).json({ success: false, message: 'Doctor account not found.' });
    }

    doctorUser.isVerified = status;
    await doctorUser.save();

    await DoctorProfile.findOneAndUpdate(
      { user: doctorUser._id },
      {
        $set: {
          isVerified: status,
          verifiedBy: req.user.id,
          verifiedAt: status ? new Date() : null
        }
      }
    );

    await logAudit({
      userId: req.user.id,
      userRole: 'admin',
      action: status ? 'DOCTOR_VERIFIED' : 'DOCTOR_UNVERIFIED',
      resourceType: 'User',
      resourceId: doctorUser._id,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: `Doctor ${doctorUser.name} has been ${status ? 'verified' : 'unverified'}.`,
      data: doctorUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update user active status or role
// @route PUT /api/admin/users/:id/status
exports.updateUserStatus = async (req, res) => {
  try {
    const { isActive, role } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (isActive !== undefined) user.isActive = isActive;
    if (role && ['patient', 'doctor', 'admin'].includes(role)) user.role = role;

    await user.save();

    await logAudit({
      userId: req.user.id,
      userRole: 'admin',
      action: 'USER_STATUS_MODIFIED',
      resourceType: 'User',
      resourceId: user._id,
      ipAddress: req.ip,
      details: { isActive, role }
    });

    res.json({ success: true, message: 'User updated successfully', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get audit logs for system governance
// @route GET /api/admin/audit-logs
exports.getAuditLogs = async (req, res) => {
  try {
    const { action, role, page = 1, limit = 50 } = req.query;
    const query = {};

    if (action && action !== 'all') {
      query.action = action;
    }

    if (role && role !== 'all') {
      query.performedByRole = role;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('performedBy', 'name email role')
        .populate('patientAffected', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: logs.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: logs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get configurable clinical reference ranges
// @route GET /api/admin/reference-ranges
exports.getReferenceRanges = async (req, res) => {
  try {
    let ranges = await ReferenceRange.find().sort({ vitalType: 1 });

    // If empty in DB, initialize defaults from CLINICAL_RULES
    if (ranges.length === 0) {
      const defaultRanges = [
        { vitalType: 'heartRate', displayName: 'Heart Rate', unit: 'bpm', normalMin: 60, normalMax: 100, warningLow: 50, warningHigh: 110, criticalLow: 45, criticalHigh: 130 },
        { vitalType: 'oxygenSaturation', displayName: 'Oxygen Saturation (SpO2)', unit: '%', normalMin: 95, normalMax: 100, warningLow: 90, warningHigh: 100, criticalLow: 88, criticalHigh: 100 },
        { vitalType: 'respiratoryRate', displayName: 'Respiratory Rate', unit: 'breaths/min', normalMin: 12, normalMax: 20, warningLow: 10, warningHigh: 24, criticalLow: 8, criticalHigh: 30 }
      ];

      ranges = await ReferenceRange.insertMany(defaultRanges);
    }

    res.json({ success: true, count: ranges.length, data: ranges });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update clinical reference range
// @route PUT /api/admin/reference-ranges/:id
exports.updateReferenceRange = async (req, res) => {
  try {
    const range = await ReferenceRange.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...req.body,
          updatedBy: req.user.id
        }
      },
      { new: true }
    );

    if (!range) {
      return res.status(404).json({ success: false, message: 'Reference range configuration not found.' });
    }

    await logAudit({
      userId: req.user.id,
      userRole: 'admin',
      action: 'CLINICAL_RULE_UPDATED',
      resourceType: 'ReferenceRange',
      resourceId: range._id,
      ipAddress: req.ip,
      details: { vitalType: range.vitalType }
    });

    res.json({ success: true, message: 'Clinical threshold updated successfully.', data: range });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
