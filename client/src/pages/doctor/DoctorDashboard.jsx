import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Droplets,
  Heart,
  MessageSquare,
  Pill,
  Plus,
  ShieldCheck,
  Stethoscope,
  User,
  Users
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const DoctorDashboard = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patientRecords, setPatientRecords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);

  // Add Professional Note Form
  const [newNote, setNewNote] = useState('');
  const [newRecommendation, setNewRecommendation] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const fetchSharedPatients = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/doctor/patients');
      if (res.success) {
        setPatients(res.data || []);
        if (res.data && res.data.length > 0 && !selectedPatientId) {
          setSelectedPatientId(res.data[0].patient._id);
        }
      }
    } catch (err) {
      console.error('Failed to load doctor patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSharedPatients();
  }, []);

  const fetchPatientRecords = async (patientId) => {
    try {
      setRecordsLoading(true);
      const res = await apiRequest(`/doctor/patients/${patientId}/records`);
      if (res.success) {
        setPatientRecords(res.data);
      }
    } catch (err) {
      alert(err.message || 'Failed to fetch consented records');
    } finally {
      setRecordsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientRecords(selectedPatientId);
    }
  }, [selectedPatientId]);

  const handleAddDoctorNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setSavingNote(true);

    try {
      const res = await apiRequest(`/doctor/patients/${selectedPatientId}/notes`, {
        method: 'POST',
        body: JSON.stringify({
          note: newNote,
          recommendation: newRecommendation
        })
      });

      if (res.success) {
        setNewNote('');
        setNewRecommendation('');
        fetchPatientRecords(selectedPatientId);
      }
    } catch (err) {
      alert(err.message || 'Failed to add professional note');
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 className="title-xl" style={{ margin: 0 }}>Physician Care Portal</h1>
          <span className="badge badge-normal" style={{ fontSize: '0.72rem' }}>
            VERIFIED HEALTHCARE PROVIDER
          </span>
        </div>
        <p className="subtitle" style={{ marginTop: '4px' }}>
          Review consented patient vitals, clinical rule anomalies, and author official professional care plans
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'flex-start' }}>
        {/* Left Column: Shared Patients List */}
        <div className="glass-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.92rem' }}>
              <Users size={16} color="#38bdf8" />
              <span>Consented Patients ({patients.length})</span>
            </div>
          </div>

          {patients.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              No patients have actively granted consent yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {patients.map((item) => {
                const isSelected = selectedPatientId === item.patient._id;
                return (
                  <div
                    key={item.consentId}
                    onClick={() => setSelectedPatientId(item.patient._id)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(2, 132, 199, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${isSelected ? 'rgba(56, 189, 248, 0.4)' : 'var(--border)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem', color: isSelected ? '#ffffff' : 'var(--text-main)' }}>
                        {item.patient.name}
                      </div>
                      {item.vitalsSummary?.unacknowledgedAlerts > 0 && (
                        <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                          {item.vitalsSummary.unacknowledgedAlerts} Alert{item.vitalsSummary.unacknowledgedAlerts > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                      Blood Group: {item.profile?.bloodGroup || 'N/A'} • BP: {item.vitalsSummary?.latestBP}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Selected Patient Clinical Detail */}
        {selectedPatientId && patientRecords ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Patient Header Box */}
            <div className="glass-card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{ fontSize: '1.4rem', color: '#ffffff' }}>
                      {patientRecords.patient.name}
                    </h2>
                    <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                      CONSENT ACTIVE
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                    Email: {patientRecords.patient.email} • Phone: {patientRecords.patient.phone || 'N/A'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <div>Height: <strong>{patientRecords.profile?.height ? `${patientRecords.profile.height} cm` : 'N/A'}</strong></div>
                  <div>Weight: <strong>{patientRecords.profile?.weight ? `${patientRecords.profile.weight} kg` : 'N/A'}</strong></div>
                  <div>Blood Group: <strong>{patientRecords.profile?.bloodGroup || 'Unknown'}</strong></div>
                </div>
              </div>

              {patientRecords.profile?.chronicConditions?.length > 0 && (
                <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#fca5a5' }}>
                  <strong>Chronic Conditions:</strong> {patientRecords.profile.chronicConditions.join(', ')}
                </div>
              )}
            </div>

            {/* Vitals Summary & Trend Chart */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1.15rem', color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="#38bdf8" /> Recent Vital Measurements
              </h3>

              <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                      <th style={{ padding: '10px 14px' }}>Date</th>
                      <th style={{ padding: '10px 14px' }}>Category</th>
                      <th style={{ padding: '10px 14px' }}>Value</th>
                      <th style={{ padding: '10px 14px' }}>Severity</th>
                      <th style={{ padding: '10px 14px' }}>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(patientRecords.measurements || []).slice(0, 8).map((m) => {
                      let val = `${m.value} ${m.unit}`;
                      if (m.type === 'bloodPressure' && m.valueDetails) {
                        val = `${m.valueDetails.systolic}/${m.valueDetails.diastolic} mmHg`;
                      }
                      return (
                        <tr key={m._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '10px 14px' }}>{new Date(m.recordedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                          <td style={{ padding: '10px 14px', color: '#ffffff', fontWeight: 600 }}>{m.type}</td>
                          <td style={{ padding: '10px 14px', color: '#38bdf8', fontWeight: 700 }}>{val}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span className={`badge ${m.alertSeverity === 'critical' ? 'badge-critical' : m.alertSeverity === 'warning' ? 'badge-warning' : 'badge-normal'}`}>
                              {m.alertSeverity}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', color: 'var(--text-dim)' }}>{m.source || 'manual'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Active Medications & Symptoms Log */}
            <div className="grid-2">
              <div className="glass-card">
                <h3 style={{ fontSize: '1.05rem', color: '#ffffff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Pill size={16} color="#10b981" /> Active Prescribed Regimens
                </h3>

                {(patientRecords.medications || []).length === 0 ? (
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No active medications listed.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {patientRecords.medications.map((med) => (
                      <div key={med._id} style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: '6px', fontSize: '0.82rem' }}>
                        <div style={{ fontWeight: 600, color: '#ffffff' }}>{med.name} - {med.dosage}</div>
                        <div style={{ color: 'var(--text-dim)' }}>{med.frequency} • {med.instructions}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="glass-card">
                <h3 style={{ fontSize: '1.05rem', color: '#ffffff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={16} color="#f87171" /> Reported Symptoms
                </h3>

                {(patientRecords.symptoms || []).length === 0 ? (
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No symptoms logged recently.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {patientRecords.symptoms.slice(0, 4).map((s) => (
                      <div key={s._id} style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: '6px', fontSize: '0.82rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#ffffff' }}>
                          <span>{s.symptom}</span>
                          <span className={`badge ${s.severity === 'critical' ? 'badge-critical' : 'badge-warning'}`}>{s.severity}</span>
                        </div>
                        <div style={{ color: 'var(--text-dim)' }}>{new Date(s.recordedAt).toLocaleDateString()} • {s.bodyLocation}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Author Official Doctor Clinical Note (Distinct from AI summary) */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1.15rem', color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Stethoscope size={18} color="#38bdf8" /> Official Doctor Clinical Notes & Follow-Up
              </h3>

              {/* Existing Doctor Notes */}
              {(patientRecords.doctorNotes || []).length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  {patientRecords.doctorNotes.map((dn, i) => (
                    <div
                      key={i}
                      style={{
                        background: 'rgba(56, 189, 248, 0.05)',
                        border: '1px solid rgba(56, 189, 248, 0.2)',
                        borderRadius: 'var(--radius-md)',
                        padding: '14px 18px'
                      }}
                    >
                      <div style={{ fontSize: '0.88rem', color: '#ffffff', marginBottom: '4px' }}>
                        "{dn.note}"
                      </div>
                      {dn.recommendation && (
                        <div style={{ fontSize: '0.82rem', color: '#fde68a' }}>
                          <strong>Recommendation:</strong> {dn.recommendation}
                        </div>
                      )}
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '6px' }}>
                        Authored by {dn.doctorName || user.name} on {new Date(dn.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Note Form */}
              <form onSubmit={handleAddDoctorNote}>
                <div className="form-group">
                  <label className="form-label">Clinical Observation / Assessment</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Enter official medical observations based on patient vital trends..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Actionable Patient Recommendation</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Schedule ambulatory 24h BP monitor, continue 10mg Lisinopril"
                    value={newRecommendation}
                    onChange={(e) => setNewRecommendation(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" disabled={savingNote}>
                    {savingNote ? 'Signing Note...' : 'Add Professional Note'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--text-dim)' }}>
            Select a consented patient on the left to review medical records.
          </div>
        )}
      </div>
    </div>
  );
};
