import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Edit2,
  HardDrive,
  Lock,
  Search,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  Users,
  XCircle
} from 'lucide-react';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [rules, setRules] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit Reference Range Modal
  const [editingRange, setEditingRange] = useState(null);
  const [normalMin, setNormalMin] = useState('');
  const [normalMax, setNormalMax] = useState('');
  const [warningLow, setWarningLow] = useState('');
  const [warningHigh, setWarningHigh] = useState('');
  const [criticalLow, setCriticalLow] = useState('');
  const [criticalHigh, setCriticalHigh] = useState('');

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/admin/dashboard');
      if (res.success) {
        setStats(res.data.stats);
        setSystemStatus(res.data.systemStatus);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await apiRequest(`/admin/users?search=${searchQuery}`);
      if (res.success) setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await apiRequest('/admin/audit-logs');
      if (res.success) setAuditLogs(res.data || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
  };

  const fetchRules = async () => {
    try {
      const res = await apiRequest('/admin/reference-ranges');
      if (res.success) setRules(res.data || []);
    } catch (err) {
      console.error('Failed to load reference rules:', err);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'audits') fetchAuditLogs();
    if (activeTab === 'rules') fetchRules();
  }, [activeTab, searchQuery]);

  const handleVerifyDoctor = async (doctorId, status) => {
    try {
      await apiRequest(`/admin/doctors/${doctorId}/verify`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      fetchDashboardStats();
      if (activeTab === 'users') fetchUsers();
    } catch (err) {
      alert(err.message || 'Verification failed');
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await apiRequest(`/admin/users/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !currentStatus })
      });
      fetchUsers();
    } catch (err) {
      alert(err.message || 'Status toggle failed');
    }
  };

  const handleOpenEditRange = (r) => {
    setEditingRange(r);
    setNormalMin(r.normalMin ?? '');
    setNormalMax(r.normalMax ?? '');
    setWarningLow(r.warningLow ?? '');
    setWarningHigh(r.warningHigh ?? '');
    setCriticalLow(r.criticalLow ?? '');
    setCriticalHigh(r.criticalHigh ?? '');
  };

  const handleSaveRange = async (e) => {
    e.preventDefault();
    if (!editingRange) return;

    try {
      await apiRequest(`/admin/reference-ranges/${editingRange._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          normalMin: parseFloat(normalMin),
          normalMax: parseFloat(normalMax),
          warningLow: parseFloat(warningLow),
          warningHigh: parseFloat(warningHigh),
          criticalLow: parseFloat(criticalLow),
          criticalHigh: parseFloat(criticalHigh)
        })
      });
      setEditingRange(null);
      fetchRules();
    } catch (err) {
      alert(err.message || 'Failed to update reference range');
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="title-xl" style={{ margin: 0 }}>System Administration & Governance</h1>
            <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
              ADMINISTRATOR LEVEL
            </span>
          </div>
          <p className="subtitle" style={{ marginTop: '4px' }}>
            System health, HIPAA audit logs, doctor account verification, and clinical reference rules
          </p>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'inline-flex',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 'var(--radius-md)',
          padding: '4px'
        }}>
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'audits', label: 'HIPAA Audit Logs', icon: ShieldCheck },
            { id: 'rules', label: 'Clinical Rules', icon: Settings }
          ].map((t) => {
            const Icon = t.icon;
            const isAct = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  background: isAct ? '#0284c7' : 'transparent',
                  color: isAct ? '#ffffff' : 'var(--text-muted)',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Icon size={14} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <>
          {/* Key Metric Cards */}
          <div className="grid-4" style={{ marginBottom: '28px' }}>
            <div className="glass-card">
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Total Registered Users</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>{stats?.totalUsers || 0}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>{stats?.totalPatients || 0} Patients • {stats?.totalDoctors || 0} Physicians</div>
            </div>

            <div className="glass-card">
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Doctor Verification Queue</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: stats?.pendingDoctors > 0 ? '#fbbf24' : '#34d399', marginTop: '4px' }}>
                {stats?.pendingDoctors || 0}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>Pending medical license approval</div>
            </div>

            <div className="glass-card">
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Total Vitals Logged</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#a78bfa', marginTop: '4px' }}>{stats?.totalMeasurements || 0}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>Across all verified accounts</div>
            </div>

            <div className="glass-card">
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Critical Clinical Alerts</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f87171', marginTop: '4px' }}>{stats?.criticalAlerts || 0}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>Escalation guidance triggered</div>
            </div>
          </div>

          {/* System Health Status */}
          <div className="grid-2">
            <div className="glass-card">
              <h3 style={{ fontSize: '1.15rem', color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Server size={18} color="#10b981" /> Application Health & Metrics
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Database Engine:</span>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>{systemStatus?.database || 'Connected'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Clinical Rule Engine:</span>
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>v{systemStatus?.ruleVersion || '2026.1'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Process Uptime:</span>
                  <span style={{ color: '#ffffff' }}>{systemStatus?.uptimeSeconds || 0} seconds</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Node.js Runtime:</span>
                  <span style={{ color: '#ffffff' }}>{systemStatus?.nodeVersion || 'v24'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Memory Heap Usage:</span>
                  <span style={{ color: '#ffffff' }}>{systemStatus?.memoryUsageMB || 0} MB</span>
                </div>
              </div>
            </div>

            {/* Privacy Architecture Notice */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1.15rem', color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="#38bdf8" /> Privacy & Access Architecture
              </h3>

              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '14px' }}>
                Administrators are intentionally restricted from browsing raw, unconsented patient medical charts by default. All system and doctor access events are recorded immutably in the HIPAA audit logs.
              </p>

              <div style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                fontSize: '0.8rem',
                color: '#7dd3fc'
              }}>
                <strong>Governance Rule:</strong> Exceptional record access requires justification and generates an immediate security log event.
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tab 2: User Management */}
      {activeTab === 'users' && (
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="#38bdf8" /> User & Role Management
            </h3>

            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '36px' }}
                placeholder="Search name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 16px' }}>User</th>
                  <th style={{ padding: '12px 16px' }}>Role</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Verification</th>
                  <th style={{ padding: '12px 16px' }}>Registered</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#ffffff' }}>{u.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{u.email}</div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <span className={`badge ${u.role === 'admin' ? 'badge-warning' : u.role === 'doctor' ? 'badge-info' : 'badge-normal'}`}>
                        {u.role}
                      </span>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ color: u.isActive ? '#34d399' : '#f87171', fontWeight: 600, fontSize: '0.8rem' }}>
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      {u.role === 'doctor' ? (
                        u.isVerified ? (
                          <span className="badge badge-normal" style={{ fontSize: '0.68rem' }}>Verified MD</span>
                        ) : (
                          <button
                            onClick={() => handleVerifyDoctor(u._id, true)}
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                          >
                            Verify Doctor
                          </button>
                        )
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Standard</span>
                      )}
                    </td>

                    <td style={{ padding: '12px 16px', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleToggleUserStatus(u._id, u.isActive)}
                        className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`}
                        style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: HIPAA Audit Logs */}
      {activeTab === 'audits' && (
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="#10b981" /> Immutable HIPAA Audit Trail
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Logging of record creations, doctor access events, and consent updates
              </p>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 16px' }}>Timestamp</th>
                  <th style={{ padding: '12px 16px' }}>Action</th>
                  <th style={{ padding: '12px 16px' }}>Performed By</th>
                  <th style={{ padding: '12px 16px' }}>Role</th>
                  <th style={{ padding: '12px 16px' }}>Resource Type</th>
                  <th style={{ padding: '12px 16px' }}>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#38bdf8' }}>
                      {log.action}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#ffffff' }}>
                      {log.performedBy?.name || 'System'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                        {log.performedByRole}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                      {log.resourceType}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Clinical Rules */}
      {activeTab === 'rules' && (
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={18} color="#38bdf8" /> Configurable Measurement Reference Rules
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Configure clinically reviewed threshold ranges that trigger warnings and emergencies
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {rules.map((r) => (
              <div
                key={r._id}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', color: '#ffffff' }}>{r.displayName}</h4>
                    <span style={{ fontSize: '0.8rem', color: '#38bdf8' }}>Unit: {r.unit}</span>
                  </div>

                  <button
                    onClick={() => handleOpenEditRange(r)}
                    className="btn btn-secondary btn-sm"
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <div>Normal Target: <strong style={{ color: '#34d399' }}>{r.normalMin} - {r.normalMax} {r.unit}</strong></div>
                  <div>Warning Range: <strong style={{ color: '#fbbf24' }}>&lt;{r.warningLow} or &gt;{r.warningHigh}</strong></div>
                  <div>Critical Emergency: <strong style={{ color: '#f87171' }}>&lt;{r.criticalLow} or &gt;{r.criticalHigh}</strong></div>
                </div>

                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                  Guideline: {r.clinicalGuideline || 'AHA / WHO'} • Rule Version {r.ruleVersion || '2026.1'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Reference Range Modal */}
      {editingRange && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', color: '#ffffff' }}>
                Configure Range: {editingRange.displayName}
              </h3>
              <button onClick={() => setEditingRange(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRange}>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Normal Minimum</label>
                    <input
                      type="number"
                      step="any"
                      className="form-control"
                      value={normalMin}
                      onChange={(e) => setNormalMin(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Normal Maximum</label>
                    <input
                      type="number"
                      step="any"
                      className="form-control"
                      value={normalMax}
                      onChange={(e) => setNormalMax(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Warning Low Threshold</label>
                    <input
                      type="number"
                      step="any"
                      className="form-control"
                      value={warningLow}
                      onChange={(e) => setWarningLow(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Warning High Threshold</label>
                    <input
                      type="number"
                      step="any"
                      className="form-control"
                      value={warningHigh}
                      onChange={(e) => setWarningHigh(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Critical Emergency Low</label>
                    <input
                      type="number"
                      step="any"
                      className="form-control"
                      value={criticalLow}
                      onChange={(e) => setCriticalLow(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Critical Emergency High</label>
                    <input
                      type="number"
                      step="any"
                      className="form-control"
                      value={criticalHigh}
                      onChange={(e) => setCriticalHigh(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingRange(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Clinical Thresholds
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
