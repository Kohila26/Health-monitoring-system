import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import {
  Calendar,
  CheckSquare,
  Download,
  Eye,
  FileCheck,
  FileText,
  Plus,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Form State
  const [title, setTitle] = useState('Monthly Comprehensive Health Assessment');
  const [days, setDays] = useState('30');
  const [includeVitals, setIncludeVitals] = useState(true);
  const [includeSymptoms, setIncludeSymptoms] = useState(true);
  const [includeMedications, setIncludeMedications] = useState(true);
  const [includeAppointments, setIncludeAppointments] = useState(true);
  const [includeAISummary, setIncludeAISummary] = useState(true);
  const [doctorNotes, setDoctorNotes] = useState('');

  // Preview Modal State
  const [previewReport, setPreviewReport] = useState(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/reports');
      if (res.success) {
        setReports(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setGenerating(true);

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const payload = {
        title,
        startDate,
        endDate: new Date(),
        includedSections: {
          measurements: includeVitals,
          vitalsSummary: includeVitals,
          symptoms: includeSymptoms,
          medications: includeMedications,
          appointments: includeAppointments,
          aiSummary: includeAISummary
        },
        doctorNotes
      };

      const res = await apiRequest('/reports', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        fetchReports();
        alert('Clinical health report generated successfully! You can preview or download the PDF below.');
      }
    } catch (err) {
      alert(err.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="title-xl">Clinical Health Reports & PDF Generator</h1>
        <p className="subtitle">
          Export verified longitudinal summaries, trend tables, and AI-assisted clinical narratives for your doctor
        </p>
      </div>

      <div className="grid-3" style={{ marginBottom: '32px' }}>
        {/* Generator Form */}
        <div className="glass-card" style={{ gridColumn: 'span 2' }}>
          <h3 style={{ fontSize: '1.15rem', color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="#38bdf8" /> Configure New Health Report
          </h3>

          <form onSubmit={handleGenerateReport}>
            <div className="form-group">
              <label className="form-label">Report Title</label>
              <input
                type="text"
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Timeframe Covered</label>
              <select className="form-control" value={days} onChange={(e) => setDays(e.target.value)}>
                <option value="7">Past 7 Days (Weekly Progress Review)</option>
                <option value="30">Past 30 Days (Standard Monthly Evaluation)</option>
                <option value="60">Past 60 Days (Bi-Monthly Checkup)</option>
                <option value="90">Past 90 Days (Quarterly Chronic Monitoring)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Select Sections to Include</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={includeVitals}
                    onChange={(e) => setIncludeVitals(e.target.checked)}
                  />
                  <span>Vital Measurements Table & Stats</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={includeSymptoms}
                    onChange={(e) => setIncludeSymptoms(e.target.checked)}
                  />
                  <span>Logged Symptoms & Onset Diary</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={includeMedications}
                    onChange={(e) => setIncludeMedications(e.target.checked)}
                  />
                  <span>Active Medication Schedules</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={includeAISummary}
                    onChange={(e) => setIncludeAISummary(e.target.checked)}
                  />
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>AI Clinical Overview Draft</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Doctor / Patient Consultation Notes (Optional)</label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Include any specific topics or instructions you want noted in this document"
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                PDF compiles formatted charts, doctor review sections, and legal disclaimers.
              </div>

              <button type="submit" className="btn btn-primary" disabled={generating}>
                <Sparkles size={16} />
                <span>{generating ? 'Compiling PDF...' : 'Generate PDF Report'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Info Card on PDF Reports */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px'
            }}>
              <ShieldCheck size={22} />
            </div>

            <h3 style={{ fontSize: '1.1rem', color: '#ffffff', marginBottom: '8px' }}>
              Doctor-Ready Formats
            </h3>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Generated PDFs are organized cleanly with patient demographics, vital ranges, threshold alerts, and doctor question prompts.
            </p>

            <ul style={{ paddingLeft: '18px', marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
              <li>Includes explicit units and measurement timestamps</li>
              <li>Distinguishes objective records from AI interpretations</li>
              <li>Includes mandatory clinical escalation disclaimers</li>
            </ul>
          </div>

          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.75rem',
            color: 'var(--text-dim)',
            marginTop: '16px'
          }}>
            Format: Standard ISO A4 PDF with encrypted transmission
          </div>
        </div>
      </div>

      {/* Reports History */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.15rem', color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileCheck size={18} color="#10b981" /> Report Archive & Downloads
        </h3>

        {reports.length === 0 ? (
          <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            No health reports generated yet. Configure and generate your first report above!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {reports.map((r) => (
              <div
                key={r._id}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.98rem', color: '#ffffff', marginBottom: '4px' }}>
                    {r.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span>Generated: {new Date(r.createdAt).toLocaleString()}</span>
                    <span>• {r.summaryStats?.totalMeasurements || 0} Measurements Analyzed</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setPreviewReport(r)}
                    className="btn btn-secondary btn-sm"
                  >
                    <Eye size={14} /> Preview
                  </button>

                  {r.pdfUrl && (
                    <a
                      href={r.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="btn btn-primary btn-sm"
                    >
                      <Download size={14} /> Download PDF
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewReport && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', color: '#ffffff' }}>
                Report Preview: {previewReport.title}
              </h3>
              <button onClick={() => setPreviewReport(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              <div style={{
                background: '#0f172a',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
                border: '1px solid var(--border)'
              }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                  Coverage: {new Date(previewReport.dateRange?.startDate).toLocaleDateString()} to {new Date(previewReport.dateRange?.endDate).toLocaleDateString()}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Total Measurements Analyzed: <strong>{previewReport.summaryStats?.totalMeasurements || 0}</strong>
                </div>
              </div>

              {previewReport.aiSummary?.text && (
                <div style={{
                  background: 'rgba(56, 189, 248, 0.06)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8', marginBottom: '8px', textTransform: 'uppercase' }}>
                    AI-Generated Clinical Summary
                  </div>
                  <div style={{ fontSize: '0.86rem', color: '#f1f5f9', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
                    {previewReport.aiSummary.text}
                  </div>
                </div>
              )}

              {previewReport.doctorNotes && (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid var(--warning-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  fontSize: '0.85rem',
                  color: '#fde68a'
                }}>
                  <strong>Consultation Notes:</strong> {previewReport.doctorNotes}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setPreviewReport(null)}>
                Close Preview
              </button>

              {previewReport.pdfUrl && (
                <a
                  href={previewReport.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="btn btn-primary"
                >
                  <Download size={14} /> Download PDF
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
