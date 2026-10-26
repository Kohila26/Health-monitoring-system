import React from 'react';
import { useAuth } from '../context/AuthContext';
import { HeartPulse, LogOut, PhoneCall, ShieldCheck, User } from 'lucide-react';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  const getRoleBadgeClass = () => {
    switch (user?.role) {
      case 'doctor':
        return 'badge-info';
      case 'admin':
        return 'badge-warning';
      default:
        return 'badge-normal';
    }
  };

  return (
    <header style={{
      height: '68px',
      borderBottom: '1px solid var(--border)',
      background: 'rgba(13, 19, 31, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      position: 'sticky',
      top: 0,
      zIndex: 40
    }}>
      {/* Brand logo & title */}
      <div style={{ display: 'flex', alignContent: 'center', alignItems: 'center', gap: '14px' }}>
        <button
          onClick={onToggleSidebar}
          style={{
            display: 'none',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-main)',
            cursor: 'pointer'
          }}
          className="mobile-toggle-btn"
          aria-label="Toggle Navigation"
        >
          ☰
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(2, 132, 199, 0.4)'
          }}>
            <HeartPulse size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '-0.02em'
              }}>
                VitalPulse
              </span>
              <span style={{
                background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 800,
                fontSize: '0.8rem',
                letterSpacing: '0.05em'
              }}>
                AI
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', letterSpacing: '0.02em' }}>
              CLINICAL HEALTH INTELLIGENCE
            </div>
          </div>
        </div>
      </div>

      {/* Emergency guidance pill & User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          padding: '6px 12px',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.8rem',
          color: '#fca5a5'
        }}>
          <PhoneCall size={14} color="#ef4444" />
          <span>Emergency: <strong>911 / 988</strong></span>
        </div>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {user.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '2px' }}>
                <span className={`badge ${getRoleBadgeClass()}`} style={{ fontSize: '0.65rem', padding: '1px 7px' }}>
                  {user.role}
                </span>
                {user.isVerified && (
                  <span title="Verified Healthcare Account" style={{ display: 'flex', alignItems: 'center' }}>
                    <ShieldCheck size={14} color="#10b981" />
                  </span>
                )}
              </div>
            </div>

            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#1e293b',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-light)',
              fontWeight: 600
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>

            <button
              onClick={logout}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 10px', color: 'var(--text-muted)' }}
              title="Sign Out"
            >
              <LogOut size={16} />
              <span>Exit</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
