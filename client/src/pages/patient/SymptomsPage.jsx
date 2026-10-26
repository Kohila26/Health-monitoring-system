import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { AddSymptomModal } from '../../components/AddSymptomModal';
import { Activity, AlertTriangle, Clock, MapPin, Plus, Trash2, Zap } from 'lucide-react';

export const SymptomsPage = () => {
  const [symptoms, setSymptoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchSymptoms = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/symptoms');
      if (res.success) {
        setSymptoms(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load symptoms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSymptoms();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this symptom record?')) return;
    try {
      await apiRequest(`/symptoms/${id}`, { method: 'DELETE' });
      fetchSymptoms();
    } catch (err) {
      alert(err.message || 'Failed to delete');
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'critical': return 'badge-critical';
      case 'severe': return 'badge-warning';
      case 'moderate': return 'badge-info';
      default: return 'badge-normal';
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 className="title-xl">Symptom Tracking & Clinical Diary</h1>
          <p className="subtitle">
            Log physical sensations, pain levels, and onset times for discussion with your doctor
          </p>
        </div>

        <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary">
          <Plus size={16} />
          <span>Log New Symptom</span>
        </button>
      </div>

      {/* Emergency Guidance Box */}
      <div style={{
        background: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid var(--danger-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '14px 18px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.82rem', color: '#fca5a5', lineHeight: 1.4 }}>
          <strong>Notice:</strong> This journal records personal symptoms to help your care provider review patterns. For sudden, severe symptoms such as chest tightness, difficulty breathing, or severe sudden headaches, <strong>call 911 immediately</strong>.
        </div>
      </div>

      {/* Symptoms List */}
      <div className="grid-2">
        {symptoms.length === 0 ? (
          <div className="glass-card" style={{ gridColumn: 'span 2', textAlign: 'center', padding: '40px' }}>
            <Activity size={36} color="var(--text-dim)" style={{ margin: '0 auto 12px', display: 'block' }} />
            <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '1.05rem', marginBottom: '4px' }}>
              No Symptoms Currently Logged
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              Your baseline profile is clean. If you experience discomfort or unusual sensations, log them here.
            </p>
          </div>
        ) : (
          symptoms.map((s) => (
            <div key={s._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '1.1rem', color: '#ffffff' }}>{s.symptom}</h3>
                    <span className={`badge ${getSeverityBadge(s.severity)}`}>
                      {s.severity}
                    </span>
                    {s.isRedFlag && (
                      <span className="badge badge-critical" style={{ fontSize: '0.65rem' }}>
                        Red Flag
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={12} />
                    Reported on {new Date(s.recordedAt).toLocaleString()}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(s._id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                  title="Delete record"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MapPin size={14} color="#38bdf8" />
                  <span>Location: <strong>{s.bodyLocation || 'General'}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={14} color="#38bdf8" />
                  <span>Duration: <strong>{s.duration || 'Ongoing'}</strong></span>
                </div>
              </div>

              {s.triggers && s.triggers.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <Zap size={14} color="#f59e0b" />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Reported Triggers:</span>
                  {s.triggers.map((t, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        color: 'var(--text-main)'
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {s.notes && (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.82rem',
                  color: '#cbd5e1'
                }}>
                  {s.notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Symptom Modal */}
      <AddSymptomModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => fetchSymptoms()}
      />
    </div>
  );
};
