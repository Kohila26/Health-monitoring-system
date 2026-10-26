import React, { useState } from 'react';
import { apiRequest } from '../services/api';
import { Activity, AlertTriangle, X } from 'lucide-react';

export const AddSymptomModal = ({ isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;

  const [symptom, setSymptom] = useState('');
  const [severity, setSeverity] = useState('mild');
  const [duration, setDuration] = useState('Current / Ongoing');
  const [bodyLocation, setBodyLocation] = useState('General');
  const [triggers, setTriggers] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isRedFlagPotential = ['chest pain', 'shortness of breath', 'difficulty breathing', 'numbness', 'vision loss']
    .some(term => symptom.toLowerCase().includes(term));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        symptom,
        severity,
        duration,
        bodyLocation,
        triggers: triggers ? triggers.split(',').map(t => t.trim()) : [],
        notes,
        onset: new Date()
      };

      const res = await apiRequest('/symptoms', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        if (onSuccess) onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to record symptom');
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
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Activity size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#ffffff' }}>Log Clinical Symptom</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: 0 }}>
                Document symptoms to review patterns and discuss with your physician
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
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
                fontSize: '0.85rem'
              }}>
                {error}
              </div>
            )}

            {(isRedFlagPotential || severity === 'critical') && (
              <div style={{
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                color: '#fca5a5',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}>
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Potential Emergency Symptom:</strong> If you are experiencing acute chest pain, trouble breathing, or sudden numbness, call 911 or go to the emergency room immediately.
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Symptom Description</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Throbbing Headache, Persistent Cough, Lightheadedness"
                value={symptom}
                onChange={(e) => setSymptom(e.target.value)}
                required
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Severity Level</label>
                <select className="form-control" value={severity} onChange={(e) => setSeverity(e.target.value)}>
                  <option value="mild">Mild - Noticeable but doesn't disrupt routine</option>
                  <option value="moderate">Moderate - Disrupts everyday activity</option>
                  <option value="severe">Severe - Incapacitating / high pain</option>
                  <option value="critical">Critical - Emergency attention needed</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Body Location</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Head, Chest, Left shoulder, Abdomen"
                  value={bodyLocation}
                  onChange={(e) => setBodyLocation(e.target.value)}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Duration</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 2 hours, intermittent for 3 days"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Possible Triggers (Comma separated)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Stress, dehydration, exercise"
                  value={triggers}
                  onChange={(e) => setTriggers(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Additional Observations & Notes</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Describe any relieving factors, temperature, or associated sensations"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Log Symptom'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
