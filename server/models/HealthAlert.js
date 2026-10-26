const mongoose = require('mongoose');

const healthAlertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    measurement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HealthMeasurement'
    },
    vitalType: {
      type: String,
      required: true
    },
    triggerValue: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    unit: {
      type: String,
      default: ''
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      required: true,
      index: true
    },
    alertCode: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    clinicalAction: {
      type: String,
      required: true
    },
    ruleVersion: {
      type: String,
      default: '2026.1'
    },
    isAcknowledged: {
      type: Boolean,
      default: false
    },
    acknowledgedAt: {
      type: Date
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userResponseNote: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

healthAlertSchema.index({ user: 1, isAcknowledged: 1, createdAt: -1 });

module.exports = mongoose.model('HealthAlert', healthAlertSchema);
