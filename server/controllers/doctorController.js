const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');
const DoctorProfile = require('../models/DoctorProfile');
const PatientConsent = require('../models/PatientConsent');
const HealthMeasurement = require('../models/HealthMeasurement');
const SymptomRecord = require('../models/SymptomRecord');
const MedicationRecord = require('../models/MedicationRecord');
const HealthAlert = require('../models/HealthAlert');
const healthAnalyticsService = require('../services/healthAnalyticsService');
const aiService = require('../services/aiService');
const { logAudit } = require('../middleware/auditMiddleware');

// @desc Get all patients who explicitly granted consent to this doctor
// @route GET /api/doctor/patients
exports.getSharedPatients = async (req, res) => {
  try {
    const consents = await PatientConsent.find({
      doctor: req.user.id,
      status: 'active'
    }).populate('patient', 'name email phone avatar createdAt');

    const patientsList = await Promise.all(
      consents.map(async (consent) => {
        const patientUser = consent.patient;
        if (!patientUser) return null;

        const profile = await PatientProfile.findOne({ user: patientUser._id }).lean();
        const latestBP = await HealthMeasurement.findOne({ user: patientUser._id, type: 'bloodPressure' }).sort({ recordedAt: -1 }).lean();
        const latestHR = await HealthMeasurement.findOne({ user: patientUser._id, type: 'heartRate' }).sort({ recordedAt: -1 }).lean();
        const alertsCount = await HealthAlert.countDocuments({ user: patientUser._id, isAcknowledged: false });

        return {
          consentId: consent._id,
          patient: patientUser,
          profile,
          permissions: consent.permissions,
          grantedAt: consent.grantedAt,
          doctorNotesCount: (consent.doctorProfessionalNotes || []).length,
          vitalsSummary: {
            latestBP: latestBP?.valueDetails ? `${latestBP.valueDetails.systolic}/${latestBP.valueDetails.diastolic} mmHg` : 'N/A',
            latestHR: latestHR ? `${latestHR.value} bpm` : 'N/A',
            unacknowledgedAlerts: alertsCount
          }
        };
      })
    );

    const validPatients = patientsList.filter(Boolean);

    await logAudit({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'DOCTOR_VIEWED_PATIENTS_LIST',
      resourceType: 'PatientConsent',
      ipAddress: req.ip
    });

    res.json({ success: true, count: validPatients.length, data: validPatients });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get health measurements and analytics for a specific consented patient
// @route GET /api/doctor/patients/:patientId/records
exports.getPatientRecords = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Consent authorization check
    const consent = await PatientConsent.findOne({
      patient: patientId,
      doctor: req.user.id,
      status: 'active'
    });

    if (!consent) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Patient has not granted consent to view medical records.'
      });
    }

    const patientUser = await User.findById(patientId).select('-password');
    const profile = await PatientProfile.findOne({ user: patientId });

    // Fetch authorized records
    let measurements = [];
    if (consent.permissions?.measurements !== false) {
      measurements = await HealthMeasurement.find({ user: patientId })
        .sort({ recordedAt: -1 })
        .limit(30);
    }

    let symptoms = [];
    if (consent.permissions?.symptoms !== false) {
      symptoms = await SymptomRecord.find({ user: patientId })
        .sort({ recordedAt: -1 })
        .limit(20);
    }

    let medications = [];
    if (consent.permissions?.medications !== false) {
      medications = await MedicationRecord.find({ user: patientId });
    }

    const alerts = await HealthAlert.find({ user: patientId })
      .sort({ createdAt: -1 })
      .limit(10);

    const summary = await healthAnalyticsService.getHealthSummary(patientId);

    await logAudit({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'DOCTOR_ACCESSED_PATIENT_RECORDS',
      resourceType: 'HealthMeasurement',
      patientAffected: patientId,
      ipAddress: req.ip,
      details: { consentId: consent._id }
    });

    res.json({
      success: true,
      data: {
        patient: patientUser,
        profile,
        consent,
        summary,
        measurements,
        symptoms,
        medications,
        alerts,
        doctorNotes: consent.doctorProfessionalNotes || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Add professional notes and clinical recommendations to patient
// @route POST /api/doctor/patients/:patientId/notes
exports.addProfessionalNotes = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { note, recommendation } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, message: 'Doctor note text is required.' });
    }

    const consent = await PatientConsent.findOne({
      patient: patientId,
      doctor: req.user.id,
      status: 'active'
    });

    if (!consent) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Active consent required to add clinical notes.'
      });
    }

    consent.doctorProfessionalNotes.push({
      doctor: req.user.id,
      doctorName: req.user.name,
      note: note.trim(),
      recommendation: recommendation || '',
      createdAt: new Date()
    });

    await consent.save();

    await logAudit({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'DOCTOR_NOTE_ADDED',
      resourceType: 'PatientConsent',
      resourceId: consent._id,
      patientAffected: patientId,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Professional clinical note added successfully.',
      data: consent.doctorProfessionalNotes
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get public list of verified doctors for patients to choose from
// @route GET /api/doctor/directory
exports.getDoctorDirectory = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor', isActive: true })
      .select('name email phone avatar isVerified createdAt')
      .lean();

    const doctorsWithProfiles = await Promise.all(
      doctors.map(async (doc) => {
        const profile = await DoctorProfile.findOne({ user: doc._id }).lean();
        return {
          id: doc._id,
          name: doc.name,
          email: doc.email,
          phone: doc.phone,
          avatar: doc.avatar,
          isVerified: doc.isVerified,
          specialization: profile?.specialization || 'General Physician',
          hospitalOrClinic: profile?.hospitalOrClinic || 'Health Care System',
          yearsOfExperience: profile?.yearsOfExperience || 5,
          licenseNumber: profile?.licenseNumber || 'Verified MD',
          bio: profile?.bio || ''
        };
      })
    );

    res.json({ success: true, count: doctorsWithProfiles.length, data: doctorsWithProfiles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
