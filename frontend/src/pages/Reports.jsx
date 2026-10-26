// JalNyaya - DBMS Analytical Reports Page (Demonstrating Joins, Window Functions & Aggregates)
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  FileBarChart,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  Truck,
  Droplet,
  Users
} from 'lucide-react';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('fewest');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReport = async (tab) => {
    setLoading(true);
    try {
      if (tab === 'fewest') {
        const res = await api.getFewestDeliveries();
        setData(res.fewest_deliveries || []);
      } else if (tab === 'fairness') {
        const res = await api.getStreetFairness();
        setData(res.fairness || []);
      } else if (tab === 'priority') {
        const res = await api.getPrioritySchedule();
        setData(res.priority_schedule || []);
      } else if (tab === 'disputes') {
        const res = await api.getOperatorDisputes();
        setData(res.operator_disputes || []);
      } else if (tab === 'sla') {
        const res = await api.getSlaReport();
        setData(res.sla_report || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(activeTab);
  }, [activeTab]);

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' }}>
          DBMS Analytical Reports & Assessment Evidence
        </h1>
        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
          Real SQL executions demonstrating LEFT OUTER JOINS, Window Functions (RANK, DENSE_RANK), Multi-table joins, and Group Aggregations
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('fewest')}
          className={`btn btn-sm ${activeTab === 'fewest' ? 'btn-primary' : 'btn-secondary'}`}
        >
          1. Fewest Deliveries (LEFT JOIN)
        </button>
        <button
          onClick={() => setActiveTab('fairness')}
          className={`btn btn-sm ${activeTab === 'fairness' ? 'btn-primary' : 'btn-secondary'}`}
        >
          2. Street Fairness (RANK() OVER)
        </button>
        <button
          onClick={() => setActiveTab('priority')}
          className={`btn btn-sm ${activeTab === 'priority' ? 'btn-primary' : 'btn-secondary'}`}
        >
          3. Dynamic Priority Ranking
        </button>
        <button
          onClick={() => setActiveTab('disputes')}
          className={`btn btn-sm ${activeTab === 'disputes' ? 'btn-primary' : 'btn-secondary'}`}
        >
          4. Operator Dispute Rate
        </button>
        <button
          onClick={() => setActiveTab('sla')}
          className={`btn btn-sm ${activeTab === 'sla' ? 'btn-primary' : 'btn-secondary'}`}
        >
          5. 48h SLA Breaches (5-Table JOIN)
        </button>
      </div>

      <div className="card">
        {/* Tab 1: Fewest Deliveries */}
        {activeTab === 'fewest' && (
          <div>
            <div className="card-header">
              <div>
                <h2 className="card-title">Report 1: Streets with Fewest Deliveries</h2>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  <strong>DBMS Concept:</strong> Outer Join Preservation — <code>LEFT OUTER JOIN deliveries d ON s.street_id = d.street_id</code> ensures streets with exactly 0 deliveries (e.g. Rajaji Avenue) are preserved rather than excluded.
                </div>
              </div>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Street Name</th>
                    <th>Area & Panchayat</th>
                    <th>Population</th>
                    <th>Households</th>
                    <th>Total Deliveries</th>
                    <th>Total Litres Distributed</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr key={row.street_id}>
                      <td style={{ fontWeight: 600 }}>{row.street_name}</td>
                      <td>{row.area_name} ({row.panchayat_name})</td>
                      <td>{row.population?.toLocaleString()}</td>
                      <td>{row.household_count}</td>
                      <td style={{ fontWeight: 700, color: Number(row.total_deliveries) === 0 ? '#dc2626' : '#1e293b' }}>
                        {row.total_deliveries}
                      </td>
                      <td>{Number(row.total_litres_delivered || 0).toLocaleString()} L</td>
                      <td>
                        {Number(row.total_deliveries) === 0 ? (
                          <span className="badge badge-danger">CRITICAL: 0 Deliveries</span>
                        ) : (
                          <span className="badge badge-good">Serviced</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Street Fairness Ranking */}
        {activeTab === 'fairness' && (
          <div>
            <div className="card-header">
              <div>
                <h2 className="card-title">Report 2: Street Fairness & Equity Ranking</h2>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  <strong>DBMS Concept:</strong> Analytical Window Function — <code>RANK() OVER (ORDER BY litres_per_person ASC)</code> with Common Table Expression (CTE) benchmarking.
                </div>
              </div>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Equity Rank</th>
                    <th>Street Name</th>
                    <th>Population</th>
                    <th>Deliveries</th>
                    <th>Total Litres</th>
                    <th>Litres / Person</th>
                    <th>Benchmark Avg</th>
                    <th>Fairness Ratio</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr key={row.street_id}>
                      <td style={{ fontWeight: 700 }}>#{row.fairness_rank}</td>
                      <td style={{ fontWeight: 600 }}>{row.street_name}</td>
                      <td>{row.population}</td>
                      <td>{row.deliveries_count || 0}</td>
                      <td>{Number(row.total_litres_received || 0).toLocaleString()} L</td>
                      <td style={{ fontWeight: 600 }}>{row.litres_per_person} L</td>
                      <td>{row.overall_average_litres_per_person} L</td>
                      <td style={{ fontWeight: 600 }}>{row.fairness_percentage}%</td>
                      <td>
                        <span className={`badge ${
                          row.fairness_status === 'GOOD' ? 'badge-good' :
                          row.fairness_status === 'BELOW AVERAGE' ? 'badge-below' : 'badge-critical'
                        }`}>
                          {row.fairness_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Dynamic Priority Ranking */}
        {activeTab === 'priority' && (
          <div>
            <div className="card-header">
              <div>
                <h2 className="card-title">Report 3: Dynamic Delivery Prioritization Ranking</h2>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  <strong>DBMS Concept:</strong> Mathematical scoring algorithm evaluating days waiting, household load, open complaints, and equity deficit using <code>DENSE_RANK() OVER (...)</code>.
                </div>
              </div>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Dispatch Rank</th>
                    <th>Street Name</th>
                    <th>Days Without Water</th>
                    <th>Households</th>
                    <th>Open Complaints</th>
                    <th>Litres/Person</th>
                    <th>Equity Status</th>
                    <th>Calculated Priority Score</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr key={row.street_id}>
                      <td style={{ fontWeight: 700 }}>#{row.priority_rank || row.dispatch_priority_rank}</td>
                      <td style={{ fontWeight: 600 }}>{row.street_name}</td>
                      <td style={{ color: Number(row.days_waiting || row.days_without_water) > 5 ? '#dc2626' : '#1e293b', fontWeight: 600 }}>
                        {row.days_waiting || row.days_without_water} days
                      </td>
                      <td>{row.household_count}</td>
                      <td>{row.open_complaints}</td>
                      <td>{row.litres_per_person || '0.00'} L</td>
                      <td>
                        <span className={`badge ${
                          row.fairness_status === 'GOOD' ? 'badge-good' :
                          row.fairness_status === 'BELOW AVERAGE' ? 'badge-below' : 'badge-critical'
                        }`}>
                          {row.fairness_status || 'CRITICAL'}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-info" style={{ fontSize: '0.85rem' }}>
                          {row.priority_score} pts
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Operator Disputes */}
        {activeTab === 'disputes' && (
          <div>
            <div className="card-header">
              <div>
                <h2 className="card-title">Report 4: Driver-Operator Dispute & Fraud Audit</h2>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  <strong>DBMS Concept:</strong> Conditional aggregation ratio — <code>(disputed_deliveries * 100.0) / total_deliveries</code> ranked with <code>DENSE_RANK()</code>.
                </div>
              </div>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Risk Rank</th>
                    <th>Operator Name</th>
                    <th>Phone</th>
                    <th>Total Deliveries</th>
                    <th>Completed</th>
                    <th>Disputed by Residents</th>
                    <th>Dispute Rate %</th>
                    <th>Audit Level</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr key={row.operator_id}>
                      <td style={{ fontWeight: 700 }}>#{row.dispute_rank}</td>
                      <td style={{ fontWeight: 600 }}>{row.operator_name}</td>
                      <td>{row.operator_phone}</td>
                      <td>{row.total_deliveries}</td>
                      <td>{row.completed_deliveries}</td>
                      <td style={{ color: Number(row.disputed_deliveries) > 0 ? '#dc2626' : '#1e293b', fontWeight: 700 }}>
                        {row.disputed_deliveries}
                      </td>
                      <td style={{ fontWeight: 700 }}>{row.dispute_rate_percentage || 0}%</td>
                      <td>
                        <span className={`badge ${
                          Number(row.dispute_rate_percentage) > 0 ? 'badge-danger' : 'badge-good'
                        }`}>
                          {Number(row.dispute_rate_percentage) > 0 ? 'FLAGGED FOR AUDIT' : 'EXCELLENT'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: SLA Breaches */}
        {activeTab === 'sla' && (
          <div>
            <div className="card-header">
              <div>
                <h2 className="card-title">Report 5: Grievances Exceeding 48-Hour SLA Benchmark</h2>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  <strong>DBMS Concept:</strong> 5-Table Join — <code>complaints c JOIN users res JOIN streets s LEFT JOIN users op LEFT JOIN deliveries d</code>.
                </div>
              </div>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Category</th>
                    <th>Resident</th>
                    <th>Street</th>
                    <th>Assigned Driver</th>
                    <th>Elapsed Hours</th>
                    <th>Target SLA Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr key={row.complaint_id}>
                      <td style={{ fontWeight: 700 }}>#{row.complaint_id}</td>
                      <td>{row.complaint_type}</td>
                      <td>{row.resident_name} ({row.resident_phone})</td>
                      <td>{row.street_name}</td>
                      <td>{row.assigned_operator_name || 'Unassigned'}</td>
                      <td style={{ fontWeight: 600, color: Number(row.elapsed_hours) > 48 ? '#dc2626' : '#1e293b' }}>
                        {row.elapsed_hours} hrs
                      </td>
                      <td>
                        <span className={`badge ${
                          row.sla_status === 'WITHIN SLA' || row.sla_status === 'RESOLVED WITHIN SLA' ? 'badge-good' :
                          row.sla_status === 'DUE SOON' ? 'badge-below' : 'badge-critical'
                        }`}>
                          {row.sla_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
