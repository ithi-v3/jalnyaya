// JalNyaya - Main Application Router & Route Protectors
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';

// Layouts & Pages
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import PublicTransparency from './pages/PublicTransparency';
import Dashboard from './pages/Dashboard';
import Streets from './pages/Streets';
import Households from './pages/Households';
import Tankers from './pages/Tankers';
import Deliveries from './pages/Deliveries';
import Complaints from './pages/Complaints';
import WaterSources from './pages/WaterSources';
import Reports from './pages/Reports';
import Payments from './pages/Payments';
import UsersPage from './pages/Users';


// Protected Route Component (Checks Token & Role)
function ProtectedRoute({ children, allowedRoles }) {
  const { user, token, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Checking authorization...</div>;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: '#b91c1c' }}>403 - Access Forbidden</h2>
        <p style={{ marginTop: '0.5rem', color: '#64748b' }}>
          Your user account role (<strong>{user.role}</strong>) does not have permission to view this module.
        </p>
      </div>
    );
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/transparency" element={<PublicTransparency />} />
          <Route path="/login" element={<Login />} />

          {/* Authenticated Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="deliveries" element={<Deliveries />} />
            <Route path="complaints" element={<Complaints />} />

            {/* Operator & Admin Routes */}
            <Route
              path="tankers"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'OPERATOR']}>
                  <Tankers />
                </ProtectedRoute>
              }
            />
            <Route
              path="water-sources"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'OPERATOR']}>
                  <WaterSources />
                </ProtectedRoute>
              }
            />

            {/* Admin-Only Management Routes */}
            <Route
              path="streets"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <Streets />
                </ProtectedRoute>
              }
            />
            <Route
              path="households"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <Households />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="payments"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <Payments />
                </ProtectedRoute>
              }
            />
            <Route
              path="users"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
