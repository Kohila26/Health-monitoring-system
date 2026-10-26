/**
 * Clinical Reference Rules & Anomaly Guidelines
 * Based on ACC/AHA (Hypertension), ADA (Diabetes), WHO, and AHA (Vitals) guidelines.
 * Rule Version: 2026.1
 */

const CLINICAL_RULES = {
  version: '2026.1',
  rules: {
    heartRate: {
      unit: 'bpm',
      normalMin: 60,
      normalMax: 100,
      warningLow: 50,
      warningHigh: 110,
      criticalLow: 45,
      criticalHigh: 130,
      evaluate: (val) => {
        if (val < 45) return { severity: 'critical', code: 'BRADYCARDIA_CRITICAL', message: `Severe Bradycardia (${val} bpm). Heart rate is dangerously low.`, action: 'Seek immediate emergency medical attention.' };
        if (val > 130) return { severity: 'critical', code: 'TACHYCARDIA_CRITICAL', message: `Severe Tachycardia (${val} bpm). Resting heart rate is markedly elevated.`, action: 'Seek urgent clinical evaluation or emergency care if accompanied by chest pain, shortness of breath, or dizziness.' };
        if (val < 60) return { severity: 'warning', code: 'BRADYCARDIA_MILD', message: `Mild Bradycardia (${val} bpm). Below typical resting range (60-100 bpm).`, action: 'Monitor and mention to your physician, especially if experiencing fatigue or dizziness.' };
        if (val > 100) return { severity: 'warning', code: 'TACHYCARDIA_MILD', message: `Elevated Heart Rate (${val} bpm). Above normal resting range.`, action: 'Rest for 10-15 minutes, hydrate, and re-test. If persistent, consult your doctor.' };
        return { severity: 'normal', code: 'HEART_RATE_NORMAL', message: `Normal resting heart rate (${val} bpm).`, action: 'Maintain healthy lifestyle habits.' };
      }
    },
    bloodPressure: {
      unit: 'mmHg',
      evaluate: (systolic, diastolic) => {
        if (systolic >= 180 || diastolic >= 120) {
          return {
            severity: 'critical',
            code: 'HYPERTENSIVE_CRISIS',
            message: `Hypertensive Crisis detected (${systolic}/${diastolic} mmHg).`,
            action: 'CRITICAL: Wait 5 minutes and test again. If values remain this high or if you experience headache, chest pain, or vision changes, call emergency services immediately.'
          };
        }
        if (systolic >= 140 || diastolic >= 90) {
          return {
            severity: 'warning',
            code: 'STAGE_2_HYPERTENSION',
            message: `Stage 2 Hypertension range (${systolic}/${diastolic} mmHg).`,
            action: 'Schedule a review with your prescribing doctor. Review medication adherence and sodium intake.'
          };
        }
        if (systolic >= 130 || diastolic >= 80) {
          return {
            severity: 'warning',
            code: 'STAGE_1_HYPERTENSION',
            message: `Stage 1 Hypertension range (${systolic}/${diastolic} mmHg).`,
            action: 'Adopt heart-healthy dietary changes, monitor weekly, and discuss with your healthcare professional.'
          };
        }
        if (systolic >= 120 && diastolic < 80) {
          return {
            severity: 'info',
            code: 'ELEVATED_BP',
            message: `Elevated blood pressure (${systolic}/${diastolic} mmHg).`,
            action: 'Focus on lifestyle modifications, physical activity, and stress reduction.'
          };
        }
        if (systolic < 90 || diastolic < 60) {
          return {
            severity: 'warning',
            code: 'HYPOTENSION',
            message: `Low Blood Pressure (${systolic}/${diastolic} mmHg).`,
            action: 'Ensure adequate fluid and electrolyte intake. Sit or stand up slowly. Contact your doctor if you feel dizzy or faint.'
          };
        }
        return {
          severity: 'normal',
          code: 'BP_NORMAL',
          message: `Normal blood pressure (${systolic}/${diastolic} mmHg).`,
          action: 'Great readings. Continue your regular monitoring schedule.'
        };
      }
    },
    bloodGlucose: {
      unit: 'mg/dL',
      evaluate: (val, context = 'fasting') => {
        const isFasting = context === 'fasting';
        if (val < 54) {
          return {
            severity: 'critical',
            code: 'HYPOGLYCEMIA_SEVERE',
            message: `Severe Hypoglycemia (${val} mg/dL). Dangerous drop in blood sugar.`,
            action: 'EMERGENCY: Follow the 15-15 rule immediately (consume 15g fast-acting carbs like juice, re-check in 15 min). Seek emergency assistance if symptoms do not resolve.'
          };
        }
        if (val < 70) {
          return {
            severity: 'warning',
            code: 'HYPOGLYCEMIA_MILD',
            message: `Low blood sugar (${val} mg/dL).`,
            action: 'Consume 15g of fast-acting carbohydrates. Re-test glucose in 15 minutes.'
          };
        }
        if (isFasting) {
          if (val >= 126) {
            return {
              severity: 'warning',
              code: 'FASTING_HYPERGLYCEMIA',
              message: `High fasting glucose (${val} mg/dL, threshold 126 mg/dL).`,
              action: 'Log your morning readings consistently and consult your physician or endocrinologist.'
            };
          }
          if (val >= 100) {
            return {
              severity: 'info',
              code: 'FASTING_PREDIABETES_RANGE',
              message: `Impaired fasting glucose (${val} mg/dL, 100-125 mg/dL).`,
              action: 'Consider nutritional adjustments, regular physical activity, and regular HbA1c screening.'
            };
          }
          return { severity: 'normal', code: 'GLUCOSE_NORMAL', message: `Fasting glucose within healthy range (${val} mg/dL).`, action: 'Keep up healthy nutrition and exercise habits.' };
        } else {
          // Post-meal or random
          if (val >= 200) {
            return {
              severity: 'warning',
              code: 'POSTPRANDIAL_HYPERGLYCEMIA',
              message: `High post-meal glucose (${val} mg/dL, threshold 200 mg/dL).`,
              action: 'Drink water, monitor your next meal carbohydrate portions, and report to your healthcare provider.'
            };
          }
          if (val >= 140) {
            return {
              severity: 'info',
              code: 'POSTPRANDIAL_ELEVATED',
              message: `Elevated post-meal blood sugar (${val} mg/dL).`,
              action: 'Light post-meal walk recommended. Monitor future readings.'
            };
          }
          return { severity: 'normal', code: 'GLUCOSE_NORMAL', message: `Post-meal glucose within normal target (${val} mg/dL).`, action: 'Normal metabolic response.' };
        }
      }
    },
    oxygenSaturation: {
      unit: '%',
      normalMin: 95,
      normalMax: 100,
      warningLow: 90,
      criticalLow: 88,
      evaluate: (val) => {
        if (val < 88) {
          return {
            severity: 'critical',
            code: 'SEVERE_HYPOXEMIA',
            message: `Critically low Oxygen Saturation (${val}%).`,
            action: 'URGENT: Requires prompt medical oxygen evaluation. Call emergency services or go to the nearest emergency room immediately.'
          };
        }
        if (val < 95) {
          return {
            severity: 'warning',
            code: 'MILD_HYPOXEMIA',
            message: `Sub-optimal Oxygen Saturation (${val}%). Normal is 95-100%.`,
            action: 'Take deep breaths in a well-ventilated space. Recheck reading. If accompanied by shortness of breath or persistent, seek medical evaluation.'
          };
        }
        return { severity: 'normal', code: 'SPO2_NORMAL', message: `Normal oxygen saturation (${val}%).`, action: 'Healthy respiratory function.' };
      }
    },
    bodyTemperature: {
      unit: '°F', // also supports °C converted
      evaluate: (val, unit = '°F') => {
        const valF = unit === '°C' ? (val * 9/5) + 32 : val;
        if (valF >= 104) {
          return {
            severity: 'critical',
            code: 'HYPERPYREXIA',
            message: `High dangerous fever (${valF.toFixed(1)}°F / ${((valF-32)*5/9).toFixed(1)}°C).`,
            action: 'Seek urgent medical attention. Use cooling measures and consult a doctor immediately.'
          };
        }
        if (valF >= 100.4) {
          return {
            severity: 'warning',
            code: 'FEVER',
            message: `Fever detected (${valF.toFixed(1)}°F / ${((valF-32)*5/9).toFixed(1)}°C).`,
            action: 'Stay hydrated, rest, and monitor temperature every 3-4 hours. Contact a doctor if fever lasts >48 hours.'
          };
        }
        if (valF < 95) {
          return {
            severity: 'critical',
            code: 'HYPOTHERMIA',
            message: `Hypothermia detected (${valF.toFixed(1)}°F / ${((valF-32)*5/9).toFixed(1)}°C).`,
            action: 'Warm up gently with blankets and warm drinks. Seek medical assessment if persistent.'
          };
        }
        return { severity: 'normal', code: 'TEMP_NORMAL', message: `Normal body temperature (${valF.toFixed(1)}°F).`, action: 'Normal thermoregulation.' };
      }
    },
    respiratoryRate: {
      unit: 'breaths/min',
      evaluate: (val) => {
        if (val > 24) return { severity: 'warning', code: 'TACHYPNEA', message: `Elevated respiratory rate (${val} bpm).`, action: 'Rest and relax. If accompanied by wheezing or chest pain, consult a doctor immediately.' };
        if (val < 10) return { severity: 'critical', code: 'BRADYPNEA', message: `Depressed respiratory rate (${val} bpm).`, action: 'Seek medical assessment promptly.' };
        return { severity: 'normal', code: 'RESP_NORMAL', message: `Normal respiratory rate (${val} bpm).`, action: 'Healthy respiratory rate.' };
      }
    },
    bmi: {
      evaluate: (bmiVal) => {
        if (bmiVal < 18.5) return { severity: 'info', code: 'BMI_UNDERWEIGHT', message: `Underweight BMI (${bmiVal.toFixed(1)}).`, action: 'Consider discussing nutritional support with your physician or dietitian.' };
        if (bmiVal < 25) return { severity: 'normal', code: 'BMI_NORMAL', message: `Healthy BMI (${bmiVal.toFixed(1)}).`, action: 'Maintain balanced nutrition and regular physical activity.' };
        if (bmiVal < 30) return { severity: 'info', code: 'BMI_OVERWEIGHT', message: `Overweight BMI (${bmiVal.toFixed(1)}).`, action: 'Adopt gradual cardiovascular exercise and portion-controlled meals.' };
        return { severity: 'warning', code: 'BMI_OBESE', message: `Obesity range BMI (${bmiVal.toFixed(1)}).`, action: 'Consult your physician for a structured metabolic and cardiovascular health plan.' };
      }
    }
  }
};

module.exports = CLINICAL_RULES;
