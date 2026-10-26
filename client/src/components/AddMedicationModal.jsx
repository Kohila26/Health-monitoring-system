import React, { useState } from 'react';
import { apiRequest } from '../services/api';
import { Pill, ShieldAlert, X } from 'lucide-react';

export const AddMedicationModal = ({ isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [form, setForm] = useState('tablet');
  const [frequency, setFrequency] = useState('Once daily');
  const [timeOfDay, setTimeOfDay] = useState('08:00');
  const [prescribedBy, setPrescribedBy] = useState('');
  const [instructions, setInstructions] = useState('Take with water');
  const [purpose, setPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        name,
        dosage,
        form,
        frequency,
        timeOfDay: [timeOfDay],
        prescribedBy,
        instructions,
        purpose,
        startDate: new Date()
      };

      const res = await apiRequest('/medications', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        if (onSuccess) onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to add medication');
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
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Pill size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#ffffff' }}>Add Medication Schedule</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: 0 }}>
                Maintain reminders and track your treatment adherence
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

            <div style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              marginBottom: '16px',
              fontSize: '0.78rem',
              color: '#fcd34d',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <ShieldAlert size={16} style={{ flexShrink: 0 }} />
              <span>
                Safety Disclaimer: This tool manages reminders only. Never start, stop, or change medication dosages without consulting your doctor.
              </span>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Medication Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Lisinopril, Metformin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Dosage Instructions</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 10mg, 1 tablet"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Form</label>
                <select className="form-control" value={form} onChange={(e) => setForm(e.target.value)}>
                  <option value="tablet">Tablet</option>
                  <option value="capsule">Capsule</option>
                  <option value="liquid">Liquid</option>
                  <option value="inhaler">Inhaler</option>
                  <option value="injection">Injection</option>
                  <option value="drops">Drops</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Frequency</label>
                <select className="form-control" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                  <option value="Once daily">Once daily</option>
                  <option value="Twice daily">Twice daily</option>
                  <option value="Three times daily">Three times daily</option>
                  <option value="Every other day">Every other day</option>
                  <option value="As needed">As needed</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Reminder Time</label>
                <input
                  type="time"
                  className="form-control"
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Prescribing Doctor</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Dr. Sarah Chen, MD"
                  value={prescribedBy}
                  onChange={(e) => setPrescribedBy(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Health Goal / Purpose</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Blood pressure control"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Instructions / Notes</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Take with morning meal and plenty of water"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Adding...' : 'Save Medication'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
