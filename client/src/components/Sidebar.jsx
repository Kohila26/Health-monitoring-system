import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  Calendar,
  ClipboardList,
  FileText,
  LineChart,
  MessageSquareHeart,
  Pill,
  Settings,
  Share2,
  ShieldCheck,
  Stethoscope,
  User,
  Users
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();
  if (!user) return null;

  const patientLinks = [
    { to: '/patient/dashboard', label: 'Dashboard', icon: Activity },
    { to: '/patient/measurements', label: 'Measurements', icon: ClipboardList },
    { to: '/patient/analytics', label: 'Trends & Alerts', icon: LineChart },
    { to: '/patient/symptoms', label: 'Symptom Log', icon: Activity },
    { to: '/patient/medications', label: 'Medications', icon: Pill },
    { to: '/patient/appointments', label: 'Appointments', icon: Calendar },
    { to: '/patient/ai-assistant', label: 'AI Health Assistant', icon: MessageSquareHeart, highlight: true },
    { to: '/patient/reports', label: 'PDF Reports', icon: FileText },
    { to: '/patient/sharing', label: 'Doctor Sharing', icon: Share2 },
    { to: '/patient/profile', label: 'Patient Profile', icon: User }
  ];

  const doctorLinks = [
    { to: '/doctor/dashboard', label: 'Shared Patients', icon: Users },
    { to: '/doctor/profile', label: 'Professional Profile', icon: Stethoscope }
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'System Overview', icon: Activity },
    { to: '/admin/users', label: 'User Management', icon: Users },
    { to: '/admin/audit-logs', label: 'HIPAA Audit Trail', icon: ShieldCheck },
    { to: '/admin/clinical-rules', label: 'Clinical Reference Rules', icon: Settings }
  ];

  let links = patientLinks;
  if (user.role === 'doctor') links = doctorLinks;
  if (user.role === 'admin') links = adminLinks;

  return (
    <aside style={{
      width: '260px',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      minHeight: 'calc(100vh - 68px)',
      padding: '24px 16px'
    }}>
      <div style={{
        fontSize: '0.72rem',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--text-dim)',
        paddingLeft: '12px',
        marginBottom: '12px',
        fontWeight: 700
      }}>
        {user.role} Navigation
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.9rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                background: isActive
                  ? 'linear-gradient(90deg, rgba(2, 132, 199, 0.25) 0%, rgba(2, 132, 199, 0.05) 100%)'
                  : 'transparent',
                borderLeft: isActive ? '3px solid #38bdf8' : '3px solid transparent',
                transition: 'all 0.15s ease',
                textDecoration: 'none'
              })}
            >
              <Icon size={18} color={link.highlight ? '#38bdf8' : 'currentColor'} />
              <span>{link.label}</span>
              {link.highlight && (
                <span style={{
                  marginLeft: 'auto',
                  fontSize: '0.65rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.2)',
                  color: '#38bdf8',
                  fontWeight: 700
                }}>
                  AI
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Safety Compliance Footer in Sidebar */}
      <div style={{
        marginTop: 'auto',
        padding: '14px',
        background: 'rgba(0, 0, 0, 0.25)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid rgba(255, 255, 255, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <ShieldCheck size={16} color="#10b981" />
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)' }}>
            Clinical Safety Protocol
          </span>
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
          Informational monitoring tool only. Not a medical substitute for physician diagnosis.
        </div>
      </div>
    </aside>
  );
};
