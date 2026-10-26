import React, { useState } from 'react';
import { apiRequest } from '../services/api';
import { Calendar, HelpCircle, X } from 'lucide-react';

export const AddAppointmentModal = ({ isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;

  const [doctorName, setDoctorName] = useState('');
  const [clinicOrHospital, setClinicOrHospital] = useState('');
  const [specialty, setSpecialty] = useState('General Practice');
  const [scheduledDate, setScheduledDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [locationType, setLocationType] = useState('in-person');
  const [preparationNotes, setPreparationNotes] = useState('');
  const [questions, setQuestions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        doctorName,
        clinicOrHospital,
        specialty,
        scheduledDate: new Date(scheduledDate),
        purpose,
        locationType,
        preparationNotes,
        questionsToAsk: questions ? questions.split('\n').filter(q => q.trim()) : []
      };

      const res = await apiRequest('/appointments', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        if (onSuccess) onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to schedule appointment');
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
              <Calendar size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#ffffff' }}>Schedule Medical Consultation</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: 0 }}>
                Set up appointment reminders and organize discussion questions
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

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Doctor or Clinic Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Dr. Sarah Chen, MD"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Specialty / Department</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Cardiology, Endocrinology"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Appointment Format</label>
                <select className="form-control" value={locationType} onChange={(e) => setLocationType(e.target.value)}>
                  <option value="in-person">In-Person Consultation</option>
                  <option value="telehealth">Telehealth / Video Call</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Facility / Address or Video Link</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. MetroHealth Pavilion Suite 400"
                value={clinicOrHospital}
                onChange={(e) => setClinicOrHospital(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Purpose of Consultation</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 6-Month Blood Pressure Review & Lab Results"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Questions to Discuss (One per line)</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="e.g.&#10;Is my morning blood pressure in target range?&#10;Should I continue current dosage?"
                value={questions}
                onChange={(e) => setQuestions(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Preparation Instructions</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Fast for 8 hours prior for blood draw"
                value={preparationNotes}
                onChange={(e) => setPreparationNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Confirm Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
