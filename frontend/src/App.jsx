import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Shared Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Route Pages
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Team from './pages/Team';
import FAQ from './pages/FAQ';
import MemberDashboard from './pages/MemberDashboard';
import MembershipCardDetails from './pages/MembershipCardDetails';
import AdminPanel from './pages/AdminPanel';
import AttendanceHub from './pages/AttendanceHub';
import RolePromotion from './pages/RolePromotion';
import NoticeSheets from './pages/NoticeSheets';
import Projects from './pages/Projects';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-[#0a0f1d] text-slate-100 selection:bg-cyan-500 selection:text-white">
          <Navbar />
          
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/team" element={<Team />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/notices" element={<NoticeSheets />} />
              <Route path="/notice-sheet" element={<Navigate to="/notices" replace />} />
              <Route path="/admin/notices" element={<NoticeSheets />} />
              <Route path="/members" element={<Navigate to="/team" replace />} />

              {/* Protected Member Routes */}
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <Projects />
                  </ProtectedRoute>
                }
              />
              <Route path="/initiatives" element={<Navigate to="/projects" replace />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <MemberDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/membership"
                element={
                  <ProtectedRoute>
                    <MembershipCardDetails />
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin-Only Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/attendance"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AttendanceHub />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/promotion"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <RolePromotion />
                  </ProtectedRoute>
                }
              />

              {/* 404 Catch-All */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
