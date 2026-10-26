import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { AddMeasurementModal } from '../../components/AddMeasurementModal';
import {
  ClipboardList,
  Edit2,
  Filter,
  HeartPulse,
  Plus,
  Trash2,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';

export const MeasurementsPage = () => {
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editSystolic, setEditSystolic] = useState('');
  const [editDiastolic, setEditDiastolic] = useState('');
  const [editReason, setEditReason] = useState('Entered wrong number');
  const [editNotes, setEditNotes] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchMeasurements = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (filterType !== 'all') query.append('type', filterType);
      if (filterSeverity !== 'all') query.append('severity', filterSeverity);

      const res = await apiRequest(`/measurements?${query.toString()}`);
      if (res.success) {
        setMeasurements(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load measurements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeasurements();
  }, [filterType, filterSeverity]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this measurement record?')) return;
    try {
      await apiRequest(`/measurements/${id}`, { method: 'DELETE' });
      fetchMeasurements();
    } catch (err) {
      alert(err.message || 'Failed to delete');
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setEditNotes(item.notes || '');
    setEditReason('User correction');
    if (item.type === 'bloodPressure' && item.valueDetails) {
      setEditSystolic(item.valueDetails.systolic);
      setEditDiastolic(item.valueDetails.diastolic);
    } else {
      setEditValue(item.value);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    setEditSubmitting(true);

    try {
      const payload = {
        reason: editReason,
        notes: editNotes
      };

      if (editingItem.type === 'bloodPressure') {
        payload.value = parseFloat(editSystolic);
        payload.valueDetails = {
          systolic: parseFloat(editSystolic),
          diastolic: parseFloat(editDiastolic)
        };
      } else {
        payload.value = parseFloat(editValue);
      }

      await apiRequest(`/measurements/${editingItem._id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      setEditingItem(null);
      fetchMeasurements();
    } catch (err) {
      alert(err.message || 'Failed to update record');
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 className="title-xl">Health Measurements Log</h1>
          <p className="subtitle">
            All recorded clinical vitals, verified against automated threshold rules
          </p>
        </div>

        <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary">
          <Plus size={16} />
          <span>Record Measurement</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <Filter size={16} />
            <span>Filter By:</span>
          </div>

          <div style={{ display: 'flex', gap: '10px', flex: 1, flexWrap: 'wrap' }}>
            <select
              className="form-control"
              style={{ width: 'auto', minWidth: '180px' }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Vital Categories</option>
              <option value="heartRate">Heart Rate</option>
              <option value="bloodPressure">Blood Pressure</option>
              <option value="bloodGlucose">Blood Glucose</option>
              <option value="oxygenSaturation">Oxygen Saturation</option>
              <option value="bodyTemperature">Body Temperature</option>
              <option value="bodyWeight">Body Weight</option>
              <option value="sleep">Sleep Duration</option>
              <option value="waterIntake">Water Intake</option>
            </select>

            <select
              className="form-control"
              style={{ width: 'auto', minWidth: '160px' }}
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
            >
              <option value="all">All Severities</option>
              <option value="normal">Normal</option>
              <option value="info">Info / Elevated</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
            Showing <strong>{measurements.length}</strong> record{measurements.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Measurements Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Date & Time</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Category</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Recorded Value</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Status / Anomaly</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Source</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Notes</th>
                <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {measurements.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
                    No measurements found for the selected filter.
                  </td>
                </tr>
              ) : (
                measurements.map((m) => {
                  let displayVal = `${m.value} ${m.unit}`;
                  if (m.type === 'bloodPressure' && m.valueDetails) {
                    displayVal = `${m.valueDetails.systolic}/${m.valueDetails.diastolic} ${m.unit}`;
                  }

                  const getBadge = (severity) => {
                    switch (severity) {
                      case 'critical': return 'badge-critical';
                      case 'warning': return 'badge-warning';
                      case 'info': return 'badge-info';
                      default: return 'badge-normal';
                    }
                  };

                  return (
                    <tr
                      key={m._id}
                      style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}
                    >
                      <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                        <div style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                          {new Date(m.recordedAt).toLocaleDateString()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {new Date(m.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td style={{ padding: '14px 20px', color: '#ffffff', fontWeight: 600 }}>
                        {m.type}
                      </td>

                      <td style={{ padding: '14px 20px', fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 700, color: '#38bdf8' }}>
                        {displayVal}
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <span className={`badge ${getBadge(m.alertSeverity)}`}>
                          {m.alertSeverity}
                        </span>
                        {m.validationStatus === 'corrected' && (
                          <span style={{ marginLeft: '6px', fontSize: '0.68rem', color: '#94a3b8' }}>
                            (edited)
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        <span style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}>
                          {m.source || 'manual'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 20px', color: 'var(--text-dim)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.notes || '—'}
                      </td>

                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            onClick={() => openEditModal(m)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px 8px' }}
                            title="Correct entry"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(m._id)}
                            className="btn btn-danger btn-sm"
                            style={{ padding: '6px 8px' }}
                            title="Delete entry"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Correction Modal */}
      {editingItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', color: '#ffffff' }}>
                Correct Measurement: {editingItem.type}
              </h3>
              <button onClick={() => setEditingItem(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="modal-body">
                {editingItem.type === 'bloodPressure' ? (
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Systolic Value</label>
                      <input
                        type="number"
                        className="form-control"
                        value={editSystolic}
                        onChange={(e) => setEditSystolic(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Diastolic Value</label>
                      <input
                        type="number"
                        className="form-control"
                        value={editDiastolic}
                        onChange={(e) => setEditDiastolic(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Measurement Value ({editingItem.unit})</label>
                    <input
                      type="number"
                      step="any"
                      className="form-control"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Reason for Correction (Audited)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingItem(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={editSubmitting}>
                  {editSubmitting ? 'Updating...' : 'Save Correction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record New Measurement Modal */}
      <AddMeasurementModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => fetchMeasurements()}
      />
    </div>
  );
};
