// JalNyaya - Deliveries Management Page (CRUD, ACID Transaction, Anti-Fraud Disputes)
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {
  CalendarCheck,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

export default function Deliveries() {
  const { user, isAdmin, isOperator, isResident } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [streets, setStreets] = useState([]);
  const [tankers, setTankers] = useState([]);
  const [operators, setOperators] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [streetFilter, setStreetFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  // Form State - Schedule Delivery
  const [schedStreet, setSchedStreet] = useState('');
  const [schedTanker, setSchedTanker] = useState('');
  const [schedOperator, setSchedOperator] = useState('');
  const [schedDate, setSchedDate] = useState(new Date().toISOString().split('T')[0]);
  const [schedQuantity, setSchedQuantity] = useState('9000');
  const [schedNotes, setSchedNotes] = useState('');

  // Form State - Complete Transaction
  const [completeQty, setCompleteQty] = useState('');
  const [completeNotes, setCompleteNotes] = useState('');

  // Form State - Resident Confirmation
  const [confirmStatus, setConfirmStatus] = useState(true);
  const [confirmRemarks, setConfirmRemarks] = useState('');

  const loadDeliveries = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        status: statusFilter,
        street_id: streetFilter,
        search
      };
      if (isOperator) {
        // If operator, default to showing all or mine
      }
      const res = await api.getDeliveries(params);
      setDeliveries(res.deliveries || []);
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
      const [stRes, tkRes, opRes] = await Promise.all([
        api.getStreets({ limit: 100 }),
        api.getTankers({ limit: 50 }),
        api.getUsers({ role_id: 2, limit: 50 })
      ]);
      setStreets(stRes.streets || []);
      setTankers(tkRes.tankers || []);
      setOperators(opRes.users || []);

      if (stRes.streets?.length > 0) setSchedStreet(stRes.streets[0].street_id);
      if (tkRes.tankers?.length > 0) setSchedTanker(tkRes.tankers[0].tanker_id);
      if (opRes.users?.length > 0) setSchedOperator(opRes.users[0].user_id);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    loadDeliveries();
  }, [page, statusFilter, streetFilter]);

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createDelivery({
        street_id: parseInt(schedStreet),
        tanker_id: parseInt(schedTanker),
        operator_id: parseInt(schedOperator),
        scheduled_date: new Date(schedDate).toISOString(),
        quantity_litres: parseInt(schedQuantity),
        notes: schedNotes
      });
      setCreateModalOpen(false);
      loadDeliveries();
    } catch (err) {
      alert(err.message || 'Scheduling failed');
    }
  };

  const handleCompleteTransaction = async (e) => {
    e.preventDefault();
    if (!selectedDelivery) return;
    try {
      await api.completeDeliveryTransaction(selectedDelivery.delivery_id, {
        quantity_litres: parseInt(completeQty || selectedDelivery.quantity_litres),
        notes: completeNotes
      });
      setCompleteModalOpen(false);
      setSelectedDelivery(null);
      loadDeliveries();
    } catch (err) {
      alert(err.message || 'Transaction failed and rolled back');
    }
  };

  const handleConfirmSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDelivery) return;
    try {
      await api.submitDeliveryConfirmation(selectedDelivery.delivery_id, {
        confirmed: confirmStatus,
        remarks: confirmRemarks
      });
      setConfirmModalOpen(false);
      setSelectedDelivery(null);
      loadDeliveries();
    } catch (err) {
      alert(err.message || 'Confirmation failed');
    }
  };

  const handleCancelDelivery = async (id) => {
    const reason = prompt('Please enter the reason for cancelling this delivery:');
    if (!reason) return;
    try {
      await api.cancelDelivery(id, { reason });
      loadDeliveries();
    } catch (err) {
      alert(err.message || 'Cancellation failed');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' }}>Tanker Deliveries Management</h1>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
            Schedule dispatches, complete ACID database transactions, and record resident confirmations
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setCreateModalOpen(true)} className="btn btn-primary btn-sm">
            <Plus size={15} /> Schedule Delivery
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
                placeholder="Search street or notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search size={15} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>

            <select
              className="form-select"
              style={{ width: '160px' }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="DISPUTED">Disputed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              className="form-select"
              style={{ width: '190px' }}
              value={streetFilter}
              onChange={(e) => {
                setStreetFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Streets</option>
              {streets.map((s) => (
                <option key={s.street_id} value={s.street_id}>{s.street_name}</option>
              ))}
            </select>

            <button onClick={loadDeliveries} className="btn btn-secondary btn-sm">Filter</button>
          </div>

          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Total Deliveries: <strong>{total}</strong>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Street Location</th>
                <th>Tanker</th>
                <th>Driver-Operator</th>
                <th>Scheduled Date</th>
                <th>Volume (L)</th>
                <th>Status</th>
                <th>Confirmation</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((d) => (
                <tr key={d.delivery_id}>
                  <td style={{ fontWeight: 700 }}>#{d.delivery_id}</td>
                  <td style={{ fontWeight: 600 }}>{d.street?.street_name}</td>
                  <td>{d.tanker?.vehicle_number}</td>
                  <td>{d.operator?.name}</td>
                  <td>{new Date(d.scheduled_date).toLocaleDateString()}</td>
                  <td>{d.quantity_litres?.toLocaleString()} L</td>
                  <td>
                    <span className={`badge ${
                      d.status === 'COMPLETED' ? 'badge-success' :
                      d.status === 'SCHEDULED' ? 'badge-info' :
                      d.status === 'DISPUTED' ? 'badge-danger' : 'badge-neutral'
                    }`}>
                      {d.status}
                    </span>
                  </td>
                  <td>
                    {d.confirmations && d.confirmations.length > 0 ? (
                      d.confirmations[0].confirmed ? (
                        <span className="badge badge-success">Confirmed</span>
                      ) : (
                        <span className="badge badge-danger">Not Received</span>
                      )
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Pending</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      {/* Operator / Admin Completion Button */}
                      {(isAdmin || isOperator) && d.status === 'SCHEDULED' && (
                        <button
                          onClick={() => {
                            setSelectedDelivery(d);
                            setCompleteQty(d.quantity_litres);
                            setCompleteNotes(d.notes || '');
                            setCompleteModalOpen(true);
                          }}
                          className="btn btn-success btn-sm"
                          title="Complete Transaction"
                        >
                          <CheckCircle2 size={13} /> Complete
                        </button>
                      )}

                      {/* Resident Confirmation Button */}
                      {(isAdmin || isResident) && d.status === 'COMPLETED' && (
                        <button
                          onClick={() => {
                            setSelectedDelivery(d);
                            setConfirmModalOpen(true);
                          }}
                          className="btn btn-primary btn-sm"
                          title="Verify or Dispute Delivery"
                        >
                          Verify
                        </button>
                      )}

                      {/* Admin Cancel Button */}
                      {isAdmin && d.status === 'SCHEDULED' && (
                        <button
                          onClick={() => handleCancelDelivery(d.delivery_id)}
                          className="btn btn-secondary btn-sm"
                          title="Cancel"
                        >
                          <XCircle size={13} />
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

      {/* Modal 1: Schedule Delivery */}
      {createModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ maxWidth: '440px', width: '90%' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Schedule Tanker Delivery</h3>
            <form onSubmit={handleScheduleSubmit}>
              <div className="form-group">
                <label className="form-label">Destination Street</label>
                <select
                  className="form-select"
                  value={schedStreet}
                  onChange={(e) => setSchedStreet(e.target.value)}
                  required
                >
                  {streets.map((s) => (
                    <option key={s.street_id} value={s.street_id}>{s.street_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Select Tanker</label>
                <select
                  className="form-select"
                  value={schedTanker}
                  onChange={(e) => {
                    setSchedTanker(e.target.value);
                    const selected = tankers.find(t => t.tanker_id === parseInt(e.target.value));
                    if (selected) {
                      setSchedQuantity(selected.capacity_litres);
                      setSchedOperator(selected.operator_id);
                    }
                  }}
                  required
                >
                  {tankers.map((t) => (
                    <option key={t.tanker_id} value={t.tanker_id}>
                      {t.vehicle_number} ({t.capacity_litres} L) - {t.status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Assigned Operator</label>
                <select
                  className="form-select"
                  value={schedOperator}
                  onChange={(e) => setSchedOperator(e.target.value)}
                  required
                >
                  {operators.map((op) => (
                    <option key={op.user_id} value={op.user_id}>{op.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Scheduled Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={schedDate}
                    onChange={(e) => setSchedDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity (Litres)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={schedQuantity}
                    onChange={(e) => setSchedQuantity(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Operational Notes</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="e.g. Valve point #2 delivery"
                  value={schedNotes}
                  onChange={(e) => setSchedNotes(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setCreateModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Schedule Delivery</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Complete Transaction */}
      {completeModalOpen && selectedDelivery && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ maxWidth: '440px', width: '90%' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Execute Delivery Completion (ACID Transaction)
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
              Multi-step database transaction updates delivery, records volume, and sets street timestamp.
            </p>
            <form onSubmit={handleCompleteTransaction}>
              <div className="form-group">
                <label className="form-label">Delivered Volume (Litres)</label>
                <input
                  type="number"
                  className="form-input"
                  value={completeQty}
                  onChange={(e) => setCompleteQty(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Execution Notes</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setCompleteModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-success">Commit Transaction</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Resident Confirmation / Dispute */}
      {confirmModalOpen && selectedDelivery && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ maxWidth: '440px', width: '90%' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Resident Delivery Verification
            </h3>
            <form onSubmit={handleConfirmSubmit}>
              <div className="form-group">
                <label className="form-label">Water Received Status</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="status"
                      checked={confirmStatus === true}
                      onChange={() => setConfirmStatus(true)}
                    />
                    <span>Confirmed Received</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: '#b91c1c' }}>
                    <input
                      type="radio"
                      name="status"
                      checked={confirmStatus === false}
                      onChange={() => setConfirmStatus(false)}
                    />
                    <span>NOT RECEIVED (Dispute)</span>
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Remarks</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={confirmRemarks}
                  onChange={(e) => setConfirmRemarks(e.target.value)}
                  placeholder="Enter remarks..."
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setConfirmModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className={`btn ${confirmStatus ? 'btn-primary' : 'btn-danger'}`}>
                  {confirmStatus ? 'Confirm Delivery' : 'Flag Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
