const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const { logAudit } = require('../middleware/auditMiddleware');

// @desc Get all appointments for user
// @route GET /api/appointments
exports.getAppointments = async (req, res) => {
  try {
    const { status, timeframe } = req.query;
    const query = { user: req.user.id };

    if (status && status !== 'all') {
      query.status = status;
    }

    const now = new Date();
    if (timeframe === 'upcoming') {
      query.scheduledDate = { $gte: now };
    } else if (timeframe === 'past') {
      query.scheduledDate = { $lt: now };
    }

    const appointments = await Appointment.find(query)
      .sort({ scheduledDate: timeframe === 'past' ? -1 : 1 })
      .populate('doctor', 'name email phone');

    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Create a new appointment
// @route POST /api/appointments
exports.createAppointment = async (req, res) => {
  try {
    const {
      doctor,
      doctorName,
      clinicOrHospital,
      specialty,
      scheduledDate,
      timezone,
      purpose,
      locationType,
      meetingLinkOrAddress,
      preparationNotes,
      questionsToAsk
    } = req.body;

    if (!doctorName || !scheduledDate || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Doctor name, scheduled date, and appointment purpose are required.'
      });
    }

    const appointment = await Appointment.create({
      user: req.user.id,
      doctor: doctor || null,
      doctorName,
      clinicOrHospital: clinicOrHospital || 'General Clinic',
      specialty: specialty || 'General Practice',
      scheduledDate: new Date(scheduledDate),
      timezone: timezone || 'UTC',
      purpose,
      locationType: locationType || 'in-person',
      meetingLinkOrAddress: meetingLinkOrAddress || '',
      preparationNotes: preparationNotes || '',
      questionsToAsk: questionsToAsk || []
    });

    // Create upcoming appointment reminder notification
    await Notification.create({
      user: req.user.id,
      type: 'appointment',
      title: 'Appointment Scheduled',
      message: `Appointment with ${doctorName} scheduled for ${new Date(scheduledDate).toLocaleString()}`,
      actionUrl: '/patient/appointments'
    });

    await logAudit({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'APPOINTMENT_SCHEDULED',
      resourceType: 'Appointment',
      resourceId: appointment._id,
      ipAddress: req.ip,
      details: { doctorName, scheduledDate }
    });

    res.status(201).json({ success: true, message: 'Appointment created successfully', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update appointment details or reschedule
// @route PUT /api/appointments/:id
exports.updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: req.body },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found or unauthorized.' });
    }

    await logAudit({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'APPOINTMENT_UPDATED',
      resourceType: 'Appointment',
      resourceId: appointment._id,
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'Appointment updated successfully', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Cancel an appointment
// @route DELETE /api/appointments/:id
exports.cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found or unauthorized.' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    await logAudit({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'APPOINTMENT_CANCELLED',
      resourceType: 'Appointment',
      resourceId: appointment._id,
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'Appointment cancelled successfully.', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
