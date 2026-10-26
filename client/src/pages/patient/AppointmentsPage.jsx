import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { AddAppointmentModal } from '../../components/AddAppointmentModal';
import {
  Calendar,
  CheckCircle,
  Clock,
  HelpCircle,
  MapPin,
  Plus,
  Stethoscope,
  Video,
  XCircle
} from 'lucide-react';

export const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [tab, setTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await apiRequest(`/appointments?timeframe=${tab}`);
      if (res.success) {
        setAppointments(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [tab]);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await apiRequest(`/appointments/${id}`, { method: 'DELETE' });
      fetchAppointments();
    } catch (err) {
      alert(err.message || 'Failed to cancel appointment');
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 className="title-xl">Medical Appointments & Consultations</h1>
          <p className="subtitle">
            Timezone-aware scheduling, clinic logistics, and questions for your doctor
          </p>
        </div>

        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <Plus size={16} />
          <span>Schedule Consultation</span>
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'inline-flex',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 'var(--radius-md)',
        padding: '4px',
        marginBottom: '24px'
      }}>
        <button
          onClick={() => setTab('upcoming')}
          style={{
            background: tab === 'upcoming' ? '#0284c7' : 'transparent',
            color: '#ffffff',
            border: 'none',
            padding: '8px 18px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Upcoming Consultations
        </button>
        <button
          onClick={() => setTab('past')}
          style={{
            background: tab === 'past' ? '#0284c7' : 'transparent',
            color: '#ffffff',
            border: 'none',
            padding: '8px 18px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Past Visits & History
        </button>
      </div>

      {/* Appointments List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {appointments.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
            <Calendar size={36} color="var(--text-dim)" style={{ margin: '0 auto 12px', display: 'block' }} />
            <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '1.05rem', marginBottom: '4px' }}>
              No {tab} appointments on record
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              Keep your care schedule on track by scheduling your doctor reviews in advance.
            </p>
          </div>
        ) : (
          appointments.map((appt) => {
            const isTele = appt.locationType === 'telehealth';
            return (
              <div key={appt._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: 'rgba(56, 189, 248, 0.12)',
                      color: '#38bdf8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {isTele ? <Video size={22} /> : <Stethoscope size={22} />}
                    </div>

                    <div>
                      <h3 style={{ fontSize: '1.15rem', color: '#ffffff', marginBottom: '2px' }}>
                        {appt.doctorName}
                      </h3>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {appt.specialty} • {appt.clinicOrHospital}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                      {appt.locationType}
                    </span>
                    <span className={`badge ${appt.status === 'confirmed' ? 'badge-normal' : appt.status === 'completed' ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: '0.72rem' }}>
                      {appt.status}
                    </span>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  flexWrap: 'wrap',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontWeight: 600 }}>
                    <Clock size={16} />
                    {new Date(appt.scheduledDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                  <div style={{ color: 'var(--text-dim)' }}>|</div>
                  <div style={{ color: 'var(--text-main)' }}>
                    <strong>Purpose:</strong> {appt.purpose}
                  </div>
                </div>

                {/* Questions to Discuss with Doctor */}
                {appt.questionsToAsk && appt.questionsToAsk.length > 0 && (
                  <div style={{
                    background: 'rgba(56, 189, 248, 0.05)',
                    border: '1px solid rgba(56, 189, 248, 0.15)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: '#7dd3fc', marginBottom: '8px' }}>
                      <HelpCircle size={14} /> Questions to Discuss During Consultation:
                    </div>
                    <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {appt.questionsToAsk.map((q, idx) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Preparation Notes */}
                {appt.preparationNotes && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    <strong>Prep Instructions:</strong> {appt.preparationNotes}
                  </div>
                )}

                {/* Doctor Post Visit Notes */}
                {appt.doctorPostVisitNotes && (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid var(--success-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    fontSize: '0.82rem',
                    color: '#a7f3d0'
                  }}>
                    <strong>Doctor Summary & Recommendations:</strong> {appt.doctorPostVisitNotes}
                  </div>
                )}

                {/* Actions */}
                {tab === 'upcoming' && appt.status !== 'cancelled' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                    <button
                      onClick={() => handleCancel(appt._id)}
                      className="btn btn-danger btn-sm"
                    >
                      <XCircle size={14} /> Cancel Appointment
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Schedule Appointment Modal */}
      <AddAppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchAppointments()}
      />
    </div>
  );
};
