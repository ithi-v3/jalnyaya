// JalNyaya - Payments & Revenue Ledger Page (₹ INR)
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { CreditCard, Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Payments() {
  const { isAdmin } = useAuth();
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({ totalPaidAmount: 0, averageAmount: 0, paidCount: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [methodFilter, setMethodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [deliveryId, setDeliveryId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('PANCHAYAT_VOUCHER');
  const [deliveries, setDeliveries] = useState([]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await api.getPayments({ page, limit: 10, method: methodFilter, status: statusFilter });
      setPayments(res.payments || []);
      setSummary(res.summary || { totalPaidAmount: 0, averageAmount: 0, paidCount: 0 });
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadDeliveries = async () => {
    try {
      const res = await api.getDeliveries({ status: 'COMPLETED', limit: 50 });
      setDeliveries(res.deliveries || []);
      if (res.deliveries?.length > 0) {
        setDeliveryId(res.deliveries[0].delivery_id);
        setAmount((res.deliveries[0].quantity_litres / 1000) * 85);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDeliveries();
  }, []);

  useEffect(() => {
    loadPayments();
  }, [page, methodFilter, statusFilter]);

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    try {
      await api.createPayment({
        delivery_id: parseInt(deliveryId),
        amount: parseFloat(amount),
        payment_method: method,
        payment_status: 'PAID'
      });
      setModalOpen(false);
      loadPayments();
    } catch (err) {
      alert(err.message || 'Payment recording failed');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' }}>
            Payments & Distribution Revenue Ledger (₹ INR)
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
            Audited financial settlement records for tanker deliveries and panchayat fuel vouchers
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setModalOpen(true)} className="btn btn-primary btn-sm">
            <Plus size={15} /> Record Payment
          </button>
        )}
      </div>

      {/* Aggregate Stats */}
      <div className="stats-grid">
        <div className="stat-box">
          <div className="stat-label">Total Revenue Settled</div>
          <div className="stat-value">₹{Number(summary.totalPaidAmount).toLocaleString()}</div>
          <div className="stat-desc">{summary.paidCount} paid transactions</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Average Transaction</div>
          <div className="stat-value">₹{Math.round(summary.averageAmount).toLocaleString()}</div>
          <div className="stat-desc">Per tanker distribution trip</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Standard Tariff</div>
          <div className="stat-value">₹85.00</div>
          <div className="stat-desc">Subsidized per 1,000 Litres</div>
        </div>
      </div>

      <div className="card">
        {/* Filters */}
        <div className="toolbar">
          <div className="toolbar-group">
            <select
              className="form-select"
              style={{ width: '190px' }}
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Payment Methods</option>
              <option value="PANCHAYAT_VOUCHER">Panchayat Voucher</option>
              <option value="UPI">UPI Digital Payment</option>
              <option value="BANK_TRANSFER">Bank Direct Transfer</option>
              <option value="CASH">Cash Collection</option>
            </select>

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
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Total Transactions: <strong>{total}</strong>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Receipt ID</th>
                <th>Reference Number</th>
                <th>Delivery Linked</th>
                <th>Street Location</th>
                <th>Payment Method</th>
                <th>Amount (₹)</th>
                <th>Date Settled</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.payment_id}>
                  <td style={{ fontWeight: 700 }}>#{p.payment_id}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.reference_number || 'N/A'}</td>
                  <td>Delivery #{p.delivery_id}</td>
                  <td>{p.delivery?.street?.street_name || 'N/A'}</td>
                  <td>{p.payment_method}</td>
                  <td style={{ fontWeight: 700, color: '#1e40af' }}>₹{Number(p.amount).toFixed(2)}</td>
                  <td>{new Date(p.payment_date).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${
                      p.payment_status === 'PAID' ? 'badge-good' :
                      p.payment_status === 'PENDING' ? 'badge-below' : 'badge-danger'
                    }`}>
                      {p.payment_status}
                    </span>
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
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Record Distribution Payment</h3>
            <form onSubmit={handleCreatePayment}>
              <div className="form-group">
                <label className="form-label">Linked Delivery</label>
                <select
                  className="form-select"
                  value={deliveryId}
                  onChange={(e) => {
                    setDeliveryId(e.target.value);
                    const del = deliveries.find(d => d.delivery_id === parseInt(e.target.value));
                    if (del) {
                      setAmount((del.quantity_litres / 1000) * 85);
                    }
                  }}
                  required
                >
                  {deliveries.map((d) => (
                    <option key={d.delivery_id} value={d.delivery_id}>
                      Delivery #{d.delivery_id} - {d.street?.street_name} ({d.quantity_litres} L)
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Amount (₹ INR)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select
                  className="form-select"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  <option value="PANCHAYAT_VOUCHER">Panchayat Voucher</option>
                  <option value="UPI">UPI Digital Payment</option>
                  <option value="BANK_TRANSFER">Bank Direct Transfer</option>
                  <option value="CASH">Cash Collection</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Receipt</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
