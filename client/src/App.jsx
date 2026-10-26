import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

// Patient Pages
import { PatientDashboard } from './pages/patient/PatientDashboard';
import { MeasurementsPage } from './pages/patient/MeasurementsPage';
import { AnalyticsPage } from './pages/patient/AnalyticsPage';
import { SymptomsPage } from './pages/patient/SymptomsPage';
import { MedicationsPage } from './pages/patient/MedicationsPage';
import { AppointmentsPage } from './pages/patient/AppointmentsPage';
import { AIAssistantPage } from './pages/patient/AIAssistantPage';
import { ReportsPage } from './pages/patient/ReportsPage';
import { DoctorSharingPage } from './pages/patient/DoctorSharingPage';
import { ProfilePage } from './pages/patient/ProfilePage';

// Doctor Pages
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-app)',
        color: '#38bdf8'
      }}>
        Loading VitalPulse AI Clinical Platform...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'doctor') return <Navigate to="/doctor/dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/patient/dashboard" replace />;
  }

  return children;
};

// Root index redirector
const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (user?.role === 'doctor') return <Navigate to="/doctor/dashboard" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/patient/dashboard" replace />;
};

// Layout with Navbar and Sidebar for protected views
const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="app-container">
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {sidebarOpen && <Sidebar />}
          <main className="main-content">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Patient Protected Routes */}
          <Route
            path="/patient/*"
            element={
              <ProtectedRoute allowedRoles={['patient', 'admin']}>
                <MainLayout>
                  <Routes>
                    <Route path="dashboard" element={<PatientDashboard />} />
                    <Route path="measurements" element={<MeasurementsPage />} />
                    <Route path="analytics" element={<AnalyticsPage />} />
                    <Route path="symptoms" element={<SymptomsPage />} />
                    <Route path="medications" element={<MedicationsPage />} />
                    <Route path="appointments" element={<AppointmentsPage />} />
                    <Route path="ai-assistant" element={<AIAssistantPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="sharing" element={<DoctorSharingPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Doctor Protected Routes */}
          <Route
            path="/doctor/*"
            element={
              <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                <MainLayout>
                  <Routes>
                    <Route path="dashboard" element={<DoctorDashboard />} />
                    <Route path="profile" element={<DoctorDashboard />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <MainLayout>
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="users" element={<AdminDashboard />} />
                    <Route path="audit-logs" element={<AdminDashboard />} />
                    <Route path="clinical-rules" element={<AdminDashboard />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
