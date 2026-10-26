const HealthMeasurement = require('../models/HealthMeasurement');
const alertService = require('../services/alertService');
const { logAudit } = require('../middleware/auditMiddleware');

// @desc Record a new health measurement
// @route POST /api/measurements
exports.createMeasurement = async (req, res) => {
  try {
    const { type, value, valueDetails, unit, source = 'manual', notes, recordedAt } = req.body;

    if (!type || !unit) {
      return res.status(400).json({ success: false, message: 'Measurement type and unit are required.' });
    }

    if (type !== 'bloodPressure' && (value === undefined || value === null || isNaN(value))) {
      return res.status(400).json({ success: false, message: 'A valid numeric value is required.' });
    }

    if (type === 'bloodPressure' && (!valueDetails?.systolic || !valueDetails?.diastolic)) {
      return res.status(400).json({ success: false, message: 'Systolic and diastolic values are required for blood pressure.' });
    }

    // Step 1: Evaluate against clinical threshold rules
    const evaluation = await alertService.evaluateMeasurement(req.user.id, {
      type,
      value,
      valueDetails,
      unit
    });

    // Step 2: Create Measurement Record
    const measurement = await HealthMeasurement.create({
      user: req.user.id,
      type,
      value: type === 'bloodPressure' ? valueDetails.systolic : value,
      valueDetails,
      unit,
      source,
      notes: notes || '',
      recordedAt: recordedAt || new Date(),
      isAnomaly: evaluation.isAnomaly,
      alertSeverity: evaluation.severity,
      alertCode: evaluation.code,
      alertMessage: evaluation.message,
      ruleVersion: evaluation.ruleVersion
    });

    // Step 3: If abnormal, trigger HealthAlert and Notification
    let triggeredAlert = null;
    if (evaluation.severity !== 'normal') {
      const triggerVal = type === 'bloodPressure'
        ? `${valueDetails.systolic}/${valueDetails.diastolic}`
        : value;

      triggeredAlert = await alertService.triggerAlert(
        req.user.id,
        measurement._id,
        evaluation,
        type,
        triggerVal,
        unit
      );
    }

    await logAudit({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'MEASUREMENT_RECORDED',
      resourceType: 'HealthMeasurement',
      resourceId: measurement._id,
      ipAddress: req.ip,
      details: { type, unit, severity: evaluation.severity }
    });

    res.status(201).json({
      success: true,
      message: evaluation.isAnomaly
        ? `Measurement recorded. Clinical alert noted: ${evaluation.message}`
        : 'Measurement successfully recorded.',
      data: measurement,
      alert: triggeredAlert,
      evaluation
    });
  } catch (error) {
    console.error('[Create Measurement Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get measurements with optional filtering & pagination
// @route GET /api/measurements
exports.getMeasurements = async (req, res) => {
  try {
    const { type, startDate, endDate, page = 1, limit = 20, severity } = req.query;

    const query = { user: req.user.id };

    if (type && type !== 'all') {
      query.type = type;
    }

    if (severity && severity !== 'all') {
      query.alertSeverity = severity;
    }

    if (startDate || endDate) {
      query.recordedAt = {};
      if (startDate) query.recordedAt.$gte = new Date(startDate);
      if (endDate) query.recordedAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [measurements, total] = await Promise.all([
      HealthMeasurement.find(query)
        .sort({ recordedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      HealthMeasurement.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: measurements.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: measurements
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get single measurement by ID
// @route GET /api/measurements/:id
exports.getMeasurementById = async (req, res) => {
  try {
    const measurement = await HealthMeasurement.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!measurement) {
      return res.status(404).json({ success: false, message: 'Measurement not found or access denied.' });
    }

    res.json({ success: true, data: measurement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update an incorrect measurement while keeping audit history
// @route PUT /api/measurements/:id
exports.updateMeasurement = async (req, res) => {
  try {
    const measurement = await HealthMeasurement.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!measurement) {
      return res.status(404).json({ success: false, message: 'Measurement not found or unauthorized.' });
    }

    const { value, valueDetails, notes, reason = 'User correction' } = req.body;

    // Push into editHistory
    measurement.editHistory.push({
      previousValue: measurement.value,
      previousValueDetails: measurement.valueDetails,
      editedAt: new Date(),
      reason
    });

    if (value !== undefined) measurement.value = value;
    if (valueDetails !== undefined) measurement.valueDetails = valueDetails;
    if (notes !== undefined) measurement.notes = notes;
    measurement.validationStatus = 'corrected';

    // Re-evaluate clinical rules
    const evaluation = await alertService.evaluateMeasurement(req.user.id, {
      type: measurement.type,
      value: measurement.value,
      valueDetails: measurement.valueDetails,
      unit: measurement.unit,
      _id: measurement._id
    });

    measurement.isAnomaly = evaluation.isAnomaly;
    measurement.alertSeverity = evaluation.severity;
    measurement.alertCode = evaluation.code;
    measurement.alertMessage = evaluation.message;

    await measurement.save();

    await logAudit({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'MEASUREMENT_CORRECTED',
      resourceType: 'HealthMeasurement',
      resourceId: measurement._id,
      ipAddress: req.ip,
      details: { reason, updatedValue: measurement.value }
    });

    res.json({
      success: true,
      message: 'Measurement updated successfully and re-evaluated.',
      data: measurement
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Delete a measurement
// @route DELETE /api/measurements/:id
exports.deleteMeasurement = async (req, res) => {
  try {
    const measurement = await HealthMeasurement.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!measurement) {
      return res.status(404).json({ success: false, message: 'Measurement not found or unauthorized.' });
    }

    await logAudit({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'MEASUREMENT_DELETED',
      resourceType: 'HealthMeasurement',
      resourceId: measurement._id,
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'Measurement deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
