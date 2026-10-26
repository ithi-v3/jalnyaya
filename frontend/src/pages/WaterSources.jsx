// JalNyaya - Water Sources & Depletion Monitoring Page
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {
  Activity,
  Plus,
  AlertTriangle,
  TrendingDown,
  Droplet,
  CheckCircle,
  ShieldAlert,
  RefreshCw
} from 'lucide-react';

export default function WaterSources() {
  const { isAdmin, isOperator } = useAuth();
  const [sources, setSources] = useState([]);
  const [trends, setTrends] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [readingModalOpen, setReadingModalOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);

  // Form State - Create Source
  const [sourceName, setSourceName] = useState('');
  const [sourceType, setSourceType] = useState('BOREWELL');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('100000');
  const [currentLevel, setCurrentLevel] = useState('80000');

  // Form State - Add Reading
  const [newReadingLitres, setNewReadingLitres] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [srcRes, trnRes, alrRes] = await Promise.all([
        api.getWaterSources(),
        api.getWaterTrends(),
        api.getAlerts(false) // Unresolved alerts
      ]);
      setSources(srcRes.sources || []);
      setTrends(trnRes.trends || []);
      setAlerts(alrRes.alerts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCreateSource = async (e) => {
    e.preventDefault();
    try {
      await api.createWaterSource({
        source_name: sourceName,
        source_type: sourceType,
        location,
        capacity_litres: parseInt(capacity),
        current_level_litres: parseInt(currentLevel)
      });
      setCreateModalOpen(false);
      loadAll();
    } catch (err) {
      alert(err.message || 'Creation failed');
    }
  };

  const handleAddReading = async (e) => {
    e.preventDefault();
    if (!selectedSource) return;
    try {
      const res = await api.addWaterReading(selectedSource.source_id, newReadingLitres);
      if (res.alert) {
        alert(`🚨 AUTOMATED ALERT TRIGGERED: ${res.alert.message}`);
      } else {
        alert('✔ Water level reading logged successfully.');
      }
      setReadingModalOpen(false);
      setSelectedSource(null);
      setNewReadingLitres('');
      loadAll();
    } catch (err) {
      alert(err.message || 'Failed to record reading');
    }
  };

  const handleResolveAlert = async (id) => {
    try {
      await api.resolveAlert(id);
      loadAll();
    } catch (err) {
      alert(err.message || 'Failed to resolve alert');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' }}>
            Water Sources & Depletion Monitoring
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
            Real-time aquifer reserves, telemetry readings, and automatic depletion alarms
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isAdmin && (
            <button onClick={() => setCreateModalOpen(true)} className="btn btn-primary btn-sm">
              <Plus size={15} /> Add Water Source
            </button>
          )}
        </div>
      </div>

      {/* Active Alerts Bar */}
      {alerts.length > 0 && (
        <div className="card" style={{ backgroundColor: '#fff1f2', borderColor: '#fecaca', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991b1b', fontWeight: 600 }}>
              <ShieldAlert size={18} />
              <span>Active Depletion Alarms</span>
            </div>
            <span className="badge badge-danger">{alerts.length} Pending</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {alerts.map((al) => (
              <div key={al.alert_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '0.6rem 0.85rem', borderRadius: '4px', border: '1px solid #fee2e2' }}>
                <div style={{ fontSize: '0.825rem' }}>
                  <strong style={{ color: '#991b1b' }}>[{al.alert_type}]</strong> {al.message}
                </div>
                {isAdmin && (
                  <button onClick={() => handleResolveAlert(al.alert_id)} className="btn btn-secondary btn-sm" style={{ flexShrink: 0, marginLeft: '0.75rem' }}>
                    <CheckCircle size={13} /> Mark Resolved
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Water Sources Grid Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {sources.map((s) => (
          <div key={s.source_id} className="card" style={{ margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{s.source_name}</h3>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.location}</div>
              </div>
              <span className={`badge ${
                s.percentage_level >= 70 ? 'badge-good' :
                s.percentage_level >= 50 ? 'badge-below' : 'badge-critical'
              }`}>
                {s.status}
              </span>
            </div>

            <div style={{ margin: '0.75rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                <span style={{ color: '#64748b' }}>Current Water Reserve:</span>
                <strong>{s.percentage_level}% ({s.current_level_litres?.toLocaleString()} L)</strong>
              </div>
              {/* Progress Bar */}
              <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, Math.max(0, s.percentage_level))}%`,
                  backgroundColor: s.percentage_level >= 70 ? '#16a34a' : s.percentage_level >= 50 ? '#d97706' : '#dc2626'
                }}></div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
              <span>Capacity: {s.capacity_litres?.toLocaleString()} L</span>
              {(isAdmin || isOperator) && (
                <button
                  onClick={() => {
                    setSelectedSource(s);
                    setNewReadingLitres(s.current_level_litres);
                    setReadingModalOpen(true);
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  <Plus size={13} /> Log Reading
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Database Water Level Historical Trends Chart */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Water Level Historical Trends (Time-Series Database Chart)</h2>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Rendered from <code>water_level_readings</code> table with 40 point history.
            </div>
          </div>
          <button onClick={loadAll} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} /> Refresh Chart
          </button>
        </div>

        <div style={{ height: '220px', width: '100%', padding: '0.5rem 0' }}>
          <svg viewBox="0 0 800 200" style={{ width: '100%', height: '100%' }}>
            {/* Horizontal Grid lines */}
            <line x1="50" y1="20" x2="780" y2="20" stroke="#f1f5f9" strokeDasharray="3" />
            <text x="10" y="24" fontSize="10" fill="#94a3b8">100%</text>

            <line x1="50" y1="52" x2="780" y2="52" stroke="#e2e8f0" strokeDasharray="3" />
            <text x="10" y="56" fontSize="10" fill="#94a3b8">80% (Low)</text>

            <line x1="50" y1="84" x2="780" y2="84" stroke="#fecaca" strokeDasharray="3" />
            <text x="10" y="88" fontSize="10" fill="#dc2626">60% (Critical)</text>

            <line x1="50" y1="180" x2="780" y2="180" stroke="#cbd5e1" />
            <text x="10" y="184" fontSize="10" fill="#94a3b8">0%</text>

            {/* Plot Trend Polylines */}
            {sources.map((s, sIdx) => {
              const srcReadings = trends.filter(t => t.source_id === s.source_id).slice(-16);
              if (srcReadings.length === 0) return null;
              const colors = ['#1d4ed8', '#0284c7', '#059669', '#dc2626', '#d97706'];
              const color = colors[sIdx % colors.length];

              const pts = srcReadings.map((r, i) => {
                const x = 70 + (i * 44);
                const y = 180 - (r.percentage * 1.6);
                return `${x},${y}`;
              }).join(' ');

              return (
                <g key={s.source_id}>
                  <polyline fill="none" stroke={color} strokeWidth="2.5" points={pts} />
                  {srcReadings.map((r, i) => {
                    const x = 70 + (i * 44);
                    const y = 180 - (r.percentage * 1.6);
                    return <circle key={r.reading_id} cx={x} cy={y} r="3" fill={color} />;
                  })}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', justifyContent: 'center', fontSize: '0.75rem', marginTop: '0.5rem', color: '#475569' }}>
          {sources.map((s, idx) => {
            const colors = ['#1d4ed8', '#0284c7', '#059669', '#dc2626', '#d97706'];
            return (
              <div key={s.source_id} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '12px', height: '3px', backgroundColor: colors[idx % colors.length], display: 'inline-block' }}></span>
                <span>{s.source_name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal 1: Create Water Source */}
      {createModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ maxWidth: '440px', width: '90%' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Register Water Source</h3>
            <form onSubmit={handleCreateSource}>
              <div className="form-group">
                <label className="form-label">Source Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Noyyal Feeder Well #5"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Source Type</label>
                <select
                  className="form-select"
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                >
                  <option value="BOREWELL">Borewell</option>
                  <option value="OPEN_WELL">Open Well</option>
                  <option value="RESERVOIR">Reservoir</option>
                  <option value="OVERHEAD_TANK">Overhead Tank</option>
                  <option value="LAKE">Lake / Pond</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Location / Landmark</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Vadavalli Water Works"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Capacity (Litres)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Initial Level (Litres)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={currentLevel}
                    onChange={(e) => setCurrentLevel(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setCreateModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Water Source</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Water Reading */}
      {readingModalOpen && selectedSource && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ maxWidth: '440px', width: '90%' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Log Telemetry Reading for {selectedSource.source_name}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
              Capacity: {selectedSource.capacity_litres.toLocaleString()} L. Automatic depletion evaluation checks if reading is &lt;80% (Warning) or &lt;60% (Critical).
            </p>
            <form onSubmit={handleAddReading}>
              <div className="form-group">
                <label className="form-label">Measured Current Level (Litres)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Enter current litres"
                  value={newReadingLitres}
                  onChange={(e) => setNewReadingLitres(e.target.value)}
                  max={selectedSource.capacity_litres}
                  min={0}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setReadingModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Reading</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
