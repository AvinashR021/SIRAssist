import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CitizenDashboard from './pages/CitizenDashboard';
import CitizenProfile from './pages/CitizenProfile';
import DocumentsPage from './pages/DocumentsPage';
import RequestDetails from './pages/RequestDetails';
import VolunteerDashboard from './pages/VolunteerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DbmsDemoPage from './pages/DbmsDemoPage';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="p-8 text-center text-xs text-slate-500">Authenticating session...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
}

export default function App() {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/demo" element={<DbmsDemoPage />} />

          {/* Citizen Protected Routes */}
          <Route
            path="/citizen-dashboard"
            element={
              <ProtectedRoute allowedRoles={['CITIZEN']}>
                <CitizenDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['CITIZEN']}>
                <CitizenProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <ProtectedRoute allowedRoles={['CITIZEN']}>
                <DocumentsPage />
              </ProtectedRoute>
            }
          />

          {/* Shared Request Details */}
          <Route
            path="/requests/:id"
            element={
              <ProtectedRoute allowedRoles={['CITIZEN', 'VOLUNTEER', 'ADMIN']}>
                <RequestDetails />
              </ProtectedRoute>
            }
          />

          {/* Volunteer Protected Route */}
          <Route
            path="/volunteer-dashboard"
            element={
              <ProtectedRoute allowedRoles={['VOLUNTEER']}>
                <VolunteerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Route */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
