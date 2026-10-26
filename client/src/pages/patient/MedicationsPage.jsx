import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { AddMedicationModal } from '../../components/AddMedicationModal';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Pill,
  Plus,
  ShieldAlert,
  Trash2,
  UserCheck,
  XCircle
} from 'lucide-react';

export const MedicationsPage = () => {
  const [medications, setMedications] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchMedicationsData = async () => {
    try {
      setLoading(true);
      const [medsRes, remRes] = await Promise.all([
        apiRequest('/medications'),
        apiRequest('/medications/reminders/today')
      ]);

      if (medsRes.success) setMedications(medsRes.data || []);
      if (remRes.success) setReminders(remRes.data || []);
    } catch (err) {
      console.error('Failed to load medications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicationsData();
  }, []);

  const handleUpdateReminder = async (id, status) => {
    try {
      await apiRequest(`/medications/reminders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      fetchMedicationsData();
    } catch (err) {
      alert(err.message || 'Failed to update reminder');
    }
  };

  const handleDeleteMedication = async (id) => {
    if (!window.confirm('Delete this medication schedule?')) return;
    try {
      await apiRequest(`/medications/${id}`, { method: 'DELETE' });
      fetchMedicationsData();
    } catch (err) {
      alert(err.message || 'Failed to delete');
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 className="title-xl">Medications & Treatment Schedule</h1>
          <p className="subtitle">
            Manage your prescription schedule, dosage reminders, and daily adherence records
          </p>
        </div>

        <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary">
          <Plus size={16} />
          <span>Add Medication</span>
        </button>
      </div>

      {/* Safety Notice Banner */}
      <div style={{
        background: 'rgba(245, 158, 11, 0.08)',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        borderRadius: 'var(--radius-lg)',
        padding: '14px 18px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <ShieldAlert size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.82rem', color: '#fcd34d', lineHeight: 1.45 }}>
          <strong>Important Clinical Reminder:</strong> The application does not independently prescribe medication, change dosages, or recommend stopping prescribed treatment. Always consult your prescribing doctor before modifying any medical regimen.
        </div>
      </div>

      {/* Section 1: Today's Dose Checklist */}
      <div className="glass-card" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#38bdf8" /> Today's Dosing Checklist
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Log each dose as taken, skipped, or missed for your health record
            </p>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {reminders.filter(r => r.status === 'taken').length} of {reminders.length} Taken
          </div>
        </div>

        {reminders.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            No medication doses scheduled for today.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
            {reminders.map((rem) => {
              const isTaken = rem.status === 'taken';
              const isSkipped = rem.status === 'skipped';

              return (
                <div
                  key={rem._id}
                  style={{
                    background: isTaken ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${isTaken ? 'var(--success-border)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#ffffff' }}>
                        {rem.medicationName}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        {rem.dosage} • Scheduled: {new Date(rem.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <span className={`badge ${isTaken ? 'badge-normal' : isSkipped ? 'badge-warning' : 'badge-info'}`}>
                      {rem.status}
                    </span>
                  </div>

                  {/* Quick Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '10px' }}>
                    <button
                      onClick={() => handleUpdateReminder(rem._id, 'taken')}
                      className={`btn btn-sm ${isTaken ? 'btn-success' : 'btn-secondary'}`}
                      style={{ flex: 1 }}
                    >
                      <CheckCircle2 size={14} /> Taken
                    </button>

                    <button
                      onClick={() => handleUpdateReminder(rem._id, 'skipped')}
                      className={`btn btn-sm ${isSkipped ? 'btn-danger' : 'btn-secondary'}`}
                      style={{ flex: 1 }}
                    >
                      <XCircle size={14} /> Skip
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: All Prescribed Medications */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.15rem', color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Pill size={18} color="#10b981" /> Active Prescriptions & Regimens
        </h3>

        {medications.length === 0 ? (
          <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.88rem' }}>
            No medications registered in your profile. Click "Add Medication" above to start organizing.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
            {medications.map((med) => (
              <div
                key={med._id}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', color: '#ffffff', marginBottom: '2px' }}>
                      {med.name}
                    </h4>
                    <span style={{ fontSize: '0.82rem', color: '#38bdf8', fontWeight: 600 }}>
                      {med.dosage} ({med.form})
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteMedication(med._id)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                    title="Remove medication"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <div><strong>Frequency:</strong> {med.frequency} ({(med.timeOfDay || []).join(', ')})</div>
                  <div><strong>Prescribed by:</strong> {med.prescribedBy || 'Self-reported'}</div>
                  {med.purpose && <div><strong>Purpose:</strong> {med.purpose}</div>}
                  <div><strong>Instructions:</strong> {med.instructions}</div>
                </div>

                <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '8px' }}>
                  Started: {new Date(med.startDate).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Medication Modal */}
      <AddMedicationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => fetchMedicationsData()}
      />
    </div>
  );
};
