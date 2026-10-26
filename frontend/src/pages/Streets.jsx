// JalNyaya - Streets Management Page (CRUD, Search, Filter, Pagination)
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { MapPin, Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Streets() {
  const { isAdmin } = useAuth();
  const [streets, setStreets] = useState([]);
  const [zones, setZones] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editStreet, setEditStreet] = useState(null);

  // Form State
  const [streetName, setStreetName] = useState('');
  const [areaName, setAreaName] = useState('');
  const [panchayatName, setPanchayatName] = useState('Vadavalli Special Village');
  const [population, setPopulation] = useState('');
  const [householdCount, setHouseholdCount] = useState('');
  const [selectedZone, setSelectedZone] = useState('');

  const loadStreets = async () => {
    setLoading(true);
    try {
      const res = await api.getStreets({ page, limit: 10, search, zone_id: zoneId });
      setStreets(res.streets || []);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadZones = async () => {
    try {
      const res = await api.getZones();
      setZones(res.zones || []);
      if (res.zones?.length > 0 && !selectedZone) {
        setSelectedZone(res.zones[0].zone_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadZones();
  }, []);

  useEffect(() => {
    loadStreets();
  }, [page, zoneId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadStreets();
  };

  const openCreateModal = () => {
    setEditStreet(null);
    setStreetName('');
    setAreaName('');
    setPopulation('');
    setHouseholdCount('');
    setSelectedZone(zones[0]?.zone_id || '');
    setModalOpen(true);
  };

  const openEditModal = (s) => {
    setEditStreet(s);
    setStreetName(s.street_name);
    setAreaName(s.area_name);
    setPanchayatName(s.panchayat_name);
    setPopulation(s.population);
    setHouseholdCount(s.household_count);
    setSelectedZone(s.zone_id);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        street_name: streetName,
        area_name: areaName,
        panchayat_name: panchayatName,
        population: parseInt(population),
        household_count: parseInt(householdCount),
        zone_id: parseInt(selectedZone)
      };

      if (editStreet) {
        await api.updateStreet(editStreet.street_id, payload);
      } else {
        await api.createStreet(payload);
      }
      setModalOpen(false);
      loadStreets();
    } catch (err) {
      alert(err.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this street?')) return;
    try {
      await api.deleteStreet(id);
      loadStreets();
    } catch (err) {
      alert(err.message || 'Failed to delete street');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' }}>Streets & Distribution Wards</h1>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
            Primary geographic entities for equity tracking, quota calculation, and tanker allocation
          </p>
        </div>
        {isAdmin && (
          <button onClick={openCreateModal} className="btn btn-primary btn-sm">
            <Plus size={15} /> Add New Street
          </button>
        )}
      </div>

      <div className="card">
        {/* Toolbar */}
        <form onSubmit={handleSearchSubmit} className="toolbar">
          <div className="toolbar-group">
            <div style={{ position: 'relative', width: '260px' }}>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2rem' }}
                placeholder="Search street name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search size={15} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>

            <select
              className="form-select"
              style={{ width: '220px' }}
              value={zoneId}
              onChange={(e) => {
                setZoneId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Administrative Zones</option>
              {zones.map((z) => (
                <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>
              ))}
            </select>

            <button type="submit" className="btn btn-secondary btn-sm">Filter</button>
          </div>

          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Total Streets: <strong>{total}</strong>
          </div>
        </form>

        {/* Table */}
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Street Name</th>
                <th>Area & Ward</th>
                <th>Zone</th>
                <th>Population</th>
                <th>Households</th>
                <th>Last Delivery</th>
                <th>Priority Score</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {streets.map((s) => (
                <tr key={s.street_id}>
                  <td style={{ fontWeight: 700 }}>#{s.street_id}</td>
                  <td style={{ fontWeight: 600 }}>{s.street_name}</td>
                  <td>
                    {s.area_name}
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{s.panchayat_name}</div>
                  </td>
                  <td>{s.zone?.zone_name}</td>
                  <td>{s.population?.toLocaleString()}</td>
                  <td>{s.household_count}</td>
                  <td>
                    {s.last_delivery_date ? (
                      new Date(s.last_delivery_date).toLocaleDateString()
                    ) : (
                      <span style={{ color: '#dc2626', fontWeight: 600, fontSize: '0.75rem' }}>Never Delivered</span>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-info">{s.priority_score} pts</span>
                  </td>
                  {isAdmin && (
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button onClick={() => openEditModal(s)} className="btn btn-secondary btn-sm" title="Edit">
                          <Edit size={13} />
                        </button>
                        <button onClick={() => handleDelete(s.street_id)} className="btn btn-danger btn-sm" title="Delete">
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

      {/* Modal for Create/Edit */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ maxWidth: '460px', width: '90%' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
              {editStreet ? 'Edit Street Details' : 'Register New Street'}
            </h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Street Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Kamarajar Salai"
                  value={streetName}
                  onChange={(e) => setStreetName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Area / Locality</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Vadavalli"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Panchayat Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={panchayatName}
                  onChange={(e) => setPanchayatName(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Population</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 500"
                    value={population}
                    onChange={(e) => setPopulation(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Households</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 120"
                    value={householdCount}
                    onChange={(e) => setHouseholdCount(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Administrative Zone</label>
                <select
                  className="form-select"
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  required
                >
                  {zones.map((z) => (
                    <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Street</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
