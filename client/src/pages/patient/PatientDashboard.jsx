import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/StatCard';
import { EmergencyBanner } from '../../components/EmergencyBanner';
import { AddMeasurementModal } from '../../components/AddMeasurementModal';
import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Droplets,
  Flame,
  Heart,
  Moon,
  Pill,
  Plus,
  Scale,
  Sparkles,
  Thermometer,
  Wind
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Link } from 'react-router-dom';

export const PatientDashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [todayReminders, setTodayReminders] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentSymptoms, setRecentSymptoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sumRes, trendsRes, alertsRes, remRes, apptRes, symRes] = await Promise.all([
        apiRequest('/health/summary'),
        apiRequest('/health/trends?vitalType=heartRate&days=14'),
        apiRequest('/health/alerts?status=unacknowledged'),
        apiRequest('/medications/reminders/today'),
        apiRequest('/appointments?timeframe=upcoming'),
        apiRequest('/symptoms')
      ]);

      if (sumRes.success) setSummary(sumRes.data);
      if (trendsRes.success) setTrendData(trendsRes.data.data || []);
      if (alertsRes.success) setActiveAlerts(alertsRes.data || []);
      if (remRes.success) setTodayReminders(remRes.data || []);
      if (apptRes.success) setUpcomingAppointments(apptRes.data || []);
      if (symRes.success) setRecentSymptoms(symRes.data || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleReminder = async (reminderId, currentStatus) => {
    const newStatus = currentStatus === 'taken' ? 'pending' : 'taken';
    try {
      await apiRequest(`/medications/reminders/${reminderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      fetchDashboardData();
    } catch (e) {
      console.error('Failed to update dose status:', e);
    }
  };

  const vitals = summary?.latestVitals || {};

  return (
    <div className="page-container">
      {/* Emergency Guidance Banner */}
      <EmergencyBanner />

      {/* Header with Title and Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="title-xl">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="subtitle">
            Here is your daily clinical health overview, physiological trends, and scheduled care.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/patient/ai-assistant" className="btn btn-secondary">
            <Sparkles size={16} color="#38bdf8" />
            <span>AI Health Assistant</span>
          </Link>

          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>Log Measurement</span>
          </button>
        </div>
      </div>

      {/* Unacknowledged Clinical Alerts Notice */}
      {activeAlerts.length > 0 && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: '#f59e0b',
              color: '#000000',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800
            }}>
              !
            </div>
            <div>
              <div style={{ fontWeight: 600, color: '#fef3c7' }}>
                {activeAlerts.length} Clinical Alert{activeAlerts.length > 1 ? 's' : ''} Require Review
              </div>
              <div style={{ fontSize: '0.8rem', color: '#fde68a' }}>
                Latest: {activeAlerts[0].message}
              </div>
            </div>
          </div>
          <Link to="/patient/analytics" className="btn btn-secondary btn-sm" style={{ borderColor: 'rgba(245, 158, 11, 0.4)', color: '#fef3c7' }}>
            Review Alerts
          </Link>
        </div>
      )}

      {/* Vital Metric Cards Grid */}
      <div className="grid-4" style={{ marginBottom: '28px' }}>
        <StatCard
          title="Heart Rate"
          value={vitals.heartRate?.value || '--'}
          unit={vitals.heartRate?.unit || 'bpm'}
          severity={vitals.heartRate?.alertSeverity || 'normal'}
          subtitle="Resting pulse"
          icon={Heart}
          timestamp={vitals.heartRate?.recordedAt}
        />

        <StatCard
          title="Blood Pressure"
          value={vitals.bloodPressure?.valueDetails ? `${vitals.bloodPressure.valueDetails.systolic}/${vitals.bloodPressure.valueDetails.diastolic}` : '--'}
          unit={vitals.bloodPressure?.unit || 'mmHg'}
          severity={vitals.bloodPressure?.alertSeverity || 'normal'}
          subtitle="Resting systolic / diastolic"
          icon={Activity}
          timestamp={vitals.bloodPressure?.recordedAt}
        />

        <StatCard
          title="Blood Glucose"
          value={vitals.bloodGlucose?.value || '--'}
          unit={vitals.bloodGlucose?.unit || 'mg/dL'}
          severity={vitals.bloodGlucose?.alertSeverity || 'normal'}
          subtitle={vitals.bloodGlucose?.valueDetails?.context ? `Context: ${vitals.bloodGlucose.valueDetails.context}` : 'Metabolic panel'}
          icon={Droplets}
          timestamp={vitals.bloodGlucose?.recordedAt}
        />

        <StatCard
          title="Oxygen Saturation"
          value={vitals.oxygenSaturation?.value || '--'}
          unit={vitals.oxygenSaturation?.unit || '%'}
          severity={vitals.oxygenSaturation?.alertSeverity || 'normal'}
          subtitle="SpO2 at room air"
          icon={Wind}
          timestamp={vitals.oxygenSaturation?.recordedAt}
        />

        <StatCard
          title="Body Temperature"
          value={vitals.bodyTemperature?.value || '--'}
          unit={vitals.bodyTemperature?.unit || '°F'}
          severity={vitals.bodyTemperature?.alertSeverity || 'normal'}
          subtitle="Thermal equilibrium"
          icon={Thermometer}
          timestamp={vitals.bodyTemperature?.recordedAt}
        />

        <StatCard
          title="Weight / BMI"
          value={vitals.bodyWeight?.value ? `${vitals.bodyWeight.value} kg` : '--'}
          unit=""
          severity={vitals.bmi?.alertSeverity || 'normal'}
          subtitle={vitals.bmi?.value ? `Calculated BMI: ${vitals.bmi.value}` : 'Weight tracking'}
          icon={Scale}
          timestamp={vitals.bodyWeight?.recordedAt}
        />

        <StatCard
          title="Sleep Rest"
          value={vitals.sleep?.value || '--'}
          unit={vitals.sleep?.unit || 'hrs'}
          severity="normal"
          subtitle="Restorative sleep"
          icon={Moon}
          timestamp={vitals.sleep?.recordedAt}
        />

        <StatCard
          title="Hydration"
          value={vitals.waterIntake?.value || '--'}
          unit={vitals.waterIntake?.unit || 'L'}
          severity="normal"
          subtitle="Daily fluid volume"
          icon={Droplets}
          timestamp={vitals.waterIntake?.recordedAt}
        />
      </div>

      {/* Middle Row: Trend Chart + Today's Medication Compliance */}
      <div className="grid-3" style={{ marginBottom: '28px' }}>
        {/* Trend Chart */}
        <div className="glass-card" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#ffffff' }}>Heart Rate Trend (Past 14 Days)</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Baseline resting pulse measurements
              </p>
            </div>
            <Link to="/patient/analytics" className="btn btn-secondary btn-sm">
              Full Analytics
            </Link>
          </div>

          <div style={{ height: '260px', width: '100%' }}>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={11}
                    tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                  />
                  <YAxis stroke="#64748b" fontSize={11} domain={[50, 110]} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', borderColor: 'rgba(255,255,255,0.15)', borderRadius: '8px' }}
                    labelFormatter={(label) => new Date(label).toLocaleString()}
                    formatter={(value) => [`${value} bpm`, 'Heart Rate']}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#hrGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)' }}>
                No trend points recorded yet. Log your first measurement to visualize trends!
              </div>
            )}
          </div>
        </div>

        {/* Medication Reminders Box */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Pill size={18} color="#10b981" />
              <h3 style={{ fontSize: '1.05rem', color: '#ffffff' }}>Today's Doses</h3>
            </div>
            <Link to="/patient/medications" style={{ fontSize: '0.8rem', color: '#38bdf8' }}>
              Manage
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {todayReminders.length === 0 ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                No pending doses scheduled for today.
              </div>
            ) : (
              todayReminders.map((rem) => {
                const isTaken = rem.status === 'taken';
                return (
                  <div
                    key={rem._id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: isTaken ? 'var(--text-dim)' : 'var(--text-main)', textDecoration: isTaken ? 'line-through' : 'none' }}>
                        {rem.medicationName}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                        {rem.dosage} • {new Date(rem.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleReminder(rem._id, rem.status)}
                      style={{
                        background: isTaken ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${isTaken ? 'var(--success-border)' : 'var(--border)'}`,
                        color: isTaken ? '#34d399' : 'var(--text-muted)',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <CheckCircle2 size={14} />
                      {isTaken ? 'Taken' : 'Mark Done'}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            Compliance records help your doctor evaluate treatment effectiveness.
          </div>
        </div>
      </div>

      {/* Bottom Row: Upcoming Appointments & Recent Symptoms */}
      <div className="grid-2">
        {/* Appointments Card */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#38bdf8" />
              <h3 style={{ fontSize: '1.05rem', color: '#ffffff' }}>Upcoming Medical Consultations</h3>
            </div>
            <Link to="/patient/appointments" style={{ fontSize: '0.8rem', color: '#38bdf8' }}>
              View All
            </Link>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              No upcoming appointments scheduled.{' '}
              <Link to="/patient/appointments" style={{ color: '#38bdf8' }}>Schedule one</Link>
            </div>
          ) : (
            upcomingAppointments.slice(0, 2).map((appt) => (
              <div
                key={appt._id}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  marginBottom: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                    {appt.doctorName}
                  </div>
                  <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                    {appt.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  {appt.purpose}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    {new Date(appt.scheduledDate).toLocaleString()}
                  </span>
                  <span>• {appt.clinicOrHospital}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Symptoms Log Preview */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="#f87171" />
              <h3 style={{ fontSize: '1.05rem', color: '#ffffff' }}>Recent Symptom Reports</h3>
            </div>
            <Link to="/patient/symptoms" style={{ fontSize: '0.8rem', color: '#38bdf8' }}>
              Open Log
            </Link>
          </div>

          {recentSymptoms.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              No symptoms reported. Healthy baseline maintained!
            </div>
          ) : (
            recentSymptoms.slice(0, 3).map((sym) => (
              <div
                key={sym._id}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    {sym.symptom}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                    Reported on {new Date(sym.recordedAt).toLocaleDateString()} • {sym.bodyLocation || 'General'}
                  </div>
                </div>

                <span className={`badge ${sym.severity === 'critical' ? 'badge-critical' : sym.severity === 'severe' ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: '0.7rem' }}>
                  {sym.severity}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Record Measurement Modal */}
      <AddMeasurementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchDashboardData();
        }}
      />
    </div>
  );
};
