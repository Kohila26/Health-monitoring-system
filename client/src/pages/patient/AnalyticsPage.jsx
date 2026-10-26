import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle,
  CheckCircle2,
  Clock,
  Heart,
  LineChart,
  ShieldCheck,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart as RechartsLine,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export const AnalyticsPage = () => {
  const [selectedVital, setSelectedVital] = useState('heartRate');
  const [selectedDays, setSelectedDays] = useState('30');
  const [trendData, setTrendData] = useState([]);
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ackNote, setAckNote] = useState('');
  const [ackingAlertId, setAckingAlertId] = useState(null);

  const fetchTrendsAndAlerts = async () => {
    try {
      setLoading(true);
      const [trendRes, alertRes] = await Promise.all([
        apiRequest(`/health/trends?vitalType=${selectedVital}&days=${selectedDays}`),
        apiRequest('/health/alerts')
      ]);

      if (trendRes.success) {
        setTrendData(trendRes.data.data || []);
        setStats(trendRes.data.statistics);
      }

      if (alertRes.success) {
        setAlerts(alertRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendsAndAlerts();
  }, [selectedVital, selectedDays]);

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await apiRequest(`/health/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        body: JSON.stringify({ userResponseNote: ackNote || 'Acknowledged by user' })
      });
      setAckingAlertId(null);
      setAckNote('');
      fetchTrendsAndAlerts();
    } catch (err) {
      alert(err.message || 'Failed to acknowledge alert');
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 className="title-xl">Health Trends & Anomaly Monitoring</h1>
          <p className="subtitle">
            Longitudinal physiological trends cross-referenced with clinical threshold rules
          </p>
        </div>

        {/* Controls: Vital Category & Days Filter */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select
            className="form-control"
            style={{ width: 'auto', minWidth: '180px' }}
            value={selectedVital}
            onChange={(e) => setSelectedVital(e.target.value)}
          >
            <option value="heartRate">Heart Rate (bpm)</option>
            <option value="bloodPressure">Blood Pressure (mmHg)</option>
            <option value="bloodGlucose">Blood Glucose (mg/dL)</option>
            <option value="oxygenSaturation">Oxygen Saturation (%)</option>
            <option value="bodyTemperature">Body Temperature (°F)</option>
            <option value="bodyWeight">Body Weight (kg)</option>
            <option value="sleep">Sleep Duration (hrs)</option>
          </select>

          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 'var(--radius-md)',
            padding: '3px'
          }}>
            {['7', '14', '30', '90'].map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDays(d)}
                style={{
                  background: selectedDays === d ? '#0284c7' : 'transparent',
                  color: selectedDays === d ? '#ffffff' : 'var(--text-muted)',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {d}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Aggregate Statistics Overview */}
      {stats && (
        <div className="grid-3" style={{ marginBottom: '24px' }}>
          <div className="glass-card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
              Period Average
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>
              {stats.average}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Mean across {trendData.length} recorded data points
            </div>
          </div>

          <div className="glass-card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
              Recorded Minimum
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#34d399', marginTop: '4px' }}>
              {stats.min !== null ? stats.min : '--'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Lowest verified value
            </div>
          </div>

          <div className="glass-card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
              Recorded Maximum
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f87171', marginTop: '4px' }}>
              {stats.max !== null ? stats.max : '--'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Peak reading observed
            </div>
          </div>
        </div>
      )}

      {/* Interactive Recharts Graph */}
      <div className="glass-card" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: '#ffffff' }}>
              {selectedVital.toUpperCase()} Trend Curve
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Data mapped chronologically over the past {selectedDays} days
            </p>
          </div>
        </div>

        <div style={{ height: '340px', width: '100%' }}>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLine data={trendData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#64748b" fontSize={11} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', borderColor: 'rgba(255,255,255,0.15)', borderRadius: '8px' }}
                  labelFormatter={(l) => new Date(l).toLocaleString()}
                />
                <Legend />

                {selectedVital === 'bloodPressure' ? (
                  <>
                    <Line
                      type="monotone"
                      dataKey="systolic"
                      name="Systolic (mmHg)"
                      stroke="#ef4444"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#ef4444' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="diastolic"
                      name="Diastolic (mmHg)"
                      stroke="#38bdf8"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#38bdf8' }}
                    />
                  </>
                ) : (
                  <Line
                    type="monotone"
                    dataKey="value"
                    name={selectedVital}
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#38bdf8' }}
                  />
                )}
              </RechartsLine>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)' }}>
              No recorded measurements for {selectedVital} in the past {selectedDays} days.
            </div>
          )}
        </div>
      </div>

      {/* Clinical Anomaly & Rule Alerts Log */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={20} color="#f59e0b" /> Clinical Alerts & Rule History
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Verified triggers evaluated by Clinical Rules Engine (Rule Version: 2026.1)
            </p>
          </div>

          <span className="badge badge-warning">
            {alerts.filter(a => !a.isAcknowledged).length} Unacknowledged
          </span>
        </div>

        {alerts.length === 0 ? (
          <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.88rem' }}>
            <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 10px', display: 'block' }} />
            No threshold alerts recorded. All values remain within target reference ranges.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {alerts.map((alert) => {
              const isCrit = alert.severity === 'critical';
              const isAcked = alert.isAcknowledged;

              return (
                <div
                  key={alert._id}
                  style={{
                    background: isCrit ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.06)',
                    border: `1px solid ${isCrit ? 'var(--danger-border)' : 'var(--warning-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span className={`badge ${isCrit ? 'badge-critical' : 'badge-warning'}`}>
                          {alert.severity}
                        </span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          {alert.alertCode}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          • {new Date(alert.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 500 }}>
                        {alert.message}
                      </div>
                    </div>

                    {isAcked ? (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.78rem',
                        color: '#34d399',
                        background: 'rgba(16, 185, 129, 0.1)',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)'
                      }}>
                        <CheckCircle size={14} />
                        Acknowledged
                      </span>
                    ) : (
                      <button
                        onClick={() => setAckingAlertId(alert._id)}
                        className="btn btn-secondary btn-sm"
                        style={{ flexShrink: 0 }}
                      >
                        Acknowledge Alert
                      </button>
                    )}
                  </div>

                  <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    color: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <strong style={{ color: '#38bdf8' }}>Action Recommended:</strong>
                    <span>{alert.clinicalAction}</span>
                  </div>

                  {/* Inline acknowledge input modal/box */}
                  {ackingAlertId === alert._id && (
                    <div style={{
                      marginTop: '8px',
                      padding: '12px',
                      background: '#111827',
                      borderRadius: '8px',
                      border: '1px solid var(--border)'
                    }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                        Add note or response action:
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Rested for 10 min, took Lisinopril, drinking water"
                        value={ackNote}
                        onChange={(e) => setAckNote(e.target.value)}
                        style={{ marginBottom: '8px' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setAckingAlertId(null)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleAcknowledgeAlert(alert._id)}
                        >
                          Confirm Acknowledgment
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
