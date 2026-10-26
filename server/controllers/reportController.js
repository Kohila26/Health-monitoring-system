const HealthReport = require('../models/HealthReport');
const reportService = require('../services/reportService');
const path = require('path');
const fs = require('fs');
const { logAudit } = require('../middleware/auditMiddleware');

// @desc Generate a new PDF health report
// @route POST /api/reports
exports.generateReport = async (req, res) => {
  try {
    const { title, startDate, endDate, includedSections, doctorNotes } = req.body;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const pdfResult = await reportService.generatePDFReport({
      userId: req.user.id,
      startDate: start,
      endDate: end,
      sections: includedSections || {},
      doctorNotes: doctorNotes || ''
    });

    const report = await HealthReport.create({
      user: req.user.id,
      title: title || 'Comprehensive Health Monitoring Summary',
      dateRange: { startDate: start, endDate: end },
      includedSections: includedSections || {
        measurements: true,
        vitalsSummary: true,
        symptoms: true,
        medications: true,
        appointments: true,
        aiSummary: true
      },
      summaryStats: {
        totalMeasurements: pdfResult.measurementsCount
      },
      aiSummary: {
        text: pdfResult.aiSummaryText,
        modelUsed: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        generatedAt: new Date()
      },
      doctorNotes: doctorNotes || '',
      pdfUrl: pdfResult.url,
      status: 'generated'
    });

    await logAudit({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'HEALTH_REPORT_GENERATED',
      resourceType: 'HealthReport',
      resourceId: report._id,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Health report generated successfully',
      data: report,
      downloadUrl: pdfResult.url
    });
  } catch (error) {
    console.error('[Report Generation Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get list of generated reports
// @route GET /api/reports
exports.getReports = async (req, res) => {
  try {
    const reports = await HealthReport.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Download generated PDF report
// @route GET /api/reports/download/:filename
exports.downloadReportFile = async (req, res) => {
  try {
    const { filename } = req.params;
    // Sanitization against path traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(__dirname, '../uploads/reports', safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Report PDF file not found.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
