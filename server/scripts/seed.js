require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');
const DoctorProfile = require('../models/DoctorProfile');
const HealthMeasurement = require('../models/HealthMeasurement');
const SymptomRecord = require('../models/SymptomRecord');
const MedicationRecord = require('../models/MedicationRecord');
const MedicationReminder = require('../models/MedicationReminder');
const Appointment = require('../models/Appointment');
const HealthAlert = require('../models/HealthAlert');
const PatientConsent = require('../models/PatientConsent');
const ReferenceRange = require('../models/ReferenceRange');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_health_monitor';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB at', mongoUri);

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      PatientProfile.deleteMany({}),
      DoctorProfile.deleteMany({}),
      HealthMeasurement.deleteMany({}),
      SymptomRecord.deleteMany({}),
      MedicationRecord.deleteMany({}),
      MedicationReminder.deleteMany({}),
      Appointment.deleteMany({}),
      HealthAlert.deleteMany({}),
      PatientConsent.deleteMany({}),
      ReferenceRange.deleteMany({}),
      AuditLog.deleteMany({}),
      Notification.deleteMany({})
    ]);
    console.log('[Seed] Cleared existing database records.');

    // 1. Create Users
    console.log('[Seed] Creating demo accounts...');

    // Patient
    const patientUser = await User.create({
      name: 'Eleanor Vance',
      email: 'patient@healthmonitor.io',
      password: 'Password123!',
      role: 'patient',
      phone: '+1 (555) 234-5678',
      isVerified: true
    });

    await PatientProfile.create({
      user: patientUser._id,
      dateOfBirth: new Date('1988-04-12'),
      gender: 'female',
      bloodGroup: 'O+',
      height: 168,
      weight: 64,
      emergencyContact: {
        name: 'David Vance',
        relationship: 'Spouse',
        phone: '+1 (555) 987-6543'
      },
      allergies: ['Penicillin', 'Peanuts'],
      chronicConditions: ['Mild Essential Hypertension', 'Occasional Migraine']
    });

    // Doctor
    const doctorUser = await User.create({
      name: 'Dr. Sarah Chen, MD',
      email: 'doctor@healthmonitor.io',
      password: 'Password123!',
      role: 'doctor',
      phone: '+1 (555) 890-1234',
      isVerified: true
    });

    await DoctorProfile.create({
      user: doctorUser._id,
      licenseNumber: 'MD-CAL-889412',
      specialization: 'Internal Medicine & Cardiology',
      hospitalOrClinic: 'MetroHealth Medical Pavilion',
      yearsOfExperience: 14,
      qualifications: ['MD (Johns Hopkins)', 'FACC Board Certified', 'Internal Medicine Residency UCSF'],
      bio: 'Specialist in preventive cardiovascular monitoring, metabolic wellness, and longitudinal patient health analytics.',
      isVerified: true,
      verifiedAt: new Date()
    });

    // Second Doctor for directory browsing & consent tests
    const secondDoctor = await User.create({
      name: 'Dr. Marcus Brody, DO',
      email: 'dr.brody@healthmonitor.io',
      password: 'Password123!',
      role: 'doctor',
      phone: '+1 (555) 345-6789',
      isVerified: true
    });

    await DoctorProfile.create({
      user: secondDoctor._id,
      licenseNumber: 'DO-NY-44219',
      specialization: 'Endocrinology & Diabetes Care',
      hospitalOrClinic: 'Midtown Health Center',
      yearsOfExperience: 9,
      isVerified: true
    });

    // Admin
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@healthmonitor.io',
      password: 'Password123!',
      role: 'admin',
      phone: '+1 (555) 000-1122',
      isVerified: true
    });

    // 2. Establish Patient Consent to Dr. Sarah Chen
    console.log('[Seed] Granting explicit patient consent to Dr. Sarah Chen...');
    await PatientConsent.create({
      patient: patientUser._id,
      doctor: doctorUser._id,
      status: 'active',
      grantedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      permissions: {
        measurements: true,
        symptoms: true,
        medications: true,
        reports: true,
        addNotes: true
      },
      doctorProfessionalNotes: [
        {
          doctor: doctorUser._id,
          doctorName: doctorUser.name,
          note: 'Baseline examination conducted. Cardiovascular vitals are stable overall with mild intermittent systolic elevations during stressful work weeks.',
          recommendation: 'Continue Lisinopril 10mg daily. Track blood pressure morning and evening before meals. Target systolic under 125 mmHg.',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
        }
      ]
    });

    // 3. Seed Realistic Historical Measurements over past 20 days
    console.log('[Seed] Populating realistic vital measurements...');
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    const measurementsToInsert = [];
    const alertsToInsert = [];

    // Blood Pressure & Heart Rate series (past 14 days)
    const bpReadings = [
      { day: 14, sys: 122, dia: 78, hr: 72, note: 'Morning resting reading' },
      { day: 13, sys: 124, dia: 80, hr: 75, note: 'After morning coffee' },
      { day: 12, sys: 128, dia: 82, hr: 78, note: 'Work day stress' },
      { day: 11, sys: 134, dia: 86, hr: 82, note: 'Mild headache reported' }, // Stage 1 alert
      { day: 10, sys: 132, dia: 84, hr: 80, note: 'Evening check' },
      { day: 9,  sys: 126, dia: 79, hr: 74, note: 'Weekend walk' },
      { day: 8,  sys: 120, dia: 76, hr: 68, note: 'Restful weekend' },
      { day: 7,  sys: 121, dia: 77, hr: 70, note: 'Normal morning reading' },
      { day: 6,  sys: 138, dia: 88, hr: 84, note: 'Felt rushed and fatigued' }, // Stage 1 alert
      { day: 5,  sys: 129, dia: 81, hr: 76, note: 'Post medication' },
      { day: 4,  sys: 123, dia: 79, hr: 71, note: 'Feeling good' },
      { day: 3,  sys: 125, dia: 78, hr: 73, note: 'Morning routine' },
      { day: 2,  sys: 122, dia: 76, hr: 69, note: 'Calm morning' },
      { day: 1,  sys: 119, dia: 75, hr: 68, note: 'Optimal resting reading' }
    ];

    for (const r of bpReadings) {
      const recordTime = new Date(now - r.day * dayMs);

      // BP Record
      const isBPAnomaly = r.sys >= 130 || r.dia >= 80;
      const bpSeverity = r.sys >= 140 ? 'warning' : (isBPAnomaly ? 'warning' : 'normal');

      const bpRecord = await HealthMeasurement.create({
        user: patientUser._id,
        type: 'bloodPressure',
        value: r.sys,
        valueDetails: { systolic: r.sys, diastolic: r.dia },
        unit: 'mmHg',
        recordedAt: recordTime,
        source: 'manual',
        notes: r.note,
        isAnomaly: isBPAnomaly,
        alertSeverity: bpSeverity,
        alertCode: isBPAnomaly ? 'STAGE_1_HYPERTENSION' : 'BP_NORMAL',
        alertMessage: isBPAnomaly ? `Stage 1 Hypertension reading: ${r.sys}/${r.dia} mmHg.` : `Normal blood pressure: ${r.sys}/${r.dia} mmHg.`
      });

      if (isBPAnomaly) {
        await HealthAlert.create({
          user: patientUser._id,
          measurement: bpRecord._id,
          vitalType: 'bloodPressure',
          triggerValue: `${r.sys}/${r.dia}`,
          unit: 'mmHg',
          severity: 'warning',
          alertCode: 'STAGE_1_HYPERTENSION',
          message: `Blood pressure reading (${r.sys}/${r.dia} mmHg) exceeds standard normal target.`,
          clinicalAction: 'Maintain reduced sodium intake, ensure medication adherence, and continue regular daily logging.',
          createdAt: recordTime,
          isAcknowledged: r.day > 7 // past ones acknowledged
        });
      }

      // Heart Rate Record
      await HealthMeasurement.create({
        user: patientUser._id,
        type: 'heartRate',
        value: r.hr,
        unit: 'bpm',
        recordedAt: recordTime,
        source: 'manual',
        notes: 'Resting pulse',
        isAnomaly: false,
        alertSeverity: 'normal',
        alertCode: 'HEART_RATE_NORMAL',
        alertMessage: `Normal resting heart rate: ${r.hr} bpm.`
      });
    }

    // Fasting Glucose Series
    const glucoseReadings = [
      { day: 12, val: 92, ctx: 'fasting', note: 'Morning fasting' },
      { day: 9,  val: 95, ctx: 'fasting', note: 'Morning fasting' },
      { day: 6,  val: 104, ctx: 'fasting', note: 'Morning fasting - impaired glucose' }, // Mild alert
      { day: 3,  val: 91, ctx: 'fasting', note: 'Morning fasting' },
      { day: 1,  val: 88, ctx: 'fasting', note: 'Morning fasting healthy' }
    ];

    for (const g of glucoseReadings) {
      const recordTime = new Date(now - g.day * dayMs);
      const isAnomaly = g.val >= 100;

      const gluRecord = await HealthMeasurement.create({
        user: patientUser._id,
        type: 'bloodGlucose',
        value: g.val,
        valueDetails: { context: g.ctx },
        unit: 'mg/dL',
        recordedAt: recordTime,
        notes: g.note,
        isAnomaly,
        alertSeverity: isAnomaly ? 'info' : 'normal',
        alertCode: isAnomaly ? 'FASTING_PREDIABETES_RANGE' : 'GLUCOSE_NORMAL',
        alertMessage: isAnomaly ? `Impaired fasting glucose: ${g.val} mg/dL.` : `Fasting glucose normal: ${g.val} mg/dL.`
      });

      if (isAnomaly) {
        await HealthAlert.create({
          user: patientUser._id,
          measurement: gluRecord._id,
          vitalType: 'bloodGlucose',
          triggerValue: g.val,
          unit: 'mg/dL',
          severity: 'info',
          alertCode: 'FASTING_PREDIABETES_RANGE',
          message: `Elevated fasting glucose of ${g.val} mg/dL detected.`,
          clinicalAction: 'Monitor morning readings consistently and limit refined evening carbohydrates.',
          createdAt: recordTime,
          isAcknowledged: true
        });
      }
    }

    // Oxygen Saturation & Temperature
    await HealthMeasurement.create({
      user: patientUser._id,
      type: 'oxygenSaturation',
      value: 98,
      unit: '%',
      recordedAt: new Date(now - 1 * dayMs),
      notes: 'Pulse oximeter reading at room air',
      isAnomaly: false,
      alertSeverity: 'normal'
    });

    await HealthMeasurement.create({
      user: patientUser._id,
      type: 'bodyTemperature',
      value: 98.4,
      unit: '°F',
      recordedAt: new Date(now - 1 * dayMs),
      notes: 'Oral thermometer',
      isAnomaly: false,
      alertSeverity: 'normal'
    });

    // Sleep & Water Intake
    await HealthMeasurement.create({
      user: patientUser._id,
      type: 'sleep',
      value: 7.5,
      valueDetails: { sleepQuality: 'restful' },
      unit: 'hours',
      recordedAt: new Date(now - 1 * dayMs),
      notes: 'Restful 7.5 hours of sleep',
      isAnomaly: false,
      alertSeverity: 'normal'
    });

    await HealthMeasurement.create({
      user: patientUser._id,
      type: 'waterIntake',
      value: 2.2,
      valueDetails: { waterGlasses: 9 },
      unit: 'liters',
      recordedAt: new Date(now - 1 * dayMs),
      notes: '9 glasses of filtered water',
      isAnomaly: false,
      alertSeverity: 'normal'
    });

    // 4. Seed Symptoms
    console.log('[Seed] Populating symptoms...');
    await SymptomRecord.create([
      {
        user: patientUser._id,
        symptom: 'Tension Headache',
        severity: 'mild',
        onset: new Date(now - 6 * dayMs),
        duration: '3 hours',
        bodyLocation: 'Forehead and temples',
        triggers: ['Screen time', 'Work stress'],
        notes: 'Resolved after hydration and rest.'
      },
      {
        user: patientUser._id,
        symptom: 'Afternoon Fatigue',
        severity: 'mild',
        onset: new Date(now - 2 * dayMs),
        duration: '1 hour',
        bodyLocation: 'General',
        triggers: ['Poor sleep night before'],
        notes: 'Felt sluggish around 3 PM.'
      }
    ]);

    // 5. Seed Medications & Reminders
    console.log('[Seed] Populating medications & reminders...');
    const lisinopril = await MedicationRecord.create({
      user: patientUser._id,
      name: 'Lisinopril',
      dosage: '10mg',
      form: 'tablet',
      frequency: 'Once daily',
      timeOfDay: ['08:00'],
      startDate: new Date(now - 60 * dayMs),
      prescribedBy: 'Dr. Sarah Chen, MD',
      instructions: 'Take one tablet every morning with a glass of water',
      purpose: 'Blood pressure regulation'
    });

    const multivitamin = await MedicationRecord.create({
      user: patientUser._id,
      name: 'Omega-3 CoQ10 Complex',
      dosage: '1000mg',
      form: 'capsule',
      frequency: 'Once daily',
      timeOfDay: ['12:30'],
      startDate: new Date(now - 30 * dayMs),
      prescribedBy: 'Over the counter',
      instructions: 'Take with lunch',
      purpose: 'Cardiovascular antioxidant support'
    });

    // Seed Today's reminders
    const morningTime = new Date();
    morningTime.setHours(8, 0, 0, 0);

    const lunchTime = new Date();
    lunchTime.setHours(12, 30, 0, 0);

    await MedicationReminder.create([
      {
        user: patientUser._id,
        medication: lisinopril._id,
        medicationName: 'Lisinopril',
        dosage: '10mg',
        scheduledTime: morningTime,
        status: 'taken',
        loggedAt: new Date()
      },
      {
        user: patientUser._id,
        medication: multivitamin._id,
        medicationName: 'Omega-3 CoQ10 Complex',
        dosage: '1000mg',
        scheduledTime: lunchTime,
        status: 'pending'
      }
    ]);

    // 6. Seed Appointments
    console.log('[Seed] Populating appointments...');
    const upcomingDate = new Date(now + 5 * dayMs);
    upcomingDate.setHours(10, 30, 0, 0);

    await Appointment.create({
      user: patientUser._id,
      doctor: doctorUser._id,
      doctorName: doctorUser.name,
      clinicOrHospital: 'MetroHealth Medical Pavilion - Suite 400',
      specialty: 'Cardiology Review',
      scheduledDate: upcomingDate,
      purpose: 'Routine 6-month blood pressure and metabolic panel follow-up',
      locationType: 'in-person',
      preparationNotes: 'Fast for 8 hours prior if fasting lipid labs are drawn.',
      questionsToAsk: [
        'Are my recent blood pressure averages within our target goal?',
        'Should I continue the 10mg Lisinopril or adjust timing?'
      ],
      status: 'confirmed'
    });

    const pastDate = new Date(now - 45 * dayMs);
    await Appointment.create({
      user: patientUser._id,
      doctor: doctorUser._id,
      doctorName: doctorUser.name,
      clinicOrHospital: 'MetroHealth Medical Pavilion',
      specialty: 'Preventive Health',
      scheduledDate: pastDate,
      purpose: 'Annual physical and vital baseline assessment',
      status: 'completed',
      doctorPostVisitNotes: 'Patient is active, non-smoker. Prescribed 10mg Lisinopril for mild borderline hypertension.'
    });

    // 7. Seed Configurable Clinical Reference Ranges
    console.log('[Seed] Populating reference ranges...');
    await ReferenceRange.create([
      {
        vitalType: 'heartRate',
        displayName: 'Heart Rate',
        unit: 'bpm',
        normalMin: 60,
        normalMax: 100,
        warningLow: 50,
        warningHigh: 110,
        criticalLow: 45,
        criticalHigh: 130,
        clinicalGuideline: 'AHA Standard Adult Resting Guidelines'
      },
      {
        vitalType: 'oxygenSaturation',
        displayName: 'Oxygen Saturation (SpO2)',
        unit: '%',
        normalMin: 95,
        normalMax: 100,
        warningLow: 90,
        warningHigh: 100,
        criticalLow: 88,
        criticalHigh: 100,
        clinicalGuideline: 'WHO Pulse Oximetry Guidelines'
      },
      {
        vitalType: 'respiratoryRate',
        displayName: 'Respiratory Rate',
        unit: 'breaths/min',
        normalMin: 12,
        normalMax: 20,
        warningLow: 10,
        warningHigh: 24,
        criticalLow: 8,
        criticalHigh: 30,
        clinicalGuideline: 'Clinical Respiratory Standard Protocol'
      }
    ]);

    // 8. Seed Audit Log Trail
    console.log('[Seed] Generating initial audit log entries...');
    await AuditLog.create([
      {
        performedBy: patientUser._id,
        performedByRole: 'patient',
        action: 'USER_REGISTERED',
        resourceType: 'User',
        resourceId: patientUser._id
      },
      {
        performedBy: doctorUser._id,
        performedByRole: 'doctor',
        action: 'DOCTOR_VERIFIED',
        resourceType: 'DoctorProfile'
      },
      {
        performedBy: patientUser._id,
        performedByRole: 'patient',
        action: 'CONSENT_GRANTED',
        resourceType: 'PatientConsent',
        patientAffected: patientUser._id,
        details: { doctorName: doctorUser.name }
      }
    ]);

    // 9. Seed Initial Notifications
    await Notification.create([
      {
        user: patientUser._id,
        type: 'appointment',
        title: 'Upcoming Appointment Reminder',
        message: `You have an appointment with ${doctorUser.name} scheduled in 5 days.`,
        actionUrl: '/patient/appointments'
      },
      {
        user: patientUser._id,
        type: 'alert',
        title: 'Vital Notice',
        message: 'Your recent blood pressure readings show good adherence to your target range.',
        actionUrl: '/patient/analytics'
      }
    ]);

    console.log('===========================================================');
    console.log(' SEEDING COMPLETE! DEMO ACCOUNTS READY TO USE:            ');
    console.log(' 1. Patient: patient@healthmonitor.io    / Password123!     ');
    console.log(' 2. Doctor:  doctor@healthmonitor.io     / Password123!     ');
    console.log(' 3. Admin:   admin@healthmonitor.io      / Password123!     ');
    console.log('===========================================================');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
