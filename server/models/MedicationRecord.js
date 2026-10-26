const mongoose = require('mongoose');

const medicationRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Medication name is required'],
      trim: true
    },
    dosage: {
      type: String,
      required: [true, 'Dosage instructions are required (e.g. 50mg, 1 tablet)'],
      trim: true
    },
    form: {
      type: String,
      enum: ['tablet', 'capsule', 'liquid', 'injection', 'inhaler', 'drops', 'other'],
      default: 'tablet'
    },
    frequency: {
      type: String,
      required: true,
      default: 'Once daily' // e.g., 'Once daily', 'Twice daily', 'As needed'
    },
    timeOfDay: [{
      type: String // e.g. "08:00", "20:00"
    }],
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    prescribedBy: {
      type: String,
      default: ''
    },
    instructions: {
      type: String,
      default: 'Take with water'
    },
    purpose: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
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

medicationRecordSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model('MedicationRecord', medicationRecordSchema);
