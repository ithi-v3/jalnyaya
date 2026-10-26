// JalNyaya - User Management Page (Single Unified Users Table RBAC)
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Users, Search, Plus, Edit, Trash2, Shield, ChevronLeft, ChevronRight } from 'lucide-react';

export default function UsersPage() {
  const { isAdmin } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [roles, setRoles] = useState([]);
  const [streets, setStreets] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('password123');
  const [roleId, setRoleId] = useState('3'); // Default Resident
  const [streetId, setStreetId] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getUsers({ page, limit: 10, search, role_id: roleFilter });
      setUsersList(res.users || []);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadLookups = async () => {
    try {
      const [rRes, sRes] = await Promise.all([
        api.getRoles(),
        api.getStreets({ limit: 100 })
      ]);
      setRoles(rRes.roles || []);
      setStreets(sRes.streets || []);
      if (sRes.streets?.length > 0) setStreetId(sRes.streets[0].street_id);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [page, roleFilter]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.createUser({
        name,
        email,
        phone,
        password,
        role_id: parseInt(roleId),
        street_id: streetId ? parseInt(streetId) : null
      });
      setModalOpen(false);
      setName('');
      setEmail('');
      setPhone('');
      loadUsers();
    } catch (err) {
      alert(err.message || 'Failed to create user');
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await api.updateUser(user.user_id, { is_active: !user.is_active });
      loadUsers();
    } catch (err) {
      alert(err.message || 'Status update failed');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' }}>
            Unified User Accounts & Role Permissions
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
            Requirement: Single <code>users</code> table managing Admins, Tanker Operators, and Residents with <code>role_id</code> foreign keys
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setModalOpen(true)} className="btn btn-primary btn-sm">
            <Plus size={15} /> Create User Account
          </button>
        )}
      </div>

      <div className="card">
        {/* Toolbar */}
        <div className="toolbar">
          <div className="toolbar-group">
            <div style={{ position: 'relative', width: '220px' }}>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2rem' }}
                placeholder="Search user name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search size={15} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>

            <select
              className="form-select"
              style={{ width: '170px' }}
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Roles</option>
              {roles.map((r) => (
                <option key={r.role_id} value={r.role_id}>{r.role_name}</option>
              ))}
            </select>

            <button onClick={loadUsers} className="btn btn-secondary btn-sm">Filter</button>
          </div>

          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Total Users: <strong>{total}</strong>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>Phone Number</th>
                <th>Role Assigned</th>
                <th>Associated Street</th>
                <th>Account Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((u) => (
                <tr key={u.user_id}>
                  <td style={{ fontWeight: 700 }}>#{u.user_id}</td>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>
                    <span className="user-role-tag">{u.role?.role_name}</span>
                  </td>
                  <td>{u.street?.street_name || <span style={{ color: '#94a3b8' }}>None</span>}</td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-good' : 'badge-danger'}`}>
                      {u.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleStatus(u)}
                      className={`btn btn-sm ${u.is_active ? 'btn-secondary' : 'btn-success'}`}
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination">
          <div>Showing Page {page} of {totalPages || 1}</div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn btn-secondary btn-sm"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn btn-secondary btn-sm"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ maxWidth: '440px', width: '90%' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Create User Account</h3>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. S. Balamurugan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. balamurugan@jalnyaya.gov.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 9443100107"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password (BCrypt Hashed)</label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">System Role</label>
                <select
                  className="form-select"
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  required
                >
                  {roles.map((r) => (
                    <option key={r.role_id} value={r.role_id}>{r.role_name} - {r.description}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Associated Street (Optional for Residents)</label>
                <select
                  className="form-select"
                  value={streetId}
                  onChange={(e) => setStreetId(e.target.value)}
                >
                  <option value="">None / Not Applicable</option>
                  {streets.map((s) => (
                    <option key={s.street_id} value={s.street_id}>{s.street_name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
