import React, { useState } from 'react';
import { apiRequest } from '../services/api';
import { AlertCircle, CheckCircle2, HeartPulse, X } from 'lucide-react';

export const AddMeasurementModal = ({ isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;

  const [type, setType] = useState('heartRate');
  const [value, setValue] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [glucoseContext, setGlucoseContext] = useState('fasting');
  const [unit, setUnit] = useState('bpm');
  const [source, setSource] = useState('manual');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [alertResult, setAlertResult] = useState(null);

  // Auto update default unit when vital type changes
  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setType(newType);
    setError('');
    switch (newType) {
      case 'heartRate': setUnit('bpm'); break;
      case 'bloodPressure': setUnit('mmHg'); break;
      case 'bloodGlucose': setUnit('mg/dL'); break;
      case 'oxygenSaturation': setUnit('%'); break;
      case 'bodyTemperature': setUnit('°F'); break;
      case 'bodyWeight': setUnit('kg'); break;
      case 'height': setUnit('cm'); break;
      case 'bmi': setUnit('kg/m²'); break;
      case 'respiratoryRate': setUnit('breaths/min'); break;
      case 'sleep': setUnit('hours'); break;
      case 'physicalActivity': setUnit('minutes'); break;
      case 'waterIntake': setUnit('liters'); break;
      default: setUnit('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setAlertResult(null);
    setSubmitting(true);

    try {
      const payload = {
        type,
        unit,
        source,
        notes,
        recordedAt: new Date()
      };

      if (type === 'bloodPressure') {
        if (!systolic || !diastolic) {
          throw new Error('Please enter both systolic and diastolic blood pressure values.');
        }
        payload.value = parseFloat(systolic);
        payload.valueDetails = {
          systolic: parseFloat(systolic),
          diastolic: parseFloat(diastolic)
        };
      } else {
        if (!value || isNaN(value)) {
          throw new Error('Please enter a valid numeric measurement value.');
        }
        payload.value = parseFloat(value);
        if (type === 'bloodGlucose') {
          payload.valueDetails = { context: glucoseContext };
        }
      }

      const res = await apiRequest('/measurements', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        if (res.evaluation && res.evaluation.severity !== 'normal') {
          setAlertResult(res.evaluation);
          setTimeout(() => {
            if (onSuccess) onSuccess(res.data);
            onClose();
          }, 2200);
        } else {
          if (onSuccess) onSuccess(res.data);
          onClose();
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to record measurement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <HeartPulse size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#ffffff' }}>Record Health Measurement</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: 0 }}>
                Logged data is verified against clinical reference rules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid var(--danger-border)',
                color: '#f87171',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {alertResult && (
              <div style={{
                background: alertResult.severity === 'critical' ? 'var(--danger-bg)' : 'var(--warning-bg)',
                border: `1px solid ${alertResult.severity === 'critical' ? 'var(--danger-border)' : 'var(--warning-border)'}`,
                color: alertResult.severity === 'critical' ? '#fca5a5' : '#fcd34d',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
                fontSize: '0.86rem'
              }}>
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                  Clinical Notice ({alertResult.severity.toUpperCase()}):
                </div>
                <div>{alertResult.message}</div>
                <div style={{ marginTop: '6px', fontSize: '0.78rem', color: 'var(--text-main)' }}>
                  <strong>Next Step:</strong> {alertResult.action}
                </div>
              </div>
            )}

            {/* Vital Type Selector */}
            <div className="form-group">
              <label className="form-label">Vital Category</label>
              <select className="form-control" value={type} onChange={handleTypeChange}>
                <option value="heartRate">Heart Rate (bpm)</option>
                <option value="bloodPressure">Blood Pressure (Systolic / Diastolic)</option>
                <option value="bloodGlucose">Blood Glucose (mg/dL)</option>
                <option value="oxygenSaturation">Oxygen Saturation (SpO2 %)</option>
                <option value="bodyTemperature">Body Temperature (°F)</option>
                <option value="bodyWeight">Body Weight (kg)</option>
                <option value="height">Height (cm)</option>
                <option value="bmi">Body Mass Index (BMI)</option>
                <option value="respiratoryRate">Respiratory Rate (breaths/min)</option>
                <option value="sleep">Sleep Duration (hours)</option>
                <option value="physicalActivity">Physical Activity (minutes)</option>
                <option value="waterIntake">Water Intake (liters)</option>
              </select>
            </div>

            {/* Measurement Value Fields */}
            {type === 'bloodPressure' ? (
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Systolic (Top Number)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 120"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Target: &lt;120 mmHg</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Diastolic (Bottom Number)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 80"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Target: &lt;80 mmHg</span>
                </div>
              </div>
            ) : (
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Measurement Value</label>
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    placeholder="Enter value"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <input
                    type="text"
                    className="form-control"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* Context for Blood Glucose */}
            {type === 'bloodGlucose' && (
              <div className="form-group">
                <label className="form-label">Measurement Context</label>
                <select
                  className="form-control"
                  value={glucoseContext}
                  onChange={(e) => setGlucoseContext(e.target.value)}
                >
                  <option value="fasting">Fasting (Before Breakfast)</option>
                  <option value="post_meal">Post-Meal (2 Hours After Eating)</option>
                  <option value="random">Random / Daytime</option>
                  <option value="bedtime">Bedtime</option>
                </select>
              </div>
            )}

            {/* Source Selection (Manual vs Medical Device) */}
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Data Source</label>
                <select className="form-control" value={source} onChange={(e) => setSource(e.target.value)}>
                  <option value="manual">Manual Entry</option>
                  <option value="smart_watch">Smart Watch / Wearable</option>
                  <option value="bp_cuff">Digital BP Monitor</option>
                  <option value="glucometer">Home Glucometer</option>
                  <option value="pulse_oximeter">Pulse Oximeter</option>
                  <option value="smart_scale">Connected Scale</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Optional Clinical Notes</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Taken after 10 min rest"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Verifying & Saving...' : 'Save Measurement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
