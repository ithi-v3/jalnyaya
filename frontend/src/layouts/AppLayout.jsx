// JalNyaya - Main Application Layout & RBAC Navigation Sidebar
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Droplet,
  LayoutDashboard,
  MapPin,
  Home,
  Truck,
  CalendarCheck,
  AlertCircle,
  Activity,
  FileBarChart,
  CreditCard,
  Users,
  Eye,
  LogOut,
  Menu,
  X
} from 'lucide-react';

export default function AppLayout() {
  const { user, role, isAdmin, isOperator, isResident, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/dashboard" className="sidebar-brand" onClick={closeMobile}>
            <Droplet size={22} className="text-primary" />
            <span>JalNyaya</span>
          </Link>
          <div className="sidebar-subtitle">Water Tanker & Equity Tracker</div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Core Operations</div>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/transparency" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
            <Eye size={18} />
            <span>Public Transparency</span>
          </NavLink>

          {/* Role-Based Menus */}
          {(isAdmin || isOperator) && (
            <>
              <div className="nav-section-title" style={{ marginTop: '0.75rem' }}>Distribution</div>
              {isAdmin && (
                <>
                  <NavLink to="/streets" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
                    <MapPin size={18} />
                    <span>Streets & Zones</span>
                  </NavLink>
                  <NavLink to="/households" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
                    <Home size={18} />
                    <span>Households</span>
                  </NavLink>
                </>
              )}
              <NavLink to="/tankers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
                <Truck size={18} />
                <span>Tankers</span>
              </NavLink>
              <NavLink to="/deliveries" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
                <CalendarCheck size={18} />
                <span>Tanker Deliveries</span>
              </NavLink>
            </>
          )}

          {isResident && (
            <>
              <div className="nav-section-title" style={{ marginTop: '0.75rem' }}>Resident Verification</div>
              <NavLink to="/deliveries" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
                <CalendarCheck size={18} />
                <span>Confirm Deliveries</span>
              </NavLink>
            </>
          )}

          <div className="nav-section-title" style={{ marginTop: '0.75rem' }}>Monitoring & Grievances</div>
          <NavLink to="/complaints" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
            <AlertCircle size={18} />
            <span>Complaints & SLA</span>
          </NavLink>

          {(isAdmin || isOperator) && (
            <NavLink to="/water-sources" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
              <Activity size={18} />
              <span>Water Sources</span>
            </NavLink>
          )}

          {isAdmin && (
            <>
              <div className="nav-section-title" style={{ marginTop: '0.75rem' }}>Administration</div>
              <NavLink to="/reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
                <FileBarChart size={18} />
                <span>DBMS Reports & Analytics</span>
              </NavLink>
              <NavLink to="/payments" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
                <CreditCard size={18} />
                <span>Payments (₹)</span>
              </NavLink>
              <NavLink to="/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
                <Users size={18} />
                <span>User Management</span>
              </NavLink>
            </>
          )}

        </nav>

        <div className="sidebar-footer">
          <div className="user-badge" style={{ marginBottom: '0.5rem' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'User'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                <span className="user-role-tag">{role}</span>
                {user?.street && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user.street.street_name}</span>}
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-wrapper">
        <header className="top-navbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              style={{ display: 'none' }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <span style={{ fontWeight: 600, color: '#334155' }}>
              Tamil Nadu Panchayat Water Distribution & Equity Portal
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/transparency" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
              <Eye size={14} /> Public View
            </Link>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Logged in as: <strong>{user?.email}</strong>
            </div>
          </div>
        </header>

        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
