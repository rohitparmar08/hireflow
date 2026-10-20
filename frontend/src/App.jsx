import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profile from './pages/Profile';
import JobListing from './pages/jobs/JobListing';
import JobDetail from './pages/jobs/JobDetail';
import CreateJob from './pages/recruiter/CreateJob';
import EditJob from './pages/recruiter/EditJob';
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard';
import CandidateDashboard from './pages/candidate/CandidateDashboard';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleGuard from './routes/RoleGuard';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
          <Navbar />
          <div className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/jobs" element={<JobListing />} />
              <Route path="/jobs/:id" element={<JobDetail />} />

              {/* Authenticated Common Route */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Recruiter Protected Routes (RoleGuard) */}
              <Route
                path="/recruiter/dashboard"
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRole="RECRUITER">
                      <RecruiterDashboard />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter/jobs/create"
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRole="RECRUITER">
                      <CreateJob />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter/jobs/:id/edit"
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRole="RECRUITER">
                      <EditJob />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />

              {/* Candidate Protected Route (RoleGuard) */}
              <Route
                path="/candidate/dashboard"
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRole="CANDIDATE">
                      <CandidateDashboard />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
            HireFlow &bull; AI-Powered Recruitment Management Platform &bull; Phase 3 Complete
          </footer>
        </div>
      </AuthProvider>
    </Router>
  );
}
