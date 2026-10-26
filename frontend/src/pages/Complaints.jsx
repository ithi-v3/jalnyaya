// JalNyaya - Complaints & 48-Hour SLA Monitoring Page
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {
  AlertCircle,
  Search,
  Plus,
  Clock,
  CheckCircle,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

export default function Complaints() {
  const { user, isAdmin, isOperator, isResident } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [streets, setStreets] = useState([]);
  const [operators, setOperators] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [lodgeModalOpen, setLodgeModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Form State - Lodge
  const [lodgeStreet, setLodgeStreet] = useState('');
  const [lodgeType, setLodgeType] = useState('MISSED_DELIVERY');
  const [lodgeDesc, setLodgeDesc] = useState('');
  const [lodgePriority, setLodgePriority] = useState('HIGH');

  // Form State - Assign
  const [assignOperatorId, setAssignOperatorId] = useState('');

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        status: statusFilter,
        complaint_type: typeFilter,
        priority: priorityFilter,
        search
      };
      if (isResident) {
        params.mine = 'true';
      }
      const res = await api.getComplaints(params);
      setComplaints(res.complaints || []);
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
      const [stRes, opRes] = await Promise.all([
        api.getStreets({ limit: 100 }),
        api.getUsers({ role_id: 2, limit: 50 })
      ]);
      setStreets(stRes.streets || []);
      setOperators(opRes.users || []);
      if (stRes.streets?.length > 0) setLodgeStreet(stRes.streets[0].street_id);
      if (opRes.users?.length > 0) setAssignOperatorId(opRes.users[0].user_id);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    loadComplaints();
  }, [page, statusFilter, typeFilter, priorityFilter]);

  const handleLodgeSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createComplaint({
        street_id: parseInt(lodgeStreet || user?.street_id || 1),
        complaint_type: lodgeType,
        description: lodgeDesc,
        priority: lodgePriority
      });
      setLodgeModalOpen(false);
      setLodgeDesc('');
      loadComplaints();
    } catch (err) {
      alert(err.message || 'Failed to lodge complaint');
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    try {
      await api.assignOperator(selectedComplaint.complaint_id, assignOperatorId);
      setAssignModalOpen(false);
      setSelectedComplaint(null);
      loadComplaints();
    } catch (err) {
      alert(err.message || 'Assignment failed');
    }
  };

  const handleResolveComplaint = async (id) => {
    if (!window.confirm('Mark this complaint as RESOLVED? This will compute resolution SLA.')) return;
    try {
      const res = await api.resolveComplaint(id);
      alert(res.message);
      loadComplaints();
    } catch (err) {
      alert(err.message || 'Resolution failed');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' }}>
            Water Grievance Redressal & 48h SLA Tracking
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
            Audited SLA compliance tracking with automated 48-hour breach alarms
          </p>
        </div>
        <button onClick={() => setLodgeModalOpen(true)} className="btn btn-primary btn-sm">
          <Plus size={15} /> Lodge New Complaint
        </button>
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
                placeholder="Search description, street..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search size={15} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>

            <select
              className="form-select"
              style={{ width: '150px' }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>

            <select
              className="form-select"
              style={{ width: '180px' }}
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Categories</option>
              <option value="MISSED_DELIVERY">Missed Delivery</option>
              <option value="INSUFFICIENT_QUANTITY">Insufficient Quantity</option>
              <option value="WATER_QUALITY">Water Quality</option>
              <option value="TIMING_ISSUE">Timing Issue</option>
              <option value="OPERATOR_BEHAVIOUR">Operator Conduct</option>
              <option value="OTHER">Other</option>
            </select>

            <button onClick={loadComplaints} className="btn btn-secondary btn-sm">Filter</button>
          </div>

          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Total Complaints: <strong>{total}</strong>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Street Location</th>
                <th>Resident</th>
                <th>Description</th>
                <th>Assigned Operator</th>
                <th>Elapsed Time</th>
                <th>48h SLA Status</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => (
                <tr key={c.complaint_id}>
                  <td style={{ fontWeight: 700 }}>#{c.complaint_id}</td>
                  <td style={{ fontSize: '0.8rem', fontWeight: 600 }}>{c.complaint_type}</td>
                  <td>{c.street?.street_name}</td>
                  <td>{c.resident?.name}</td>
                  <td style={{ maxWidth: '240px', fontSize: '0.8rem', color: '#334155' }}>{c.description}</td>
                  <td>{c.assignedOperator?.name || <span style={{ color: '#94a3b8' }}>Unassigned</span>}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                      <Clock size={13} style={{ color: '#64748b' }} />
                      <span>{c.elapsed_hours} hrs</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${
                      c.sla_status === 'WITHIN SLA' || c.sla_status === 'RESOLVED WITHIN SLA' ? 'badge-good' :
                      c.sla_status === 'DUE SOON' ? 'badge-below' : 'badge-critical'
                    }`}>
                      {c.sla_status}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${c.status === 'RESOLVED' ? 'badge-success' : 'badge-warning'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      {/* Admin Assign Operator */}
                      {isAdmin && c.status !== 'RESOLVED' && (
                        <button
                          onClick={() => {
                            setSelectedComplaint(c);
                            setAssignModalOpen(true);
                          }}
                          className="btn btn-secondary btn-sm"
                          title="Assign Operator"
                        >
                          <UserCheck size={13} />
                        </button>
                      )}

                      {/* Resolve Action */}
                      {(isAdmin || isOperator) && c.status !== 'RESOLVED' && (
                        <button
                          onClick={() => handleResolveComplaint(c.complaint_id)}
                          className="btn btn-success btn-sm"
                          title="Mark Resolved"
                        >
                          <CheckCircle size={13} /> Resolve
                        </button>
                      )}
                    </div>
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

      {/* Modal 1: Lodge Complaint */}
      {lodgeModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ maxWidth: '440px', width: '90%' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Lodge Water Grievance</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
              Complaints are logged with immediate timestamping and monitored under a 48-hour resolution benchmark.
            </p>
            <form onSubmit={handleLodgeSubmit}>
              {isAdmin && (
                <div className="form-group">
                  <label className="form-label">Street Location</label>
                  <select
                    className="form-select"
                    value={lodgeStreet}
                    onChange={(e) => setLodgeStreet(e.target.value)}
                    required
                  >
                    {streets.map((s) => (
                      <option key={s.street_id} value={s.street_id}>{s.street_name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={lodgeType}
                  onChange={(e) => setLodgeType(e.target.value)}
                >
                  <option value="MISSED_DELIVERY">Missed Tanker Delivery</option>
                  <option value="INSUFFICIENT_QUANTITY">Insufficient Water Volume</option>
                  <option value="WATER_QUALITY">Turbidity / Quality Sediment</option>
                  <option value="TIMING_ISSUE">Timing Inconvenience</option>
                  <option value="OPERATOR_BEHAVIOUR">Driver Conduct</option>
                  <option value="OTHER">Other Defect</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  className="form-select"
                  value={lodgePriority}
                  onChange={(e) => setLodgePriority(e.target.value)}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent (Severe scarcity)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Provide precise details..."
                  value={lodgeDesc}
                  onChange={(e) => setLodgeDesc(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setLodgeModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Grievance</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Assign Operator */}
      {assignModalOpen && selectedComplaint && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ maxWidth: '440px', width: '90%' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Assign Operator for Inspection
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
              Assigning an operator changes status to IN_PROGRESS and routes the ticket to their dashboard.
            </p>
            <form onSubmit={handleAssignSubmit}>
              <div className="form-group">
                <label className="form-label">Select Driver-Operator</label>
                <select
                  className="form-select"
                  value={assignOperatorId}
                  onChange={(e) => setAssignOperatorId(e.target.value)}
                  required
                >
                  {operators.map((op) => (
                    <option key={op.user_id} value={op.user_id}>{op.name} ({op.phone})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setAssignModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
