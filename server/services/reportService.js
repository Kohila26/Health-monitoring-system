const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const HealthMeasurement = require('../models/HealthMeasurement');
const SymptomRecord = require('../models/SymptomRecord');
const MedicationRecord = require('../models/MedicationRecord');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');
const aiService = require('./aiService');

class ReportService {
  /**
   * Generate PDF health report and write to file
   */
  async generatePDFReport({ userId, startDate, endDate, sections = {}, doctorNotes = '' }) {
    const user = await User.findById(userId).lean();
    const profile = await PatientProfile.findOne({ user: userId }).lean();

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Fetch relevant data within range
    const measurements = await HealthMeasurement.find({
      user: userId,
      recordedAt: { $gte: start, $lte: end }
    }).sort({ recordedAt: -1 }).lean();

    const symptoms = await SymptomRecord.find({
      user: userId,
      recordedAt: { $gte: start, $lte: end }
    }).sort({ recordedAt: -1 }).lean();

    const medications = await MedicationRecord.find({
      user: userId,
      isActive: true
    }).lean();

    const appointments = await Appointment.find({
      user: userId,
      scheduledDate: { $gte: start, $lte: end }
    }).sort({ scheduledDate: 1 }).lean();

    // Generate AI Summary
    let aiSummaryText = '';
    if (sections.aiSummary !== false) {
      const summaryResult = await aiService.generateHealthSummary({
        vitalsSummary: measurements.slice(0, 15),
        symptoms: symptoms.slice(0, 10),
        medications: medications.map(m => `${m.name} (${m.dosage})`),
        recentAlerts: measurements.filter(m => m.isAnomaly),
        dateRange: `${start.toLocaleDateString()} to ${end.toLocaleDateString()}`
      });
      aiSummaryText = summaryResult.content;
    }

    // Ensure reports directory exists
    const reportsDir = path.join(__dirname, '../uploads/reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filename = `health_report_${userId}_${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, filename);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // Header Banner
      doc.rect(40, 40, 515, 60).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold')
        .text('CLINICAL HEALTH MONITORING REPORT', 55, 52);
      doc.fontSize(10).font('Helvetica')
        .text(`Generated on: ${new Date().toLocaleString()} | Period: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`, 55, 78);

      doc.moveDown(3);

      // Patient Demographics Box
      doc.fillColor('#1e293b').fontSize(14).font('Helvetica-Bold').text('1. PATIENT DEMOGRAPHICS', 40, 120);
      doc.rect(40, 138, 515, 65).fillAndStroke('#f8fafc', '#cbd5e1');

      doc.fillColor('#334155').fontSize(10).font('Helvetica')
        .text(`Name: ${user?.name || 'N/A'}`, 55, 148)
        .text(`Email: ${user?.email || 'N/A'}`, 55, 164)
        .text(`Gender: ${profile?.gender || 'Not specified'}`, 55, 180)
        .text(`Blood Group: ${profile?.bloodGroup || 'Unknown'}`, 260, 148)
        .text(`Height: ${profile?.height ? profile.height + ' cm' : 'N/A'}`, 260, 164)
        .text(`Weight: ${profile?.weight ? profile.weight + ' kg' : 'N/A'}`, 260, 180)
        .text(`Emergency: ${profile?.emergencyContact?.name || 'N/A'} (${profile?.emergencyContact?.phone || 'N/A'})`, 400, 148);

      let currentY = 220;

      // AI Summary Section
      if (sections.aiSummary !== false && aiSummaryText) {
        doc.fillColor('#1e293b').fontSize(14).font('Helvetica-Bold').text('2. AI-GENERATED CLINICAL HEALTH SUMMARY', 40, currentY);
        currentY += 20;

        // Clean markdown marks for clean PDF print
        const cleanSummary = aiSummaryText.replace(/[#*`_]/g, '');

        doc.rect(40, currentY, 515, 120).fillAndStroke('#f0f9ff', '#93c5fd');
        doc.fillColor('#0369a1').fontSize(8).font('Helvetica-Bold')
          .text('[AI-GENERATED CONTENT - FOR INFORMATIONAL USE ONLY - NOT A MEDICAL DIAGNOSIS]', 50, currentY + 8);

        doc.fillColor('#0f172a').fontSize(9).font('Helvetica')
          .text(cleanSummary.substring(0, 600) + '...', 50, currentY + 24, { width: 495, lineGap: 3 });

        currentY += 135;
      }

      // Vitals Measurements Table
      doc.fillColor('#1e293b').fontSize(14).font('Helvetica-Bold').text('3. RECORDED VITALS & MEASUREMENTS', 40, currentY);
      currentY += 20;

      // Table Header
      doc.rect(40, currentY, 515, 20).fill('#0284c7');
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold')
        .text('Date & Time', 45, currentY + 5)
        .text('Category', 150, currentY + 5)
        .text('Value', 270, currentY + 5)
        .text('Status / Severity', 390, currentY + 5)
        .text('Source', 480, currentY + 5);

      currentY += 22;

      const recentMeasurements = measurements.slice(0, 10);
      if (recentMeasurements.length === 0) {
        doc.fillColor('#64748b').fontSize(9).font('Helvetica')
          .text('No measurements recorded for the selected date range.', 45, currentY);
        currentY += 25;
      } else {
        recentMeasurements.forEach((m, idx) => {
          const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
          doc.rect(40, currentY, 515, 18).fill(bg);

          let displayVal = `${m.value} ${m.unit}`;
          if (m.type === 'bloodPressure' && m.valueDetails) {
            displayVal = `${m.valueDetails.systolic}/${m.valueDetails.diastolic} mmHg`;
          }

          doc.fillColor('#334155').fontSize(8).font('Helvetica')
            .text(new Date(m.recordedAt).toLocaleDateString(), 45, currentY + 4)
            .text(m.type, 150, currentY + 4)
            .text(displayVal, 270, currentY + 4)
            .text(m.alertSeverity.toUpperCase(), 390, currentY + 4)
            .text(m.source || 'manual', 480, currentY + 4);

          currentY += 20;
        });
      }

      currentY += 10;

      // Medications & Symptoms Summary
      doc.fillColor('#1e293b').fontSize(14).font('Helvetica-Bold').text('4. ACTIVE MEDICATIONS & SYMPTOM LOG', 40, currentY);
      currentY += 20;

      doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold').text('Medications:', 45, currentY);
      currentY += 14;
      if (medications.length === 0) {
        doc.font('Helvetica').text('No active medications on file.', 55, currentY);
        currentY += 16;
      } else {
        medications.slice(0, 4).forEach((med) => {
          doc.font('Helvetica').text(`• ${med.name} - ${med.dosage} (${med.frequency}) [Prescribed by: ${med.prescribedBy || 'Self-reported'}]`, 55, currentY);
          currentY += 14;
        });
      }

      currentY += 6;
      doc.font('Helvetica-Bold').text('Recent Logged Symptoms:', 45, currentY);
      currentY += 14;
      if (symptoms.length === 0) {
        doc.font('Helvetica').text('No symptoms reported during this period.', 55, currentY);
        currentY += 16;
      } else {
        symptoms.slice(0, 4).forEach((s) => {
          doc.font('Helvetica').text(`• ${s.symptom} (${s.severity.toUpperCase()}) - ${new Date(s.recordedAt).toLocaleDateString()}`, 55, currentY);
          currentY += 14;
        });
      }

      // Doctor Notes
      if (doctorNotes) {
        currentY += 10;
        doc.fillColor('#1e293b').fontSize(14).font('Helvetica-Bold').text('5. HEALTHCARE PROFESSIONAL NOTES', 40, currentY);
        currentY += 18;
        doc.rect(40, currentY, 515, 45).fillAndStroke('#fefce8', '#facc15');
        doc.fillColor('#854d0e').fontSize(9).font('Helvetica')
          .text(doctorNotes, 50, currentY + 8, { width: 495 });
        currentY += 55;
      }

      // Mandatory Safety Disclaimer at bottom
      doc.rect(40, 750, 515, 45).fill('#f1f5f9');
      doc.fillColor('#64748b').fontSize(7).font('Helvetica-Bold')
        .text('MANDATORY HEALTHCARE & LEGAL DISCLAIMER:', 50, 755);
      doc.font('Helvetica')
        .text('This document is compiled automatically from user-entered logs and automated analytical systems. It does not constitute a diagnostic workup, official medical prescription, or emergency evaluation. If you are experiencing chest pain, difficulty breathing, or severe sudden symptoms, call emergency services immediately.', 50, 765, { width: 495 });

      doc.end();

      stream.on('finish', () => {
        resolve({
          filePath,
          filename,
          url: `/api/reports/download/${filename}`,
          aiSummaryText,
          measurementsCount: measurements.length
        });
      });

      stream.on('error', (err) => {
        reject(err);
      });
    });
  }
}

module.exports = new ReportService();
