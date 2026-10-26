const mongoose = require('mongoose');

const referenceRangeSchema = new mongoose.Schema(
  {
    vitalType: {
      type: String,
      required: true,
      unique: true
    },
    displayName: {
      type: String,
      required: true
    },
    unit: {
      type: String,
      required: true
    },
    normalMin: { type: Number },
    normalMax: { type: Number },
    warningLow: { type: Number },
    warningHigh: { type: Number },
    criticalLow: { type: Number },
    criticalHigh: { type: Number },
    clinicalGuideline: {
      type: String,
      default: 'AHA / WHO Standard Guidelines'
    },
    ruleVersion: {
      type: String,
      default: '2026.1'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ReferenceRange', referenceRangeSchema);
