import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Bell,
  Heart,
  Save,
  ShieldCheck,
  User
} from 'lucide-react';

export const ProfilePage = () => {
  const { user, profile, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('prefer_not_to_say');
  const [bloodGroup, setBloodGroup] = useState('unknown');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [allergies, setAllergies] = useState('');
  const [chronicConditions, setChronicConditions] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
    if (profile) {
      setGender(profile.gender || 'prefer_not_to_say');
      setBloodGroup(profile.bloodGroup || 'unknown');
      setHeight(profile.height || '');
      setWeight(profile.weight || '');
      setEmergencyName(profile.emergencyContact?.name || '');
      setEmergencyPhone(profile.emergencyContact?.phone || '');
      setEmergencyRelation(profile.emergencyContact?.relationship || '');
      setAllergies((profile.allergies || []).join(', '));
      setChronicConditions((profile.chronicConditions || []).join(', '));
    }
  }, [user, profile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      const payload = {
        name,
        phone,
        gender,
        bloodGroup,
        height: height ? parseFloat(height) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        emergencyContact: {
          name: emergencyName,
          phone: emergencyPhone,
          relationship: emergencyRelation
        },
        allergies: allergies ? allergies.split(',').map(a => a.trim()) : [],
        chronicConditions: chronicConditions ? chronicConditions.split(',').map(c => c.trim()) : []
      };

      const res = await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        setSuccessMsg('Profile updated successfully!');
        refreshUser();
      }
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="title-xl">Patient Profile & Demographics</h1>
        <p className="subtitle">
          Manage your personal contact details, medical history, and clinical measurement baselines
        </p>
      </div>

      <div className="glass-card" style={{ maxWidth: '800px' }}>
        {successMsg && (
          <div style={{
            background: 'var(--success-bg)',
            border: '1px solid var(--success-border)',
            color: '#34d399',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            fontSize: '0.85rem'
          }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSave}>
          <h3 style={{ fontSize: '1.1rem', color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} color="#38bdf8" /> Basic Demographics
          </h3>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address (Read-Only)</label>
              <input
                type="email"
                className="form-control"
                value={user?.email || ''}
                disabled
                style={{ opacity: 0.6 }}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-control"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Biological Gender</label>
              <select className="form-control" value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Blood Group</label>
              <select className="form-control" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                <option value="unknown">Unknown</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Height (cm)</label>
              <input
                type="number"
                className="form-control"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Weight (kg)</label>
              <input
                type="number"
                className="form-control"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
          </div>

          <h3 style={{ fontSize: '1.1rem', color: '#ffffff', margin: '24px 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Heart size={18} color="#ef4444" /> Voluntary Clinical History
          </h3>

          <div className="form-group">
            <label className="form-label">Known Allergies (Comma separated)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Penicillin, Peanuts, Latex"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Chronic Conditions / Diagnoses (Comma separated)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Essential Hypertension, Type 2 Diabetes, Asthma"
              value={chronicConditions}
              onChange={(e) => setChronicConditions(e.target.value)}
            />
          </div>

          <h3 style={{ fontSize: '1.1rem', color: '#ffffff', margin: '24px 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="#10b981" /> Emergency Contact
          </h3>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Contact Name</label>
              <input
                type="text"
                className="form-control"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Relationship</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Spouse, Parent"
                value={emergencyRelation}
                onChange={(e) => setEmergencyRelation(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Emergency Phone</label>
              <input
                type="tel"
                className="form-control"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={16} />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
