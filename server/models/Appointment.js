const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    doctorName: {
      type: String,
      required: [true, 'Doctor or Clinic name is required'],
      trim: true
    },
    clinicOrHospital: {
      type: String,
      trim: true,
      default: 'General Clinic'
    },
    specialty: {
      type: String,
      default: 'General Medicine'
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Appointment date and time is required'],
      index: true
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    purpose: {
      type: String,
      required: [true, 'Purpose of visit is required'],
      trim: true
    },
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled'
    },
    locationType: {
      type: String,
      enum: ['in-person', 'telehealth'],
      default: 'in-person'
    },
    meetingLinkOrAddress: {
      type: String,
      default: ''
    },
    preparationNotes: {
      type: String,
      default: ''
    },
    questionsToAsk: [{
      type: String
    }],
    doctorPostVisitNotes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

appointmentSchema.index({ user: 1, scheduledDate: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
