const mongoose = require('mongoose');

const patientConsentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['active', 'revoked', 'pending'],
      default: 'active',
      index: true
    },
    grantedAt: {
      type: Date,
      default: Date.now
    },
    revokedAt: {
      type: Date
    },
    permissions: {
      measurements: { type: Boolean, default: true },
      symptoms: { type: Boolean, default: true },
      medications: { type: Boolean, default: true },
      reports: { type: Boolean, default: true },
      addNotes: { type: Boolean, default: true }
    },
    doctorProfessionalNotes: [
      {
        doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        doctorName: String,
        note: { type: String, required: true },
        recommendation: String,
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true
  }
);

patientConsentSchema.index({ patient: 1, doctor: 1 }, { unique: true });

module.exports = mongoose.model('PatientConsent', patientConsentSchema);
