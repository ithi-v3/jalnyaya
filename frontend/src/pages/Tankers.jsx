// JalNyaya - Tankers Management Page (CRUD, Search, Filter, Pagination)
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Truck, Search, Plus, Edit, Trash2, Wrench, CheckCircle } from 'lucide-react';

export default function Tankers() {
  const { isAdmin, isOperator } = useAuth();
  const [tankers, setTankers] = useState([]);
  const [operators, setOperators] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTanker, setEditTanker] = useState(null);

  // Form State
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [capacityLitres, setCapacityLitres] = useState('9000');
  const [operatorId, setOperatorId] = useState('');
  const [status, setStatus] = useState('AVAILABLE');

  const loadTankers = async () => {
    setLoading(true);
    try {
      const res = await api.getTankers({ page, limit: 10, search, status: statusFilter });
      setTankers(res.tankers || []);
      setTotal(res.pagination.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadOperators = async () => {
    try {
      const res = await api.getUsers({ role_id: 2, limit: 50 }); // Operator role_id = 2
      setOperators(res.users || []);
      if (res.users?.length > 0 && !operatorId) {
        setOperatorId(res.users[0].user_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadOperators();
  }, []);

  useEffect(() => {
    loadTankers();
  }, [page, statusFilter]);

  const openCreateModal = () => {
    setEditTanker(null);
    setVehicleNumber('');
    setCapacityLitres('9000');
    setStatus('AVAILABLE');
    setOperatorId(operators[0]?.user_id || '');
    setModalOpen(true);
  };

  const openEditModal = (t) => {
    setEditTanker(t);
    setVehicleNumber(t.vehicle_number);
    setCapacityLitres(t.capacity_litres);
    setStatus(t.status);
    setOperatorId(t.operator_id);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        vehicle_number: vehicleNumber,
        capacity_litres: parseInt(capacityLitres),
        operator_id: parseInt(operatorId),
        status
      };

      if (editTanker) {
        await api.updateTanker(editTanker.tanker_id, payload);
      } else {
        await api.createTanker(payload);
      }
      setModalOpen(false);
      loadTankers();
    } catch (err) {
      alert(err.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this tanker record?')) return;
    try {
      await api.deleteTanker(id);
      loadTankers();
    } catch (err) {
      alert(err.message || 'Failed to delete');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' }}>Panchayat Tanker Fleet</h1>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
            Vehicle registry, driver assignment, maintenance records, and operational capacity
          </p>
        </div>
        {isAdmin && (
          <button onClick={openCreateModal} className="btn btn-primary btn-sm">
            <Plus size={15} /> Add Tanker
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
                placeholder="Search vehicle number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search size={15} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>

            <select
              className="form-select"
              style={{ width: '180px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Fleet Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="OUT_OF_SERVICE">Out of Service</option>
            </select>

            <button onClick={loadTankers} className="btn btn-secondary btn-sm">Filter</button>
          </div>

          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Total Tankers: <strong>{total}</strong>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Vehicle Number</th>
                <th>Capacity</th>
                <th>Assigned Driver-Operator</th>
                <th>Contact</th>
                <th>Operational Status</th>
                <th>Last Service</th>
                {(isAdmin || isOperator) && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {tankers.map((t) => (
                <tr key={t.tanker_id}>
                  <td style={{ fontWeight: 700 }}>#{t.tanker_id}</td>
                  <td style={{ fontWeight: 600 }}>{t.vehicle_number}</td>
                  <td>{t.capacity_litres?.toLocaleString()} Litres</td>
                  <td style={{ fontWeight: 500 }}>{t.operator?.name}</td>
                  <td>{t.operator?.phone}</td>
                  <td>
                    <span className={`badge ${
                      t.status === 'AVAILABLE' ? 'badge-good' :
                      t.status === 'IN_TRANSIT' ? 'badge-info' :
                      t.status === 'MAINTENANCE' ? 'badge-below' : 'badge-critical'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td>{t.last_service_date ? new Date(t.last_service_date).toLocaleDateString() : 'N/A'}</td>
                  {(isAdmin || isOperator) && (
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button onClick={() => openEditModal(t)} className="btn btn-secondary btn-sm" title="Edit">
                          <Edit size={13} />
                        </button>
                        {isAdmin && (
                          <button onClick={() => handleDelete(t.tanker_id)} className="btn btn-danger btn-sm" title="Delete">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ maxWidth: '440px', width: '90%' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
              {editTanker ? 'Update Tanker Details' : 'Add New Water Tanker'}
            </h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Vehicle Registration Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. TN-38-AF-4012"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Water Capacity (Litres)</label>
                <select
                  className="form-select"
                  value={capacityLitres}
                  onChange={(e) => setCapacityLitres(e.target.value)}
                >
                  <option value="6000">6,000 Litres (Mini)</option>
                  <option value="9000">9,000 Litres (Standard)</option>
                  <option value="12000">12,000 Litres (Heavy)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Assigned Driver-Operator</label>
                <select
                  className="form-select"
                  value={operatorId}
                  onChange={(e) => setOperatorId(e.target.value)}
                  required
                >
                  {operators.map((op) => (
                    <option key={op.user_id} value={op.user_id}>{op.name} ({op.phone})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Fleet Status</label>
                <select
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="IN_TRANSIT">IN_TRANSIT</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                  <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Tanker</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
