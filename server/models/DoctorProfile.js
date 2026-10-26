const mongoose = require('mongoose');

const doctorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    licenseNumber: {
      type: String,
      required: [true, 'Medical License Number is required'],
      trim: true
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      default: 'General Physician'
    },
    hospitalOrClinic: {
      type: String,
      trim: true,
      default: 'Community Health Center'
    },
    yearsOfExperience: {
      type: Number,
      min: 0,
      default: 5
    },
    qualifications: [{
      type: String,
      trim: true
    }],
    bio: {
      type: String,
      maxLength: 1000,
      default: ''
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);
