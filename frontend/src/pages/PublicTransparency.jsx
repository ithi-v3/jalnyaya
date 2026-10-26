// JalNyaya - Public Transparency Portal (Zero Auth Required, Clean Public Data)
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Droplet, Search, ShieldCheck, AlertTriangle, ArrowLeft, RefreshCw, LogIn } from 'lucide-react';

export default function PublicTransparency() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getPublicTransparency();
      setData(res);
    } catch (err) {
      setError('Unable to load public transparency data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredStreets = data?.streets.filter(s => {
    const matchesSearch = !search || 
      s.street_name.toLowerCase().includes(search.toLowerCase()) ||
      s.area_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || s.fairness_status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Public Header */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '1rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '0.4rem', borderRadius: '6px' }}>
              <Droplet size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.15rem', color: '#1e293b' }}>JalNyaya Public Transparency Portal</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Tamil Nadu Panchayat Water Distribution & Equity Monitor</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/login" className="btn btn-primary btn-sm">
              <LogIn size={14} /> Official / Resident Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1200px', margin: '1.5rem auto', padding: '0 1rem' }}>
        {/* Transparency Banner */}
        <div className="card" style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <ShieldCheck size={24} style={{ color: '#1d4ed8', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e40af' }}>Panchayat Public Water Rights & Equity Notice</h3>
              <p style={{ fontSize: '0.825rem', color: '#334155', marginTop: '0.2rem' }}>
                All tanker deliveries, street-level volume, and per-capita distribution ratios are publicly audited. 
                Data is updated live from panchayat distribution logs to guarantee fair, non-discriminatory water access across all wards.
              </p>
            </div>
          </div>
        </div>

        {/* Public Summary Metrics */}
        {data && (
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-label">Monitored Streets</div>
              <div className="stat-value">{data.summary.total_streets}</div>
              <div className="stat-desc">Across Vadavalli & Perur</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Total Water Distributed</div>
              <div className="stat-value">{Number(data.summary.total_litres_distributed).toLocaleString()} L</div>
              <div className="stat-desc">Current operational cycle</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Tanker Trips Completed</div>
              <div className="stat-value">{data.summary.total_completed_deliveries}</div>
              <div className="stat-desc">Verified by resident reps</div>
            </div>
          </div>
        )}

        {/* Street Equity Table */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Street-Level Water Equity Tracker</h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
                Formula: Litres Received / Population = Litres/Person benchmarked against Panchayat Average
              </p>
            </div>
            <button onClick={loadData} className="btn btn-secondary btn-sm" disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="toolbar">
            <div className="toolbar-group">
              <div style={{ position: 'relative', width: '260px' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2rem' }}
                  placeholder="Search street or area..."
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
                <option value="">All Equity Statuses</option>
                <option value="GOOD">Good (≥100% avg)</option>
                <option value="BELOW AVERAGE">Below Average (70–99%)</option>
                <option value="CRITICAL">Critical (&lt;70% avg)</option>
              </select>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Showing {filteredStreets.length} streets
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading equity registry...</div>
          ) : error ? (
            <div className="alert-banner alert-danger">{error}</div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Street Name</th>
                    <th>Area & Panchayat</th>
                    <th>Population</th>
                    <th>Deliveries</th>
                    <th>Total Litres</th>
                    <th>Litres / Person</th>
                    <th>Fairness Ratio</th>
                    <th>Equity Status</th>
                    <th>Last Delivery</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStreets.map((s) => (
                    <tr key={s.street_id}>
                      <td style={{ fontWeight: 700, color: '#334155' }}>#{s.fairness_rank || '-'}</td>
                      <td style={{ fontWeight: 600 }}>{s.street_name}</td>
                      <td>
                        <span style={{ color: '#475569' }}>{s.area_name}</span>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{s.panchayat_name}</div>
                      </td>
                      <td>{s.population?.toLocaleString()}</td>
                      <td>{s.monthly_deliveries || 0}</td>
                      <td>{Number(s.total_litres_received || 0).toLocaleString()} L</td>
                      <td style={{ fontWeight: 600 }}>{s.litres_per_person || '0.00'} L</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{s.fairness_percentage || 0}%</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>of {s.overall_average_litres_per_person || '0'} L avg</div>
                      </td>
                      <td>
                        <span className={`badge ${
                          s.fairness_status === 'GOOD' ? 'badge-good' :
                          s.fairness_status === 'BELOW AVERAGE' ? 'badge-below' : 'badge-critical'
                        }`}>
                          {s.fairness_status || 'CRITICAL'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {s.last_delivery_date ? new Date(s.last_delivery_date).toLocaleDateString() : (
                          <span style={{ color: '#dc2626', fontWeight: 600 }}>No deliveries</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredStreets.length === 0 && (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                        No streets found matching filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
