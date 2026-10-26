const mongoose = require('mongoose');

const healthMeasurementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      required: true,
      enum: [
        'heartRate',
        'bloodPressure',
        'bloodGlucose',
        'bodyWeight',
        'height',
        'bmi',
        'bodyTemperature',
        'oxygenSaturation',
        'respiratoryRate',
        'sleep',
        'physicalActivity',
        'waterIntake'
      ],
      index: true
    },
    value: {
      type: Number,
      required: function() {
        return this.type !== 'bloodPressure';
      }
    },
    // For composite vitals such as Blood Pressure (systolic/diastolic) or Glucose context
    valueDetails: {
      systolic: { type: Number },
      diastolic: { type: Number },
      context: { type: String, enum: ['fasting', 'post_meal', 'random', 'bedtime'], default: 'fasting' },
      sleepQuality: { type: String, enum: ['deep', 'restful', 'interrupted', 'poor'], default: 'restful' },
      activityType: { type: String, default: 'walking' },
      waterGlasses: { type: Number }
    },
    unit: {
      type: String,
      required: true,
      trim: true
    },
    recordedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    source: {
      type: String,
      enum: ['manual', 'smart_watch', 'smart_scale', 'bp_cuff', 'glucometer', 'pulse_oximeter'],
      default: 'manual'
    },
    notes: {
      type: String,
      maxLength: 500,
      default: ''
    },
    validationStatus: {
      type: String,
      enum: ['valid', 'flagged', 'corrected'],
      default: 'valid'
    },
    isAnomaly: {
      type: Boolean,
      default: false
    },
    alertSeverity: {
      type: String,
      enum: ['normal', 'info', 'warning', 'critical'],
      default: 'normal'
    },
    alertCode: {
      type: String,
      default: ''
    },
    alertMessage: {
      type: String,
      default: ''
    },
    ruleVersion: {
      type: String,
      default: '2026.1'
    },
    editHistory: [
      {
        previousValue: Number,
        previousValueDetails: mongoose.Schema.Types.Mixed,
        editedAt: { type: Date, default: Date.now },
        reason: { type: String, default: 'User correction' }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Compound index for user query performance over time ranges
healthMeasurementSchema.index({ user: 1, type: 1, recordedAt: -1 });

module.exports = mongoose.model('HealthMeasurement', healthMeasurementSchema);
