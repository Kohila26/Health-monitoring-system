const HealthMeasurement = require('../models/HealthMeasurement');
const HealthAlert = require('../models/HealthAlert');

class HealthAnalyticsService {
  /**
   * Get overall summary of patient vitals
   */
  async getHealthSummary(userId) {
    const vitalTypes = [
      'heartRate',
      'bloodPressure',
      'bloodGlucose',
      'bodyWeight',
      'bmi',
      'bodyTemperature',
      'oxygenSaturation',
      'respiratoryRate',
      'sleep',
      'waterIntake',
      'physicalActivity'
    ];

    const latestVitals = {};

    for (const type of vitalTypes) {
      const latest = await HealthMeasurement.findOne({ user: userId, type })
        .sort({ recordedAt: -1 });
      if (latest) {
        latestVitals[type] = latest;
      }
    }

    // Active unacknowledged alerts count
    const activeAlertsCount = await HealthAlert.countDocuments({
      user: userId,
      isAcknowledged: false
    });

    const criticalAlertsCount = await HealthAlert.countDocuments({
      user: userId,
      severity: 'critical',
      isAcknowledged: false
    });

    const totalMeasurements = await HealthMeasurement.countDocuments({ user: userId });

    return {
      latestVitals,
      activeAlertsCount,
      criticalAlertsCount,
      totalMeasurements
    };
  }

  /**
   * Get time-series trend data for charting
   */
  async getTrends(userId, vitalType, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const query = {
      user: userId,
      recordedAt: { $gte: startDate }
    };

    if (vitalType && vitalType !== 'all') {
      query.type = vitalType;
    }

    const records = await HealthMeasurement.find(query)
      .sort({ recordedAt: 1 })
      .lean();

    // Calculate basic statistics
    let sum = 0;
    let min = Infinity;
    let max = -Infinity;
    let count = 0;

    const formattedData = records.map((r) => {
      let numericVal = r.value;
      let displayVal = `${r.value} ${r.unit}`;

      if (r.type === 'bloodPressure' && r.valueDetails?.systolic) {
        numericVal = r.valueDetails.systolic;
        displayVal = `${r.valueDetails.systolic}/${r.valueDetails.diastolic} ${r.unit}`;
      }

      if (typeof numericVal === 'number' && !isNaN(numericVal)) {
        sum += numericVal;
        if (numericVal < min) min = numericVal;
        if (numericVal > max) max = numericVal;
        count++;
      }

      return {
        id: r._id,
        date: r.recordedAt,
        type: r.type,
        value: r.value,
        systolic: r.valueDetails?.systolic || null,
        diastolic: r.valueDetails?.diastolic || null,
        context: r.valueDetails?.context || null,
        unit: r.unit,
        severity: r.alertSeverity,
        isAnomaly: r.isAnomaly,
        notes: r.notes,
        source: r.source
      };
    });

    return {
      vitalType,
      days,
      count: records.length,
      statistics: count > 0 ? {
        average: Number((sum / count).toFixed(1)),
        min: min === Infinity ? null : min,
        max: max === -Infinity ? null : max
      } : null,
      data: formattedData
    };
  }
}

module.exports = new HealthAnalyticsService();
