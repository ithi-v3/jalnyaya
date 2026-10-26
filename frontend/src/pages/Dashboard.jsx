// JalNyaya - Role-Based Dashboard (Admin, Operator, Resident)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import {
  Droplet,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Home,
  MapPin,
  RefreshCw,
  TrendingDown,
  ShieldAlert,
  ArrowUpRight,
  Send,
  XCircle,
  FileText
} from 'lucide-react';

export default function Dashboard() {
  const { user, isAdmin, isOperator, isResident } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fairnessList, setFairnessList] = useState([]);
  const [waterTrends, setWaterTrends] = useState([]);
  const [procMessage, setProcMessage] = useState('');

  // Modals for actions
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [completeQty, setCompleteQty] = useState('');
  const [completeNotes, setCompleteNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Resident Confirmation Modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState(true);
  const [confirmRemarks, setConfirmRemarks] = useState('');

  // Resident Lodge Complaint Modal
  const [complaintModalOpen, setComplaintModalOpen] = useState(false);
  const [complaintType, setComplaintType] = useState('MISSED_DELIVERY');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintPriority, setComplaintPriority] = useState('HIGH');

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      if (isAdmin) {
        const [dashRes, fairRes, trendsRes] = await Promise.all([
          api.getAdminDashboard(),
          api.getStreetFairness(),
          api.getWaterTrends()
        ]);
        setData(dashRes);
        setFairnessList(fairRes.fairness || []);
        setWaterTrends(trendsRes.trends || []);
      } else if (isOperator) {
        const dashRes = await api.getOperatorDashboard();
        setData(dashRes);
      } else if (isResident) {
        const dashRes = await api.getResidentDashboard();
        setData(dashRes);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user]);

  // Recalculate Stored Procedure Handler
  const handleRecalculateFairness = async () => {
    setProcMessage('Executing calculate_street_fairness() stored procedure...');
    try {
      const res = await api.recalculateFairness();
      setProcMessage('✔ Stored procedure executed: street priority scores and equity refreshed in database.');
      fetchDashboard();
      setTimeout(() => setProcMessage(''), 5000);
    } catch (err) {
      setProcMessage(`❌ Stored procedure execution error: ${err.message}`);
    }
  };

  // Complete Delivery Transaction Handler
  const handleCompleteTransaction = async (e) => {
    e.preventDefault();
    if (!selectedDelivery) return;
    setActionLoading(true);
    try {
      await api.completeDeliveryTransaction(selectedDelivery.delivery_id, {
        quantity_litres: completeQty || selectedDelivery.quantity_litres,
        notes: completeNotes
      });
      setCompleteModalOpen(false);
      setSelectedDelivery(null);
      fetchDashboard();
    } catch (err) {
      alert(err.message || 'Transaction failed and was rolled back.');
    } finally {
      setActionLoading(false);
    }
  };

  // Resident Confirmation / Dispute Handler
  const handleResidentConfirmation = async (e) => {
    e.preventDefault();
    if (!selectedDelivery) return;
    setActionLoading(true);
    try {
      await api.submitDeliveryConfirmation(selectedDelivery.delivery_id, {
        confirmed: confirmStatus,
        remarks: confirmRemarks
      });
      setConfirmModalOpen(false);
      setSelectedDelivery(null);
      fetchDashboard();
    } catch (err) {
      alert(err.message || 'Failed to submit confirmation.');
    } finally {
      setActionLoading(false);
    }
  };

  // Resident Lodge Complaint Handler
  const handleLodgeComplaint = async (e) => {
    e.preventDefault();
    if (!user?.street_id) {
      alert('Your resident account has no assigned street.');
      return;
    }
    setActionLoading(true);
    try {
      await api.createComplaint({
        street_id: user.street_id,
        complaint_type: complaintType,
        description: complaintDesc,
        priority: complaintPriority
      });
      setComplaintModalOpen(false);
      setComplaintDesc('');
      fetchDashboard();
    } catch (err) {
      alert(err.message || 'Failed to lodge complaint.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading operational dashboard...</div>;
  }

  if (error) {
    return <div className="alert-banner alert-danger">{error}</div>;
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' }}>
            {isAdmin && 'Panchayat Administrative Dashboard'}
            {isOperator && 'Tanker Operator Control Panel'}
            {isResident && 'Resident Water Rights & Status Portal'}
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
            {user?.name} • Role: <strong>{user?.role}</strong> {user?.street && `• ${user.street.street_name}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isAdmin && (
            <button onClick={handleRecalculateFairness} className="btn btn-secondary btn-sm" title="Executes MySQL stored procedure">
              <RefreshCw size={14} /> Run Fairness Stored Procedure
            </button>
          )}
          {isResident && (
            <button onClick={() => setComplaintModalOpen(true)} className="btn btn-primary btn-sm">
              <AlertTriangle size={14} /> Lodge Water Grievance
            </button>
          )}
        </div>
      </div>

      {procMessage && (
        <div className="alert-banner alert-success" style={{ marginBottom: '1rem' }}>
          {procMessage}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. ADMIN DASHBOARD */}
      {/* ========================================================================= */}
      {isAdmin && data && (
        <>
          {/* Key Metric Stats Grid */}
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-label">Total Streets</div>
              <div className="stat-value">{data.overview?.totalStreets}</div>
              <div className="stat-desc">Across all wards</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Total Households</div>
              <div className="stat-value">{data.overview?.totalHouseholds}</div>
              <div className="stat-desc">Registered consumers</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Deliveries This Month</div>
              <div className="stat-value">{data.overview?.deliveriesThisMonth}</div>
              <div className="stat-desc">Completed tanker trips</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Open Complaints</div>
              <div className="stat-value" style={{ color: data.overview?.openComplaints > 0 ? '#b91c1c' : '#1e293b' }}>
                {data.overview?.openComplaints}
              </div>
              <div className="stat-desc">Under 48h SLA</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Active Tankers</div>
              <div className="stat-value">{data.overview?.activeTankers}</div>
              <div className="stat-desc">Operational in fleet</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Critical Water Sources</div>
              <div className="stat-value" style={{ color: '#b91c1c' }}>
                {data.overview?.criticalWaterSources}
              </div>
              <div className="stat-desc">&lt;25% depleted</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
            {/* Street Fairness View (Novelty Requirement 14) */}
            <div className="card" style={{ margin: 0 }}>
              <div className="card-header">
                <div>
                  <h2 className="card-title">Street Fairness & Equity Ranking</h2>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Queried from <code>street_fairness_view</code> using <code>RANK() OVER (ORDER BY litres_per_person ASC)</code>
                  </div>
                </div>
              </div>
              <div className="table-responsive" style={{ maxHeight: '380px' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Street</th>
                      <th>Pop.</th>
                      <th>Trips</th>
                      <th>Litres/Person</th>
                      <th>Fairness %</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fairnessList.slice(0, 8).map((f) => (
                      <tr key={f.street_id}>
                        <td style={{ fontWeight: 700 }}>#{f.fairness_rank}</td>
                        <td style={{ fontWeight: 600 }}>{f.street_name}</td>
                        <td>{f.population}</td>
                        <td>{f.deliveries_count || 0}</td>
                        <td style={{ fontWeight: 600 }}>{f.litres_per_person || '0.00'} L</td>
                        <td>{f.fairness_percentage || 0}%</td>
                        <td>
                          <span className={`badge ${
                            f.fairness_status === 'GOOD' ? 'badge-good' :
                            f.fairness_status === 'BELOW AVERAGE' ? 'badge-below' : 'badge-critical'
                          }`}>
                            {f.fairness_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Alerts (Anti-Fraud & Water Depletion) */}
            <div className="card" style={{ margin: 0 }}>
              <div className="card-header">
                <h2 className="card-title">Critical System Alerts</h2>
                <span className="badge badge-danger">{data.recentAlerts?.length || 0} active</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {data.recentAlerts?.map((a) => (
                  <div key={a.alert_id} style={{
                    padding: '0.75rem',
                    borderRadius: '4px',
                    border: '1px solid #fecaca',
                    backgroundColor: '#fff1f2',
                    fontSize: '0.8rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#991b1b', marginBottom: '0.2rem' }}>
                      <span>{a.alert_type}</span>
                      <span style={{ fontSize: '0.7rem' }}>{new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div style={{ color: '#334155' }}>{a.message}</div>
                  </div>
                ))}
                {(!data.recentAlerts || data.recentAlerts.length === 0) && (
                  <div style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
                    No active critical alerts.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Water Level Trend Chart (SVG from Database Readings) */}
          <div className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Water Source Depletion Trends (Database Monitored)</h2>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Real-time readings from <code>water_level_readings</code> table showing depletion thresholds (&lt;80% Warning, &lt;60% Critical)
                </div>
              </div>
            </div>
            <div style={{ height: '180px', width: '100%', padding: '0.5rem 0' }}>
              <svg viewBox="0 0 800 160" style={{ width: '100%', height: '100%' }}>
                {/* Reference Lines */}
                <line x1="40" y1="32" x2="780" y2="32" stroke="#e2e8f0" strokeDasharray="4" />
                <text x="45" y="28" fontSize="10" fill="#94a3b8">80% Low Threshold</text>
                
                <line x1="40" y1="64" x2="780" y2="64" stroke="#fecaca" strokeDasharray="4" />
                <text x="45" y="60" fontSize="10" fill="#ef4444">60% Critical Depletion Threshold</text>

                <line x1="40" y1="140" x2="780" y2="140" stroke="#cbd5e1" />

                {/* Draw Perur Well Line (Declining) */}
                {waterTrends.length > 0 && (
                  <polyline
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="2.5"
                    points={waterTrends
                      .filter(t => t.source_name.includes('Perur'))
                      .slice(0, 16)
                      .map((t, idx) => `${60 + idx * 45},${140 - (t.percentage * 1.2)}`)
                      .join(' ')}
                  />
                )}

                {/* Draw Siruvani Reservoir Line (Stable) */}
                {waterTrends.length > 0 && (
                  <polyline
                    fill="none"
                    stroke="#1d4ed8"
                    strokeWidth="2"
                    points={waterTrends
                      .filter(t => t.source_name.includes('Siruvani'))
                      .slice(0, 16)
                      .map((t, idx) => `${60 + idx * 45},${140 - (t.percentage * 1.2)}`)
                      .join(' ')}
                  />
                )}
              </svg>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', fontSize: '0.75rem', color: '#475569' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '12px', height: '3px', backgroundColor: '#dc2626', display: 'inline-block' }}></span>
                <span>Perur Heritage Open Well (Critically Depleting)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '12px', height: '3px', backgroundColor: '#1d4ed8', display: 'inline-block' }}></span>
                <span>Siruvani Reservoir Intake (Stable)</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 2. OPERATOR DASHBOARD */}
      {/* ========================================================================= */}
      {isOperator && data && (
        <>
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-label">Total Assigned Deliveries</div>
              <div className="stat-value">{data.overview?.totalAssigned}</div>
              <div className="stat-desc">Assigned to your driver profile</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Today's Schedule</div>
              <div className="stat-value">{data.overview?.todayCount}</div>
              <div className="stat-desc">Scheduled tanker dispatches</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Disputed Deliveries</div>
              <div className="stat-value" style={{ color: data.overview?.disputedCount > 0 ? '#b91c1c' : '#1e293b' }}>
                {data.overview?.disputedCount}
              </div>
              <div className="stat-desc">Resident fraud flags</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Assigned Complaints</div>
              <div className="stat-value">{data.overview?.openComplaintsCount}</div>
              <div className="stat-desc">Requiring site inspection</div>
            </div>
          </div>

          {/* Today's Deliveries Table */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Assigned Deliveries to Execute</h2>
              <span className="badge badge-info">ACID Transaction Execution</span>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Delivery ID</th>
                    <th>Street Name</th>
                    <th>Tanker</th>
                    <th>Volume</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.todayDeliveries?.map((d) => (
                    <tr key={d.delivery_id}>
                      <td style={{ fontWeight: 700 }}>#{d.delivery_id}</td>
                      <td style={{ fontWeight: 600 }}>{d.street.street_name}</td>
                      <td>{d.tanker.vehicle_number}</td>
                      <td>{d.quantity_litres?.toLocaleString()} L</td>
                      <td>
                        <span className={`badge ${d.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>
                          {d.status}
                        </span>
                      </td>
                      <td>
                        {d.status !== 'COMPLETED' ? (
                          <button
                            onClick={() => {
                              setSelectedDelivery(d);
                              setCompleteQty(d.quantity_litres);
                              setCompleteModalOpen(true);
                            }}
                            className="btn btn-success btn-sm"
                          >
                            <CheckCircle2 size={13} /> Complete (Transaction)
                          </button>
                        ) : (
                          <span style={{ color: 'var(--success)', fontSize: '0.75rem', fontWeight: 600 }}>
                            Delivered
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!data.todayDeliveries || data.todayDeliveries.length === 0) && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                        No deliveries scheduled for today. Check upcoming deliveries under Deliveries menu.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Disputed Deliveries Box */}
          {data.disputedDeliveries?.length > 0 && (
            <div className="card" style={{ borderColor: '#fca5a5', backgroundColor: '#fff5f5' }}>
              <div className="card-header" style={{ borderColor: '#fecaca' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991b1b' }}>
                  <ShieldAlert size={20} />
                  <h2 className="card-title" style={{ color: '#991b1b' }}>Disputed Tanker Deliveries (Resident Audit Flags)</h2>
                </div>
              </div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Delivery ID</th>
                      <th>Street</th>
                      <th>Date</th>
                      <th>Resident Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.disputedDeliveries.map((dis) => (
                      <tr key={dis.delivery_id}>
                        <td style={{ fontWeight: 700 }}>#{dis.delivery_id}</td>
                        <td>{dis.street.street_name}</td>
                        <td>{new Date(dis.scheduled_date).toLocaleDateString()}</td>
                        <td style={{ color: '#b91c1c', fontWeight: 500 }}>
                          {dis.confirmations?.[0]?.remarks || 'Resident reported water not delivered'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* 3. RESIDENT DASHBOARD */}
      {/* ========================================================================= */}
      {isResident && data && (
        <>
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-label">My Street</div>
              <div className="stat-value" style={{ fontSize: '1.25rem' }}>
                {data.myStreet?.street_name || 'Unassigned'}
              </div>
              <div className="stat-desc">{data.myStreet?.area_name} • {data.myStreet?.panchayat_name}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Street Equity Status</div>
              <div className="stat-value" style={{ fontSize: '1.25rem' }}>
                <span className={`badge ${
                  data.streetFairness?.fairness_status === 'GOOD' ? 'badge-good' :
                  data.streetFairness?.fairness_status === 'BELOW AVERAGE' ? 'badge-below' : 'badge-critical'
                }`} style={{ fontSize: '0.85rem' }}>
                  {data.streetFairness?.fairness_status || 'CRITICAL'}
                </span>
              </div>
              <div className="stat-desc">{data.streetFairness?.litres_per_person || '0'} L / person received</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Last Water Delivery</div>
              <div className="stat-value" style={{ fontSize: '1.25rem' }}>
                {data.lastDelivery ? new Date(data.lastDelivery.delivery_date || data.lastDelivery.scheduled_date).toLocaleDateString() : 'No Deliveries'}
              </div>
              <div className="stat-desc">
                {data.lastDelivery ? `${data.lastDelivery.quantity_litres} L via ${data.lastDelivery.tanker.vehicle_number}` : 'Awaiting initial tanker'}
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Upcoming Scheduled Delivery</div>
              <div className="stat-value" style={{ fontSize: '1.25rem' }}>
                {data.upcomingDelivery ? new Date(data.upcomingDelivery.scheduled_date).toLocaleDateString() : 'None Scheduled'}
              </div>
              <div className="stat-desc">
                {data.upcomingDelivery ? `Tanker: ${data.upcomingDelivery.tanker.vehicle_number}` : 'Check with Panchayat'}
              </div>
            </div>
          </div>

          {/* Delivery Verification Action (Anti-Fraud Requirement 23) */}
          {data.lastDelivery && (
            <div className="card" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
              <div className="card-header" style={{ borderColor: '#dcfce7' }}>
                <div>
                  <h3 className="card-title" style={{ color: '#166534' }}>Resident Delivery Verification & Anti-Fraud</h3>
                  <p style={{ fontSize: '0.8rem', color: '#15803d' }}>
                    Verify if Delivery #{data.lastDelivery.delivery_id} on {new Date(data.lastDelivery.scheduled_date).toLocaleDateString()} was received.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedDelivery(data.lastDelivery);
                    setConfirmModalOpen(true);
                  }}
                  className="btn btn-primary btn-sm"
                >
                  Confirm or Flag Dispute
                </button>
              </div>
            </div>
          )}

          {/* My Complaints History */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">My Registered Complaints & 48h SLA Status</h2>
              <button onClick={() => setComplaintModalOpen(true)} className="btn btn-primary btn-sm">
                + New Complaint
              </button>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Date Filed</th>
                    <th>Priority</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.myComplaints?.map((c) => (
                    <tr key={c.complaint_id}>
                      <td style={{ fontWeight: 700 }}>#{c.complaint_id}</td>
                      <td>{c.complaint_type}</td>
                      <td>{c.description}</td>
                      <td>{new Date(c.created_at).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${c.priority === 'URGENT' ? 'badge-danger' : 'badge-warning'}`}>
                          {c.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${c.status === 'RESOLVED' ? 'badge-success' : 'badge-info'}`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!data.myComplaints || data.myComplaints.length === 0) && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                        No grievances filed. Click "+ New Complaint" if your street suffers water shortage.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: Complete Delivery Transaction Modal */}
      {/* ========================================================================= */}
      {completeModalOpen && selectedDelivery && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ maxWidth: '440px', width: '90%' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Execute Delivery Completion Transaction
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
              This executes an ACID database transaction updating delivery status, recording delivered litres, and updating street delivery timestamp.
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
                <label className="form-label">Delivery Notes / Valve Point</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="e.g. Completed supply at North tap junction."
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setCompleteModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-success" disabled={actionLoading}>
                  {actionLoading ? 'Committing...' : 'Commit Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Resident Confirm / Dispute Modal */}
      {/* ========================================================================= */}
      {confirmModalOpen && selectedDelivery && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ maxWidth: '450px', width: '90%' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Resident Delivery Verification
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
              Anti-Fraud mechanism: Flagging "NOT RECEIVED" immediately triggers a database status update to DISPUTED and creates a fraud alert.
            </p>
            <form onSubmit={handleResidentConfirmation}>
              <div className="form-group">
                <label className="form-label">Did your street receive this water tanker delivery?</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="confirmed"
                      checked={confirmStatus === true}
                      onChange={() => setConfirmStatus(true)}
                    />
                    <span>Yes, Confirmed Received</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: '#b91c1c' }}>
                    <input
                      type="radio"
                      name="confirmed"
                      checked={confirmStatus === false}
                      onChange={() => setConfirmStatus(false)}
                    />
                    <span>No, NOT RECEIVED (Dispute)</span>
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Remarks / Resident Notes</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder={confirmStatus ? 'Water quantity received in full.' : 'Specify what went wrong (e.g. driver skipped, bad quality)'}
                  value={confirmRemarks}
                  onChange={(e) => setConfirmRemarks(e.target.value)}
                  required={!confirmStatus}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setConfirmModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className={`btn ${confirmStatus ? 'btn-primary' : 'btn-danger'}`} disabled={actionLoading}>
                  {actionLoading ? 'Submitting...' : confirmStatus ? 'Confirm Delivery' : 'Submit Fraud Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Resident Lodge Complaint Modal */}
      {/* ========================================================================= */}
      {complaintModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ maxWidth: '450px', width: '90%' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Lodge Water Grievance (48h Target SLA)
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
              Every complaint is tracked under a strict 48-hour resolution SLA with automated breach alarms.
            </p>
            <form onSubmit={handleLodgeComplaint}>
              <div className="form-group">
                <label className="form-label">Grievance Category</label>
                <select
                  className="form-select"
                  value={complaintType}
                  onChange={(e) => setComplaintType(e.target.value)}
                >
                  <option value="MISSED_DELIVERY">Missed Tanker Delivery</option>
                  <option value="INSUFFICIENT_QUANTITY">Insufficient Water Volume</option>
                  <option value="WATER_QUALITY">Water Quality / Sediment Issue</option>
                  <option value="TIMING_ISSUE">Timing Disruption</option>
                  <option value="OPERATOR_BEHAVIOUR">Driver / Operator Conduct</option>
                  <option value="OTHER">Other Issue</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority Level</label>
                <select
                  className="form-select"
                  value={complaintPriority}
                  onChange={(e) => setComplaintPriority(e.target.value)}
                >
                  <option value="LOW">Low Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="URGENT">Urgent (Zero water in locality)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Detailed Description</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Describe the issue clearly..."
                  value={complaintDesc}
                  onChange={(e) => setComplaintDesc(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setComplaintModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Lodging...' : 'Submit Grievance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
