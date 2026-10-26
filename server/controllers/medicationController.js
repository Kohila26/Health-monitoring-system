const MedicationRecord = require('../models/MedicationRecord');
const MedicationReminder = require('../models/MedicationReminder');
const { logAudit } = require('../middleware/auditMiddleware');

// @desc Get all user medications
// @route GET /api/medications
exports.getMedications = async (req, res) => {
  try {
    const { activeOnly } = req.query;
    const query = { user: req.user.id };
    if (activeOnly === 'true') {
      query.isActive = true;
    }

    const medications = await MedicationRecord.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: medications.length, data: medications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Add a new medication schedule
// @route POST /api/medications
exports.createMedication = async (req, res) => {
  try {
    const { name, dosage, form, frequency, timeOfDay, startDate, endDate, prescribedBy, instructions, purpose, notes } = req.body;

    if (!name || !dosage) {
      return res.status(400).json({ success: false, message: 'Medication name and dosage instructions are required.' });
    }

    const medication = await MedicationRecord.create({
      user: req.user.id,
      name,
      dosage,
      form: form || 'tablet',
      frequency: frequency || 'Once daily',
      timeOfDay: timeOfDay || ['08:00'],
      startDate: startDate || new Date(),
      endDate,
      prescribedBy: prescribedBy || '',
      instructions: instructions || 'Take with water as instructed',
      purpose: purpose || '',
      notes: notes || ''
    });

    // Create immediate reminder records for today
    const now = new Date();
    const times = medication.timeOfDay.length > 0 ? medication.timeOfDay : ['08:00'];
    for (const t of times) {
      const [h, m] = t.split(':');
      const reminderTime = new Date();
      reminderTime.setHours(parseInt(h) || 8, parseInt(m) || 0, 0, 0);

      await MedicationReminder.create({
        user: req.user.id,
        medication: medication._id,
        medicationName: medication.name,
        dosage: medication.dosage,
        scheduledTime: reminderTime,
        status: reminderTime < now ? 'missed' : 'pending'
      });
    }

    await logAudit({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'MEDICATION_ADDED',
      resourceType: 'MedicationRecord',
      resourceId: medication._id,
      ipAddress: req.ip,
      details: { name, dosage }
    });

    res.status(201).json({ success: true, message: 'Medication added successfully', data: medication });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update medication details
// @route PUT /api/medications/:id
exports.updateMedication = async (req, res) => {
  try {
    const medication = await MedicationRecord.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: req.body },
      { new: true }
    );

    if (!medication) {
      return res.status(404).json({ success: false, message: 'Medication not found or unauthorized.' });
    }

    await logAudit({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'MEDICATION_UPDATED',
      resourceType: 'MedicationRecord',
      resourceId: medication._id,
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'Medication updated successfully', data: medication });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Delete medication
// @route DELETE /api/medications/:id
exports.deleteMedication = async (req, res) => {
  try {
    const medication = await MedicationRecord.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!medication) {
      return res.status(404).json({ success: false, message: 'Medication not found or unauthorized.' });
    }

    // Remove pending reminders
    await MedicationReminder.deleteMany({ medication: req.params.id, status: 'pending' });

    res.json({ success: true, message: 'Medication deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get today's medication reminders
// @route GET /api/medication-reminders
exports.getReminders = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let reminders = await MedicationReminder.find({
      user: req.user.id,
      scheduledTime: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ scheduledTime: 1 });

    // If none exist today, auto-generate for active medications
    if (reminders.length === 0) {
      const activeMeds = await MedicationRecord.find({ user: req.user.id, isActive: true });
      for (const med of activeMeds) {
        const times = med.timeOfDay.length > 0 ? med.timeOfDay : ['08:00'];
        for (const t of times) {
          const [h, m] = t.split(':');
          const sched = new Date();
          sched.setHours(parseInt(h) || 8, parseInt(m) || 0, 0, 0);

          await MedicationReminder.create({
            user: req.user.id,
            medication: med._id,
            medicationName: med.name,
            dosage: med.dosage,
            scheduledTime: sched,
            status: sched < new Date() ? 'missed' : 'pending'
          });
        }
      }
      reminders = await MedicationReminder.find({
        user: req.user.id,
        scheduledTime: { $gte: startOfDay, $lte: endOfDay }
      }).sort({ scheduledTime: 1 });
    }

    res.json({ success: true, count: reminders.length, data: reminders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Mark a medication dose as taken, skipped, or missed
// @route PUT /api/medication-reminders/:id/status
exports.updateReminderStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!['taken', 'skipped', 'missed', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Use: taken, skipped, missed, pending' });
    }

    const reminder = await MedicationReminder.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder record not found.' });
    }

    reminder.status = status;
    reminder.loggedAt = new Date();
    if (notes) reminder.notes = notes;

    await reminder.save();

    res.json({ success: true, message: `Dose logged as ${status}.`, data: reminder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
