import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import {
  CheckCircle,
  FileText,
  Lock,
  Plus,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  Trash2,
  User,
  XCircle
} from 'lucide-react';

export const DoctorSharingPage = () => {
  const [consents, setConsents] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Grant Consent Modal
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [permMeasurements, setPermMeasurements] = useState(true);
  const [permSymptoms, setPermSymptoms] = useState(true);
  const [permMedications, setPermMedications] = useState(true);
  const [permReports, setPermReports] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchSharingData = async () => {
    try {
      setLoading(true);
      const [consRes, docRes] = await Promise.all([
        apiRequest('/consent'),
        apiRequest('/doctor/directory')
      ]);

      if (consRes.success) setConsents(consRes.data || []);
      if (docRes.success) {
        setDoctors(docRes.data || []);
        if (docRes.data.length > 0) setSelectedDoctorId(docRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load doctor sharing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSharingData();
  }, []);

  const handleGrantConsent = async (e) => {
    e.preventDefault();
    if (!selectedDoctorId) return;
    setSubmitting(true);

    try {
      const payload = {
        doctorId: selectedDoctorId,
        permissions: {
          measurements: permMeasurements,
          symptoms: permSymptoms,
          medications: permMedications,
          reports: permReports,
          addNotes: true
        }
      };

      const res = await apiRequest('/consent', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        setIsModalOpen(false);
        fetchSharingData();
      }
    } catch (err) {
      alert(err.message || 'Failed to grant consent');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeConsent = async (consentId) => {
    if (!window.confirm('Are you sure you want to revoke this healthcare professional’s access to your records?')) return;
    try {
      await apiRequest(`/consent/${consentId}/revoke`, { method: 'PUT' });
      fetchSharingData();
    } catch (err) {
      alert(err.message || 'Failed to revoke consent');
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 className="title-xl">Doctor Sharing & Explicit Consent</h1>
          <p className="subtitle">
            Control which verified physicians can access your health measurements, symptoms, and medical notes
          </p>
        </div>

        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <Plus size={16} />
          <span>Authorize Physician</span>
        </button>
      </div>

      {/* Security Protocol Notice */}
      <div style={{
        background: 'rgba(16, 185, 129, 0.08)',
        border: '1px solid var(--success-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '14px 18px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <ShieldCheck size={20} color="#10b981" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.82rem', color: '#a7f3d0', lineHeight: 1.45 }}>
          <strong>Granular Access Control:</strong> Doctors cannot view your data without explicit active consent. You can grant access, modify permissions, or immediately revoke access at any time with an immutable audit trail.
        </div>
      </div>

      {/* Active Consents */}
      <div className="glass-card" style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.15rem', color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Share2 size={18} color="#38bdf8" /> Current Doctor Access Permissions
        </h3>

        {consents.length === 0 ? (
          <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.88rem' }}>
            You haven't shared your health records with any doctors yet. Authorize a doctor from the directory below.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {consents.map((c) => {
              const isActive = c.status === 'active';
              return (
                <div
                  key={c._id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${isActive ? 'rgba(56, 189, 248, 0.25)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'rgba(56, 189, 248, 0.12)',
                        color: '#38bdf8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Stethoscope size={20} />
                      </div>

                      <div>
                        <h4 style={{ fontSize: '1.05rem', color: '#ffffff', marginBottom: '2px' }}>
                          {c.doctor?.name || 'Verified Healthcare Provider'}
                        </h4>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                          {c.doctor?.email} • Authorized on {new Date(c.grantedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className={`badge ${isActive ? 'badge-normal' : 'badge-warning'}`}>
                        {c.status.toUpperCase()}
                      </span>

                      {isActive && (
                        <button
                          onClick={() => handleRevokeConsent(c._id)}
                          className="btn btn-danger btn-sm"
                        >
                          <XCircle size={14} /> Revoke Access
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Permissions Pills */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span className={`badge ${c.permissions?.measurements ? 'badge-normal' : 'badge-warning'}`} style={{ fontSize: '0.72rem' }}>
                      Vitals: {c.permissions?.measurements ? 'Granted' : 'Restricted'}
                    </span>
                    <span className={`badge ${c.permissions?.symptoms ? 'badge-normal' : 'badge-warning'}`} style={{ fontSize: '0.72rem' }}>
                      Symptoms: {c.permissions?.symptoms ? 'Granted' : 'Restricted'}
                    </span>
                    <span className={`badge ${c.permissions?.medications ? 'badge-normal' : 'badge-warning'}`} style={{ fontSize: '0.72rem' }}>
                      Medications: {c.permissions?.medications ? 'Granted' : 'Restricted'}
                    </span>
                    <span className={`badge ${c.permissions?.reports ? 'badge-normal' : 'badge-warning'}`} style={{ fontSize: '0.72rem' }}>
                      Reports: {c.permissions?.reports ? 'Granted' : 'Restricted'}
                    </span>
                  </div>

                  {/* Doctor Notes Authored for this Patient */}
                  {c.doctorProfessionalNotes && c.doctorProfessionalNotes.length > 0 && (
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 16px',
                      borderLeft: '3px solid #38bdf8'
                    }}>
                      <div style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                        Doctor Professional Clinical Notes (Official):
                      </div>
                      {c.doctorProfessionalNotes.map((note, idx) => (
                        <div key={idx} style={{ marginBottom: '8px' }}>
                          <div style={{ fontSize: '0.84rem', color: '#ffffff' }}>
                            "{note.note}"
                          </div>
                          {note.recommendation && (
                            <div style={{ fontSize: '0.78rem', color: '#fde68a', marginTop: '3px' }}>
                              <strong>Recommendation:</strong> {note.recommendation}
                            </div>
                          )}
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                            Signed by {note.doctorName} on {new Date(note.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Directory of Verified Doctors */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.15rem', color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Stethoscope size={18} color="#10b981" /> Verified Physicians Directory
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {doctors.map((doc) => (
            <div
              key={doc.id}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h4 style={{ fontSize: '1.05rem', color: '#ffffff' }}>{doc.name}</h4>
                  {doc.isVerified && (
                    <span title="Verified License">
                      <ShieldCheck size={16} color="#10b981" />
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.84rem', color: '#38bdf8', fontWeight: 600 }}>
                  {doc.specialization}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                  {doc.hospitalOrClinic} • {doc.yearsOfExperience} yrs exp
                </div>
                {doc.bio && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.45 }}>
                    {doc.bio}
                  </p>
                )}
              </div>

              <button
                onClick={() => {
                  setSelectedDoctorId(doc.id);
                  setIsModalOpen(true);
                }}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%' }}
              >
                Grant Record Access
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Authorize Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', color: '#ffffff' }}>
                Grant Record Sharing Consent
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleGrantConsent}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select Healthcare Provider</label>
                  <select
                    className="form-control"
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    required
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.specialization}) - {d.hospitalOrClinic}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Permissions to Grant</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={permMeasurements}
                        onChange={(e) => setPermMeasurements(e.target.checked)}
                      />
                      <span>Allow viewing of Health Measurements & Vital Trends</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={permSymptoms}
                        onChange={(e) => setPermSymptoms(e.target.checked)}
                      />
                      <span>Allow viewing of Symptom Diary</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={permMedications}
                        onChange={(e) => setPermMedications(e.target.checked)}
                      />
                      <span>Allow viewing of Medication & Adherence History</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={permReports}
                        onChange={(e) => setPermReports(e.target.checked)}
                      />
                      <span>Allow downloading Generated Health Reports</span>
                    </label>
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.4, marginTop: '10px' }}>
                  By clicking Grant Consent, you authorize this verified healthcare professional to access the selected records for clinical review and care coordination.
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Granting...' : 'Confirm Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
