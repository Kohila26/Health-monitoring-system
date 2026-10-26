import React from 'react';
import { AlertTriangle, PhoneCall } from 'lucide-react';

export const EmergencyBanner = () => {
  return (
    <div className="emergency-banner">
      <div style={{
        background: 'rgba(239, 68, 68, 0.25)',
        padding: '8px',
        borderRadius: '8px',
        color: '#ef4444',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <AlertTriangle size={20} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
          <strong style={{ fontSize: '0.88rem', color: '#fca5a5' }}>
            CRITICAL MEDICAL SAFETY NOTICE:
          </strong>
          <span style={{ fontSize: '0.75rem', background: '#ef4444', color: '#ffffff', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
            EMERGENCY PROTOCOL
          </span>
        </div>
        <p style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: 0, lineHeight: 1.45 }}>
          This application is strictly an informational and monitoring platform. If you or someone you are monitoring experiences chest pressure or pain, sudden shortness of breath, slurred speech, acute confusion, or loss of consciousness, <strong>call 911 or go to the nearest emergency room immediately</strong>. Never delay seeking urgent professional medical care because of an app reading.
        </p>
      </div>
      <a
        href="tel:911"
        className="btn btn-danger btn-sm"
        style={{ flexShrink: 0, textDecoration: 'none' }}
      >
        <PhoneCall size={14} />
        Call 911
      </a>
    </div>
  );
};
