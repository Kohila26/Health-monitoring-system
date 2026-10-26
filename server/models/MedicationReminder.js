const mongoose = require('mongoose');

const medicationReminderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    medication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicationRecord',
      required: true
    },
    medicationName: {
      type: String,
      required: true
    },
    dosage: {
      type: String,
      required: true
    },
    scheduledTime: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'taken', 'skipped', 'missed'],
      default: 'pending'
    },
    loggedAt: {
      type: Date
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

medicationReminderSchema.index({ user: 1, scheduledTime: -1 });

module.exports = mongoose.model('MedicationReminder', medicationReminderSchema);
