import React from 'react';
import { Activity, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  unit,
  severity = 'normal',
  subtitle,
  icon: Icon = Activity,
  timestamp,
  onClick
}) => {
  const getBadgeClass = () => {
    switch (severity) {
      case 'critical':
        return 'badge-critical';
      case 'warning':
        return 'badge-warning';
      case 'info':
        return 'badge-info';
      default:
        return 'badge-normal';
    }
  };

  return (
    <div
      className={`glass-card ${onClick ? 'glass-card-interactive' : ''}`}
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(56, 189, 248, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary-light)'
          }}>
            <Icon size={18} />
          </div>
          <span style={{ fontSize: '0.86rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {title}
          </span>
        </div>

        <span className={`badge ${getBadgeClass()}`}>
          {severity}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '6px' }}>
        <span style={{ fontSize: '1.9rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#ffffff' }}>
          {value !== undefined && value !== null ? value : '--'}
        </span>
        {unit && (
          <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 500 }}>
            {unit}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '8px' }}>
        <span>{subtitle || 'Status verified'}</span>
        {timestamp && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} />
            {new Date(timestamp).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
};
