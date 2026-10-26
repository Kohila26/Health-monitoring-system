const mongoose = require('mongoose');

const patientProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    dateOfBirth: {
      type: Date
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      default: 'prefer_not_to_say'
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'],
      default: 'unknown'
    },
    height: {
      type: Number, // in cm
      min: 30,
      max: 300
    },
    weight: {
      type: Number, // in kg
      min: 2,
      max: 500
    },
    emergencyContact: {
      name: { type: String, default: '' },
      relationship: { type: String, default: '' },
      phone: { type: String, default: '' }
    },
    allergies: [{
      type: String,
      trim: true
    }],
    chronicConditions: [{
      type: String,
      trim: true
    }],
    measurementUnits: {
      height: { type: String, enum: ['cm', 'in'], default: 'cm' },
      weight: { type: String, enum: ['kg', 'lbs'], default: 'kg' },
      temp: { type: String, enum: ['°F', '°C'], default: '°F' },
      glucose: { type: String, enum: ['mg/dL', 'mmol/L'], default: 'mg/dL' }
    },
    preferredLanguage: {
      type: String,
      default: 'en'
    },
    notificationPreferences: {
      emailAlerts: { type: Boolean, default: true },
      medicationReminders: { type: Boolean, default: true },
      appointmentAlerts: { type: Boolean, default: true },
      weeklySummary: { type: Boolean, default: true }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('PatientProfile', patientProfileSchema);
