const aiService = require('../services/aiService');
const HealthMeasurement = require('../models/HealthMeasurement');
const SymptomRecord = require('../models/SymptomRecord');
const MedicationRecord = require('../models/MedicationRecord');
const HealthAlert = require('../models/HealthAlert');
const AIConversation = require('../models/AIConversation');
const { logAudit } = require('../middleware/auditMiddleware');

// @desc Generate AI Health Summary
// @route POST /api/ai/health-summary
exports.getHealthSummary = async (req, res) => {
  try {
    const { days = 30 } = req.body;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const [measurements, symptoms, medications, alerts] = await Promise.all([
      HealthMeasurement.find({ user: req.user.id, recordedAt: { $gte: startDate } }).sort({ recordedAt: -1 }).limit(20).lean(),
      SymptomRecord.find({ user: req.user.id, recordedAt: { $gte: startDate } }).sort({ recordedAt: -1 }).limit(10).lean(),
      MedicationRecord.find({ user: req.user.id, isActive: true }).lean(),
      HealthAlert.find({ user: req.user.id, createdAt: { $gte: startDate } }).sort({ createdAt: -1 }).limit(5).lean()
    ]);

    const result = await aiService.generateHealthSummary({
      vitalsSummary: measurements,
      symptoms,
      medications: medications.map(m => `${m.name} (${m.dosage}, ${m.frequency})`),
      recentAlerts: alerts,
      dateRange: `Past ${days} days`
    });

    await logAudit({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'AI_HEALTH_SUMMARY_GENERATED',
      resourceType: 'AIHealthSummary',
      ipAddress: req.ip
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[AI Summary Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Explain a specific health measurement
// @route POST /api/ai/explain-measurement
exports.explainMeasurement = async (req, res) => {
  try {
    const { vitalType, value, valueDetails, unit } = req.body;

    if (!vitalType || !unit) {
      return res.status(400).json({ success: false, message: 'vitalType and unit are required' });
    }

    const explanation = await aiService.explainMeasurement({
      vitalType,
      value,
      valueDetails,
      unit
    });

    res.json({ success: true, data: explanation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Interactive Chat with AI Health Assistant
// @route POST /api/ai/chat
exports.chatWithAssistant = async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    // Retrieve recent user health snapshot to pass as factual context
    const latestVitals = await HealthMeasurement.find({ user: req.user.id })
      .sort({ recordedAt: -1 })
      .limit(6)
      .lean();

    const activeMeds = await MedicationRecord.find({ user: req.user.id, isActive: true })
      .select('name dosage frequency')
      .lean();

    const healthContext = {
      latestRecordedVitals: latestVitals.map(v => ({
        type: v.type,
        value: v.type === 'bloodPressure' ? `${v.valueDetails?.systolic}/${v.valueDetails?.diastolic}` : v.value,
        unit: v.unit,
        date: v.recordedAt
      })),
      activeMedications: activeMeds
    };

    // Find or create conversation
    let conv;
    if (conversationId) {
      conv = await AIConversation.findOne({ _id: conversationId, user: req.user.id });
    }

    if (!conv) {
      conv = await AIConversation.findOne({ user: req.user.id }).sort({ updatedAt: -1 });
    }

    if (!conv) {
      conv = new AIConversation({
        user: req.user.id,
        title: message.substring(0, 40) + '...',
        messages: []
      });
    }

    // Push user message
    conv.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Call AI service
    const aiResponse = await aiService.chat({
      userMessage: message,
      conversationHistory: conv.messages,
      healthContext
    });

    // Push AI assistant message
    conv.messages.push({
      role: 'assistant',
      content: aiResponse.reply,
      timestamp: new Date()
    });

    await conv.save();

    res.json({
      success: true,
      conversationId: conv._id,
      reply: aiResponse.reply,
      disclaimer: aiResponse.disclaimer,
      source: aiResponse.source
    });
  } catch (error) {
    console.error('[AI Chat Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get recent chat history
// @route GET /api/ai/chat/history
exports.getChatHistory = async (req, res) => {
  try {
    const conv = await AIConversation.findOne({ user: req.user.id }).sort({ updatedAt: -1 });
    res.json({
      success: true,
      conversationId: conv?._id || null,
      messages: conv?.messages || []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
