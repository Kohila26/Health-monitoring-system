const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log(' RUNNING COMPREHENSIVE ENDPOINT VERIFICATION TESTS  ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function assert(desc, fn) {
    try {
      await fn();
      console.log(`[PASS] ${desc}`);
      passed++;
    } catch (e) {
      console.error(`[FAIL] ${desc}: ${e.message}`);
      failed++;
    }
  }

  // 1. Health check
  await assert('GET /api/health returns status ok', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error(`Status was ${data.status}`);
  });

  // 2. Patient Login
  let patientToken = '';
  let patientId = '';
  await assert('POST /api/auth/login logs in demo patient', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'patient@healthmonitor.io', password: 'Password123!' })
    });
    const data = await res.json();
    if (!data.success || !data.token) throw new Error(data.message || 'Login failed');
    patientToken = data.token;
    patientId = data.user.id;
  });

  // 3. Doctor Login
  let doctorToken = '';
  let doctorId = '';
  await assert('POST /api/auth/login logs in demo doctor', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'doctor@healthmonitor.io', password: 'Password123!' })
    });
    const data = await res.json();
    if (!data.success || !data.token) throw new Error(data.message || 'Login failed');
    doctorToken = data.token;
    doctorId = data.user.id;
  });

  // 4. Admin Login
  let adminToken = '';
  await assert('POST /api/auth/login logs in system admin', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@healthmonitor.io', password: 'Password123!' })
    });
    const data = await res.json();
    if (!data.success || !data.token) throw new Error(data.message || 'Login failed');
    adminToken = data.token;
  });

  // 5. Patient Records a Vital with Anomaly Check (Stage 2 Hypertension)
  let createdMeasurementId = '';
  await assert('POST /api/measurements logs blood pressure & evaluates clinical rule', async () => {
    const res = await fetch(`${BASE_URL}/measurements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientToken}`
      },
      body: JSON.stringify({
        type: 'bloodPressure',
        unit: 'mmHg',
        source: 'bp_cuff',
        notes: 'Evening post-walk reading',
        valueDetails: { systolic: 142, diastolic: 92 }
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    if (!data.evaluation.isAnomaly) throw new Error('Expected 142/92 to trigger anomaly alert');
    createdMeasurementId = data.data._id;
  });

  // 6. Get Trends & Summary
  await assert('GET /api/health/summary returns aggregated vitals snapshot', async () => {
    const res = await fetch(`${BASE_URL}/health/summary`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    const data = await res.json();
    if (!data.success || !data.data.latestVitals) throw new Error('Summary missing latest vitals');
  });

  await assert('GET /api/health/trends returns time-series data for charting', async () => {
    const res = await fetch(`${BASE_URL}/health/trends?vitalType=bloodPressure&days=30`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    const data = await res.json();
    if (!data.success || !Array.isArray(data.data.data)) throw new Error('Trends missing data array');
  });

  // 7. Acknowledge Alert
  await assert('POST /api/health/alerts/:id/acknowledge marks alert acknowledged with note', async () => {
    const listRes = await fetch(`${BASE_URL}/health/alerts?status=unacknowledged`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    const listData = await listRes.json();
    if (listData.data.length > 0) {
      const alertId = listData.data[0]._id;
      const ackRes = await fetch(`${BASE_URL}/health/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${patientToken}`
        },
        body: JSON.stringify({ userResponseNote: 'Rested for 10 min, hydrated, re-checking BP.' })
      });
      const ackData = await ackRes.json();
      if (!ackData.success || !ackData.data.isAcknowledged) throw new Error('Failed to acknowledge alert');
    }
  });

  // 8. AI Assistant Chat & Explain Measurement
  await assert('POST /api/ai/explain-measurement explains resting heart rate reading', async () => {
    const res = await fetch(`${BASE_URL}/ai/explain-measurement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientToken}`
      },
      body: JSON.stringify({
        vitalType: 'heartRate',
        value: 74,
        unit: 'bpm'
      })
    });
    const data = await res.json();
    if (!data.success || !data.data.content) throw new Error('Explanation content missing');
  });

  await assert('POST /api/ai/chat returns safe clinical advice with medical disclaimer', async () => {
    const res = await fetch(`${BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientToken}`
      },
      body: JSON.stringify({
        message: 'What questions should I ask my doctor about my high blood pressure?'
      })
    });
    const data = await res.json();
    if (!data.success || !data.reply || !data.disclaimer) throw new Error('AI reply or disclaimer missing');
  });

  // 9. Generate PDF Health Report
  let reportDownloadUrl = '';
  await assert('POST /api/reports generates structured PDF clinical summary', async () => {
    const res = await fetch(`${BASE_URL}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientToken}`
      },
      body: JSON.stringify({
        title: 'Q4 Cardiology Monitoring Summary',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        includedSections: {
          measurements: true,
          vitalsSummary: true,
          symptoms: true,
          medications: true,
          appointments: true,
          aiSummary: true
        }
      })
    });
    const data = await res.json();
    if (!data.success || !data.downloadUrl) throw new Error('Report generation failed');
    reportDownloadUrl = data.downloadUrl;
  });

  // 10. Doctor Module - View Consented Patients & Add Notes
  await assert('GET /api/doctor/patients lists patients who granted explicit consent', async () => {
    const res = await fetch(`${BASE_URL}/doctor/patients`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    const data = await res.json();
    if (!data.success || !Array.isArray(data.data)) throw new Error('Failed to retrieve patients');
  });

  await assert('POST /api/doctor/patients/:patientId/notes adds signed physician note', async () => {
    const res = await fetch(`${BASE_URL}/doctor/patients/${patientId}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      },
      body: JSON.stringify({
        note: 'Systolic blood pressure responsive to lifestyle modification and Lisinopril.',
        recommendation: 'Maintain hydration, continue morning BP logs, follow up in 3 months.'
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to add doctor note');
  });

  // 11. Admin Module - Overview & Audit Trail
  await assert('GET /api/admin/dashboard returns system status and metrics', async () => {
    const res = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (!data.success || !data.data.stats) throw new Error('Admin stats missing');
  });

  await assert('GET /api/admin/audit-logs returns immutable HIPAA access log records', async () => {
    const res = await fetch(`${BASE_URL}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (!data.success || !Array.isArray(data.data)) throw new Error('Audit logs missing');
  });

  console.log('\n====================================================');
  console.log(` TEST SUMMARY: ${passed} PASSED, ${failed} FAILED `);
  console.log('====================================================');
}

runTests().catch(console.error);
