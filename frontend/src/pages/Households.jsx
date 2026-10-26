// JalNyaya - Households Management Page (CRUD, Search, Filter, Pagination)
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Home, Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Households() {
  const { isAdmin } = useAuth();
  const [households, setHouseholds] = useState([]);
  const [streets, setStreets] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [streetId, setStreetId] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editHousehold, setEditHousehold] = useState(null);

  // Form State
  const [headName, setHeadName] = useState('');
  const [membersCount, setMembersCount] = useState('4');
  const [phone, setPhone] = useState('');
  const [waterReq, setWaterReq] = useState('280');
  const [selectedStreet, setSelectedStreet] = useState('');

  const loadHouseholds = async () => {
    setLoading(true);
    try {
      const res = await api.getHouseholds({ page, limit: 10, search, street_id: streetId });
      setHouseholds(res.households || []);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStreets = async () => {
    try {
      const res = await api.getStreets({ limit: 100 });
      setStreets(res.streets || []);
      if (res.streets?.length > 0 && !selectedStreet) {
        setSelectedStreet(res.streets[0].street_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadStreets();
  }, []);

  useEffect(() => {
    loadHouseholds();
  }, [page, streetId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadHouseholds();
  };

  const openCreateModal = () => {
    setEditHousehold(null);
    setHeadName('');
    setMembersCount('4');
    setPhone('');
    setWaterReq('280');
    setSelectedStreet(streets[0]?.street_id || '');
    setModalOpen(true);
  };

  const openEditModal = (h) => {
    setEditHousehold(h);
    setHeadName(h.head_name);
    setMembersCount(h.members_count);
    setPhone(h.phone);
    setWaterReq(h.water_requirement);
    setSelectedStreet(h.street_id);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        head_name: headName,
        members_count: parseInt(membersCount),
        phone: phone,
        water_requirement: parseInt(waterReq),
        street_id: parseInt(selectedStreet)
      };

      if (editHousehold) {
        await api.updateHousehold(editHousehold.household_id, payload);
      } else {
        await api.createHousehold(payload);
      }
      setModalOpen(false);
      loadHouseholds();
    } catch (err) {
      alert(err.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this household record?')) return;
    try {
      await api.deleteHousehold(id);
      loadHouseholds();
    } catch (err) {
      alert(err.message || 'Failed to delete');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' }}>Registered Consumer Households</h1>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
            Household registry establishing daily water quota requirements across streets
          </p>
        </div>
        {isAdmin && (
          <button onClick={openCreateModal} className="btn btn-primary btn-sm">
            <Plus size={15} /> Register Household
          </button>
        )}
      </div>

      <div className="card">
        {/* Toolbar */}
        <form onSubmit={handleSearchSubmit} className="toolbar">
          <div className="toolbar-group">
            <div style={{ position: 'relative', width: '240px' }}>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2rem' }}
                placeholder="Search head of family or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search size={15} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>

            <select
              className="form-select"
              style={{ width: '220px' }}
              value={streetId}
              onChange={(e) => {
                setStreetId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Streets</option>
              {streets.map((s) => (
                <option key={s.street_id} value={s.street_id}>{s.street_name}</option>
              ))}
            </select>

            <button type="submit" className="btn btn-secondary btn-sm">Filter</button>
          </div>

          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Total Households: <strong>{total}</strong>
          </div>
        </form>

        {/* Table */}
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Head of Family</th>
                <th>Street Location</th>
                <th>Family Members</th>
                <th>Contact Phone</th>
                <th>Daily Need (L/day)</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {households.map((h) => (
                <tr key={h.household_id}>
                  <td style={{ fontWeight: 700 }}>#{h.household_id}</td>
                  <td style={{ fontWeight: 600 }}>{h.head_name}</td>
                  <td>
                    {h.street?.street_name}
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{h.street?.area_name}</div>
                  </td>
                  <td>{h.members_count} members</td>
                  <td>{h.phone}</td>
                  <td>
                    <span className="badge badge-info">{h.water_requirement} L</span>
                  </td>
                  {isAdmin && (
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button onClick={() => openEditModal(h)} className="btn btn-secondary btn-sm" title="Edit">
                          <Edit size={13} />
                        </button>
                        <button onClick={() => handleDelete(h.household_id)} className="btn btn-danger btn-sm" title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  )}
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
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
              {editHousehold ? 'Edit Household' : 'Register New Household'}
            </h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Head of Household Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. A. Ramasamy"
                  value={headName}
                  onChange={(e) => setHeadName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Street</label>
                <select
                  className="form-select"
                  value={selectedStreet}
                  onChange={(e) => setSelectedStreet(e.target.value)}
                  required
                >
                  {streets.map((s) => (
                    <option key={s.street_id} value={s.street_id}>{s.street_name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Members Count</label>
                  <input
                    type="number"
                    className="form-input"
                    value={membersCount}
                    onChange={(e) => {
                      setMembersCount(e.target.value);
                      setWaterReq(parseInt(e.target.value || 0) * 70);
                    }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Daily Need (L)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={waterReq}
                    onChange={(e) => setWaterReq(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 9443200101"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Household</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
