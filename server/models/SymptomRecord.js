const mongoose = require('mongoose');

const symptomRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    symptom: {
      type: String,
      required: true,
      trim: true
    },
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe', 'critical'],
      default: 'mild'
    },
    onset: {
      type: Date,
      default: Date.now
    },
    duration: {
      type: String,
      default: 'Ongoing'
    },
    bodyLocation: {
      type: String,
      default: 'General'
    },
    triggers: [{
      type: String,
      trim: true
    }],
    notes: {
      type: String,
      maxLength: 500,
      default: ''
    },
    isRedFlag: {
      type: Boolean,
      default: false
    },
    recordedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

symptomRecordSchema.index({ user: 1, recordedAt: -1 });

module.exports = mongoose.model('SymptomRecord', symptomRecordSchema);
