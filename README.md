# VitalPulse AI: Clinical Health Monitoring & Physiological Analytics Platform

![VitalPulse AI](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![MERN Stack](https://img.shields.io/badge/Stack-MongoDB%20%7C%20Express%20%7C%20React%20%7C%20Node.js-blue)
![AI Assisted](https://img.shields.io/badge/AI-OpenAI%20GPT--4o--mini%20%2B%20Clinical%20Fallback-cyan)
![Clinical Rules](https://img.shields.io/badge/Rules-ACC%2FAHA%20%7C%20ADA%20%7C%20WHO-orange)
![Security](https://img.shields.io/badge/Security-RBAC%20%7C%20HIPAA%20Audit%20Trail%20%7C%20Explicit%20Consent-purple)

VitalPulse AI is a responsive full-stack **Health Monitoring System** built with the **MERN stack** (MongoDB, Express, React, Node.js). It enables patients to record, monitor, and visualize health measurements, receive context-aware AI summaries, manage medication schedules and appointment prep, and securely share records with verified doctors under an explicit consent protocol.

---

## 🏥 Medical Safety & Legal Notice

> [!CAUTION]
> **VitalPulse AI is an informational and physiological monitoring platform, NOT a substitute for professional medical care or emergency services.**
> - It does not diagnose diseases, prescribe medication, or alter clinical treatment.
> - If you experience severe symptoms—such as acute chest pain, sudden shortness of breath, numbness, or loss of consciousness—**immediately call 911 or visit the nearest emergency facility**.

---

## 🚀 Key Features

### 1. Patient Portal
- **12 Comprehensive Measurement Categories:**
  - Heart Rate (bpm)
  - Blood Pressure (Systolic & Diastolic in mmHg)
  - Blood Glucose (mg/dL with fasting, post-meal, or random context)
  - Body Weight (kg) & Height (cm) with automatic BMI calculation
  - Oxygen Saturation (SpO2 %)
  - Body Temperature (°F / °C)
  - Respiratory Rate (breaths/min)
  - Sleep Duration & Quality
  - Physical Activity & Hydration tracking
- **Clinical Rule & Anomaly Detection:** Instant evaluation against ACC/AHA, ADA, and WHO clinical thresholds with severity labeling (`normal`, `info`, `warning`, `critical`).
- **Audit-Tracked Corrections:** Correct incorrectly logged readings while preserving historical audit logs.
- **Interactive Trend Charts:** Recharts visualization across 7, 14, 30, and 90-day timeframes with moving averages, min/max metrics, and anomaly flags.
- **Symptom Journal & Red Flag Warning:** Categorize onset, duration, and body locations with automated red flag detection for acute complaints.
- **Medication Organizer:** Dosage schedules, frequency, prescribing physician details, and today's 1-click dose checklist (`taken`, `skipped`, `missed`).
- **Appointment Planner:** Timezone-aware scheduling, clinic logistics, preparation notes, and structured questions to ask the doctor.

### 2. AI Health Assistant
- **Context-Aware Physiological Explanations:** Explains measurements in simple, reassuring language.
- **Longitudinal Trend Summaries:** Analyzes trends over time and cross-references active medications and symptoms.
- **Physician Question Generator:** Suggests structured questions for the patient's next clinical consultation.
- **Resilient Multi-Engine Architecture:** Integrates with OpenAI (`gpt-4o-mini`) and includes an automated fallback clinical knowledge engine that operates even without external API keys or during network outages.

### 3. Doctor / Healthcare Professional Module
- **Consent-Enforced Access:** Physicians can *only* access records of patients who explicitly granted active consent.
- **Consented Patient Dashboard:** Overview of shared patients, latest vitals, active alerts count, and symptom logs.
- **Signed Physician Notes:** Author professional clinical observations and recommendations, clearly distinguished from automated AI summaries.
- **Directory Browsing:** Patients can search verified doctors by specialization, hospital affiliation, and experience.

### 4. Admin Governance & HIPAA Audit Trail
- **System Metrics & Live Health:** Real-time database status, process uptime, Node runtime, and memory metrics.
- **Doctor Verification Queue:** Review and verify medical license credentials before granting physician portal access.
- **User Account Governance:** Search, filter, activate, or deactivate accounts and adjust roles.
- **Configurable Clinical Rules:** Modify normal, warning, and emergency thresholds for key vitals in real time.
- **Immutable Audit Trail:** Logs all record creation, modification, doctor access events, and consent changes with timestamps, IP addresses, and user roles.

### 5. Automated PDF Health Report Generator
- Compiles formatted A4 PDF reports with patient demographics, vital range tables, alert history, active medications, symptoms, signed doctor notes, and AI clinical summaries.
- One-click browser preview and download.

---

## 💻 Tech Stack

- **Frontend:** React 18, Vite 5, React Router 6, Recharts, Lucide Icons, Vanilla CSS Design System with glassmorphism and clinical color tokens.
- **Backend:** Node.js, Express 4, Mongoose 8, JWT Authentication, bcryptjs, Helmet, CORS, Rate-Limiting, Multer, PDFKit.
- **Database:** MongoDB (indexes on `user`, `type`, `recordedAt`, `status`).
- **AI Engine:** OpenAI Node SDK + Intelligent Clinical Rule Fallback Engine.

---

## ⚡ Quick Start & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended, v24 supported)
- [MongoDB](https://www.mongodb.com/) running locally on port `27017` (or MongoDB Atlas URI)

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/Kohila26/Health-monitoring-system.git
cd Health-monitoring-system

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
cd ..
```

### 2. Environment Configuration

Create `.env` inside `server/` (or copy from `.env.example`):

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/ai_health_monitor
JWT_SECRET=super_secret_jwt_key_ai_health_monitor_2026
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

*(Note: If you do not provide an OpenAI key, the application automatically uses its built-in clinical intelligence fallback engine without crashing!)*

### 3. Seed Realistic Demo Database

Populate realistic patient vitals, alerts, medications, appointments, verified doctors, and consent relationships:

```bash
cd server
node scripts/seed.js
```

### 4. Start the Application

In **Terminal 1** (Backend API):
```bash
cd server
node server.js
# Runs on http://localhost:5000
```

In **Terminal 2** (Frontend Dev Server):
```bash
cd client
npm run dev
# Runs on http://localhost:5173
```

Open your browser to: **`http://localhost:5173`**

---

## 🔑 Demo Login Accounts

The login screen includes **1-click autofill demo buttons** for each role:

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Patient** | `patient@healthmonitor.io` | `Password123!` | Eleanor Vance — 14-day vital series, stage 1 BP alert, active medications, upcoming cardiology consultation |
| **Doctor** | `doctor@healthmonitor.io` | `Password123!` | Dr. Sarah Chen, MD — Verified Cardiologist with active consent to Eleanor Vance's records |
| **Admin** | `admin@healthmonitor.io` | `Password123!` | System Administrator — System health monitoring, doctor verification queue, HIPAA audit log |

---

## 🧪 Automated Testing & Verification

Run the built-in test runner to verify all 15 core API endpoints:

```bash
node test_all_endpoints.js
```

### Expected Output:
```
====================================================
 RUNNING COMPREHENSIVE ENDPOINT VERIFICATION TESTS  
====================================================

[PASS] GET /api/health returns status ok
[PASS] POST /api/auth/login logs in demo patient
[PASS] POST /api/auth/login logs in demo doctor
[PASS] POST /api/auth/login logs in system admin
[PASS] POST /api/measurements logs blood pressure & evaluates clinical rule
[PASS] GET /api/health/summary returns aggregated vitals snapshot
[PASS] GET /api/health/trends returns time-series data for charting
[PASS] POST /api/health/alerts/:id/acknowledge marks alert acknowledged with note
[PASS] POST /api/ai/explain-measurement explains resting heart rate reading
[PASS] POST /api/ai/chat returns safe clinical advice with medical disclaimer
[PASS] POST /api/reports generates structured PDF clinical summary
[PASS] GET /api/doctor/patients lists patients who granted explicit consent
[PASS] POST /api/doctor/patients/:patientId/notes adds signed physician note
[PASS] GET /api/admin/dashboard returns system status and metrics
[PASS] GET /api/admin/audit-logs returns immutable HIPAA access log records

====================================================
 TEST SUMMARY: 15 PASSED, 0 FAILED 
====================================================
```

### Postman Collection
Import `postman_collection.json` into Postman to test all endpoints interactively.

---

## 📐 Project Architecture

```
Health-monitoring-system/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AddAppointmentModal.jsx
│   │   │   ├── AddMedicationModal.jsx
│   │   │   ├── AddMeasurementModal.jsx
│   │   │   ├── AddSymptomModal.jsx
│   │   │   ├── EmergencyBanner.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── StatCard.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   └── AdminDashboard.jsx
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Register.jsx
│   │   │   ├── doctor/
│   │   │   │   └── DoctorDashboard.jsx
│   │   │   └── patient/
│   │   │       ├── AIAssistantPage.jsx
│   │   │       ├── AnalyticsPage.jsx
│   │   │       ├── AppointmentsPage.jsx
│   │   │       ├── DoctorSharingPage.jsx
│   │   │       ├── MeasurementsPage.jsx
│   │   │       ├── MedicationsPage.jsx
│   │   │       ├── PatientDashboard.jsx
│   │   │       ├── ProfilePage.jsx
│   │   │       ├── ReportsPage.jsx
│   │   │       └── SymptomsPage.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── config/
│   │   ├── db.js
│   │   └── rules.js
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── aiController.js
│   │   ├── appointmentController.js
│   │   ├── authController.js
│   │   ├── consentController.js
│   │   ├── doctorController.js
│   │   ├── healthAnalyticsController.js
│   │   ├── measurementController.js
│   │   ├── medicationController.js
│   │   ├── reportController.js
│   │   └── symptomController.js
│   ├── middleware/
│   │   ├── auditMiddleware.js
│   │   ├── authMiddleware.js
│   │   ├── rateLimitMiddleware.js
│   │   ├── roleMiddleware.js
│   │   ├── uploadMiddleware.js
│   │   └── validateMiddleware.js
│   ├── models/
│   │   ├── AIConversation.js
│   │   ├── Appointment.js
│   │   ├── AuditLog.js
│   │   ├── DoctorProfile.js
│   │   ├── HealthAlert.js
│   │   ├── HealthMeasurement.js
│   │   ├── HealthReport.js
│   │   ├── MedicationRecord.js
│   │   ├── MedicationReminder.js
│   │   ├── Notification.js
│   │   ├── PatientConsent.js
│   │   ├── PatientProfile.js
│   │   ├── ReferenceRange.js
│   │   └── User.js
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── aiRoutes.js
│   │   ├── appointmentRoutes.js
│   │   ├── authRoutes.js
│   │   ├── consentRoutes.js
│   │   ├── doctorRoutes.js
│   │   ├── healthRoutes.js
│   │   ├── measurementRoutes.js
│   │   ├── medicationRoutes.js
│   │   ├── reportRoutes.js
│   │   └── symptomRoutes.js
│   ├── scripts/
│   │   └── seed.js
│   ├── services/
│   │   ├── aiService.js
│   │   ├── alertService.js
│   │   ├── healthAnalyticsService.js
│   │   └── reportService.js
│   ├── app.js
│   ├── package.json
│   └── server.js
├── .env.example
├── .gitignore
├── package.json
├── postman_collection.json
├── test_all_endpoints.js
└── README.md
```

---

## 🔒 Security & Privacy Practices

1. **Role-Based Access Control (RBAC):** Backend route guards (`protect` and `authorize`) ensure patients, doctors, and administrators can only perform permitted actions.
2. **Explicit Patient Consent:** Doctors cannot query patient records via direct object references. Queries require an active document in `PatientConsent` granted by the patient.
3. **Password Security:** Salted hashing with `bcryptjs` (cost factor 10) with password exclusion from normal queries (`select: false`).
4. **Defense in Depth:** Helmet HTTP security headers, CORS origin whitelisting, rate limiting on API routes, and parameter sanitization.
5. **HIPAA-Aligned Audit Trail:** Read, write, and authorization modification events are persistently recorded in `AuditLog` with actor ID, IP address, target resource, and timestamp.

---

## 📄 License
This project is licensed under the MIT License.