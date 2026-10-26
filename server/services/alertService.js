const CLINICAL_RULES = require('../config/rules');
const HealthMeasurement = require('../models/HealthMeasurement');
const HealthAlert = require('../models/HealthAlert');
const Notification = require('../models/Notification');
const ReferenceRange = require('../models/ReferenceRange');

class AlertService {
  /**
   * Evaluate a measurement against clinical rules and reference ranges
   */
  async evaluateMeasurement(userId, measurementData) {
    const { type, value, valueDetails, unit } = measurementData;
    let evaluation = { severity: 'normal', code: '', message: '', action: '' };

    // Check if custom reference range exists in DB
    const customRange = await ReferenceRange.findOne({ vitalType: type });

    switch (type) {
      case 'heartRate':
        if (customRange && customRange.criticalLow && customRange.criticalHigh) {
          if (value < customRange.criticalLow) {
            evaluation = { severity: 'critical', code: 'BRADYCARDIA_CRITICAL', message: `Critical low heart rate: ${value} bpm.`, action: 'Seek immediate emergency medical care.' };
          } else if (value > customRange.criticalHigh) {
            evaluation = { severity: 'critical', code: 'TACHYCARDIA_CRITICAL', message: `Critical high heart rate: ${value} bpm.`, action: 'Seek urgent medical attention.' };
          } else if (value < customRange.warningLow) {
            evaluation = { severity: 'warning', code: 'BRADYCARDIA_MILD', message: `Low resting heart rate: ${value} bpm.`, action: 'Monitor and mention to your physician.' };
          } else if (value > customRange.warningHigh) {
            evaluation = { severity: 'warning', code: 'TACHYCARDIA_MILD', message: `Elevated heart rate: ${value} bpm.`, action: 'Rest and recheck in 15 minutes.' };
          } else {
            evaluation = { severity: 'normal', code: 'HEART_RATE_NORMAL', message: `Normal heart rate (${value} bpm).`, action: 'Keep up healthy habits.' };
          }
        } else {
          evaluation = CLINICAL_RULES.rules.heartRate.evaluate(value);
        }
        break;

      case 'bloodPressure':
        const sys = valueDetails?.systolic;
        const dia = valueDetails?.diastolic;
        if (sys && dia) {
          evaluation = CLINICAL_RULES.rules.bloodPressure.evaluate(sys, dia);
        }
        break;

      case 'bloodGlucose':
        const context = valueDetails?.context || 'fasting';
        evaluation = CLINICAL_RULES.rules.bloodGlucose.evaluate(value, context);
        break;

      case 'oxygenSaturation':
        evaluation = CLINICAL_RULES.rules.oxygenSaturation.evaluate(value);
        break;

      case 'bodyTemperature':
        evaluation = CLINICAL_RULES.rules.bodyTemperature.evaluate(value, unit || '°F');
        break;

      case 'respiratoryRate':
        evaluation = CLINICAL_RULES.rules.respiratoryRate.evaluate(value);
        break;

      case 'bmi':
        evaluation = CLINICAL_RULES.rules.bmi.evaluate(value);
        break;

      default:
        evaluation = { severity: 'normal', code: 'RECORDED', message: 'Measurement recorded successfully.', action: 'Continue tracking.' };
    }

    // Check for acute delta / historical sudden jump
    const lastMeasurement = await HealthMeasurement.findOne({
      user: userId,
      type,
      _id: { $ne: measurementData._id }
    }).sort({ recordedAt: -1 });

    let deltaAlert = null;
    if (lastMeasurement) {
      if (type === 'heartRate' && Math.abs(value - lastMeasurement.value) >= 35) {
        deltaAlert = `Acute shift in heart rate of ${Math.abs(value - lastMeasurement.value)} bpm compared to previous record (${lastMeasurement.value} bpm).`;
      } else if (type === 'bloodPressure' && valueDetails?.systolic && lastMeasurement.valueDetails?.systolic) {
        const diff = Math.abs(valueDetails.systolic - lastMeasurement.valueDetails.systolic);
        if (diff >= 30) {
          deltaAlert = `Acute systolic blood pressure change of ${diff} mmHg from previous reading (${lastMeasurement.valueDetails.systolic} mmHg).`;
        }
      }
    }

    const isAnomaly = evaluation.severity === 'warning' || evaluation.severity === 'critical' || Boolean(deltaAlert);

    return {
      isAnomaly,
      severity: evaluation.severity,
      code: evaluation.code,
      message: deltaAlert ? `${evaluation.message} Note: ${deltaAlert}` : evaluation.message,
      action: evaluation.action,
      ruleVersion: CLINICAL_RULES.version
    };
  }

  /**
   * Create an alert document and corresponding user notification
   */
  async triggerAlert(userId, measurementId, evaluation, vitalType, triggerValue, unit) {
    if (evaluation.severity === 'normal') return null;

    const alert = await HealthAlert.create({
      user: userId,
      measurement: measurementId,
      vitalType,
      triggerValue,
      unit,
      severity: evaluation.severity,
      alertCode: evaluation.code,
      message: evaluation.message,
      clinicalAction: evaluation.action,
      ruleVersion: evaluation.ruleVersion || '2026.1'
    });

    // Create In-App Notification
    await Notification.create({
      user: userId,
      type: 'alert',
      title: `${evaluation.severity.toUpperCase()} Alert: ${vitalType}`,
      message: evaluation.message,
      severity: evaluation.severity,
      actionUrl: '/patient/analytics'
    });

    return alert;
  }
}

module.exports = new AlertService();
