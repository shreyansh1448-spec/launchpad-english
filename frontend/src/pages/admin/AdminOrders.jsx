import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api.js';
import OrderFilters, { PAYMENT_STATUS, downloadCsv } from '../../admin/OrderFilters.jsx';
import { MODE_META, batchLabel, courseModes, formatPrice } from '../../../shared/course.js';

function studentId(order) {
  return `LPE-${order._id.slice(-6).toUpperCase()}`;
}

function when(iso) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const EMPTY_FORM = { name: '', phone: '', email: '', address: '', courseSlug: '', mode: 'online', batchId: '', amount: '', notes: '' };

export default function AdminOrders() {
  const [params] = useSearchParams();
  const [filters, setFilters] = useState({ status: params.get('status') || '' });
  const [orders, setOrders] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notesDraft, setNotesDraft] = useState({});
  const [savingId, setSavingId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.admin.listCourses().then(setCourses).catch(() => setCourses([]));
    api.admin.listBatches().then(setBatches).catch(() => setBatches([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    api.admin
      .listOrders(filters)
      .then((data) => {
        setOrders(data);
        setNotesDraft(Object.fromEntries(data.map((o) => [o._id, o.notes || ''])));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters]);

  const onFilters = useCallback((f) => setFilters(f), []);

  async function saveNotes(id) {
    setSavingId(id);
    setError('');
    try {
      const updated = await api.admin.updateOrderNotes(id, notesDraft[id] || '');
      setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  }

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value, ...(key === 'courseSlug' || key === 'mode' ? { batchId: '' } : {}) }));
  }

  const selectedCourse = courses.find((c) => c.slug === form.courseSlug);
  const suggestedPrice = selectedCourse ? selectedCourse.pricing[form.mode]?.offer : null;
  const batchChoices = batches.filter((b) => b.mode === form.mode && (!b.courseId || b.courseId === selectedCourse?._id) && b.status !== 'closed');

  async function handleAddManualOrder(e) {
    e.preventDefault();
    setFormError('');
    if (!form.name || !form.phone || !form.email || !form.courseSlug || !form.mode) {
      setFormError('Name, phone, email, course and mode are required.');
      return;
    }
    setSaving(true);
    try {
      const created = await api.admin.createManualOrder({
        ...form,
        batchId: form.batchId || undefined,
        amount: form.amount === '' ? undefined : Number(form.amount),
      });
      setOrders((prev) => [created, ...prev]);
      setNotesDraft((prev) => ({ ...prev, [created._id]: created.notes || '' }));
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function exportCsv() {
    downloadCsv('orders.csv', [
      ['Order ID', 'Razorpay Order ID', 'Date', 'Student', 'Phone', 'Email', 'Course', 'Mode', 'Batch', 'Amount (INR)', 'Razorpay Payment ID', 'Method', 'Status', 'Notes'],
      ...orders.map((o) => [
        studentId(o),
        o.razorpayOrderId,
        when(o.createdAt),
        o.name,
        o.phone,
        o.email,
        o.courseTitle,
        MODE_META[o.mode]?.label,
        o.batchLabel,
        o.amount / 100,
        o.razorpayPaymentId,
        o.paymentMethod,
        PAYMENT_STATUS[o.status]?.[1],
        o.notes,
      ]),
    ]);
  }

  return (
    <div className="cms-page">
      <div className="cms-page-head">
        <div>
          <h1>Orders</h1>
          <p className="muted">All payments - Razorpay and cash/offline - newest first.</p>
        </div>
        <div className="cms-page-actions">
          <button type="button" className="btn btn-sm btn-outline" onClick={exportCsv} disabled={!orders.length}>
            <i className="fas fa-download" /> Export CSV
          </button>
          <button type="button" className="btn btn-sm" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Cancel' : <><i className="fas fa-plus" /> Add Cash Payment</>}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="admin-panel">
          <h2>Record a Cash / Offline Payment</h2>
          <p className="muted">Use this when a student pays outside Razorpay, so their admission shows up here and unlocks review-writing.</p>
          {formError && <div className="form-alert error">{formError}</div>}
          <form onSubmit={handleAddManualOrder}>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name</label>
                <input className="form-control" value={form.name} onChange={(e) => setField('name', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input className="form-control" value={form.phone} onChange={(e) => setField('phone', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input className="form-control" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Address (optional)</label>
                <input className="form-control" value={form.address} onChange={(e) => setField('address', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Course</label>
                <select className="form-control" value={form.courseSlug} onChange={(e) => setField('courseSlug', e.target.value)} required>
                  <option value="">Select a course…</option>
                  {courses.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Mode</label>
                <select className="form-control" value={form.mode} onChange={(e) => setField('mode', e.target.value)}>
                  {(selectedCourse ? courseModes(selectedCourse) : ['online', 'offline']).map((m) => (
                    <option key={m} value={m}>
                      {MODE_META[m].label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Batch (optional)</label>
                <select className="form-control" value={form.batchId} onChange={(e) => setField('batchId', e.target.value)}>
                  <option value="">No batch yet</option>
                  {batchChoices.map((b) => (
                    <option key={b._id} value={b._id}>
                      {batchLabel(b)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Amount Paid (₹)</label>
                <input
                  className="form-control"
                  type="number"
                  min="0"
                  placeholder={suggestedPrice ? `Course price: ${formatPrice(suggestedPrice)}` : 'Defaults to course price'}
                  value={form.amount}
                  onChange={(e) => setField('amount', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Notes (optional)</label>
                <input className="form-control" value={form.notes} onChange={(e) => setField('notes', e.target.value)} placeholder="e.g. paid at front desk" />
              </div>
            </div>
            <button className="btn btn-sm" disabled={saving}>
              {saving ? <span className="spinner" /> : 'Save Cash Payment'}
            </button>
          </form>
        </div>
      )}

      <OrderFilters filters={filters} onChange={onFilters} courses={courses} />
      {error && <div className="form-alert error">{error}</div>}

      {loading ? (
        <p className="muted">Loading orders…</p>
      ) : orders.length === 0 ? (
        <div className="empty-panel">
          <p>No orders found.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <p className="muted table-count">
            {orders.length} order{orders.length === 1 ? '' : 's'} · {formatPrice(orders.filter((o) => o.status === 'paid').reduce((n, o) => n + o.amount / 100, 0))} paid
          </p>
          <table className="admin-table admin-table-cards">
            <thead>
              <tr>
                <th>Order</th>
                <th>Student</th>
                <th>Course</th>
                <th>Mode</th>
                <th>Batch</th>
                <th>Amount</th>
                <th>Razorpay Payment ID</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td data-label="Order">
                    <strong>{studentId(o)}</strong>
                    <span className="muted cell-sub">{when(o.createdAt)}</span>
                    {o.razorpayOrderId && <span className="muted cell-sub mono">{o.razorpayOrderId}</span>}
                  </td>
                  <td data-label="Student">
                    <strong>{o.name}</strong>
                    <span className="muted cell-sub">{o.phone}</span>
                    <span className="muted cell-sub">{o.email}</span>
                  </td>
                  <td data-label="Course">{o.courseTitle}</td>
                  <td data-label="Mode">
                    <span className={`mode-pill mode-pill-${o.mode}`}>{MODE_META[o.mode]?.label}</span>
                  </td>
                  <td data-label="Batch">{o.batchLabel || '—'}</td>
                  <td data-label="Amount">{formatPrice(o.amount / 100)}</td>
                  <td data-label="Payment ID" className="mono">
                    {o.paymentMethod === 'cash' ? <span className="badge-muted">Cash</span> : o.razorpayPaymentId || '—'}
                  </td>
                  <td data-label="Status">
                    <span className={PAYMENT_STATUS[o.status]?.[0]}>{PAYMENT_STATUS[o.status]?.[1]}</span>
                  </td>
                  <td data-label="Notes">
                    <div className="notes-cell">
                      <input
                        className="form-control form-control-sm"
                        value={notesDraft[o._id] ?? ''}
                        onChange={(e) => setNotesDraft({ ...notesDraft, [o._id]: e.target.value })}
                        aria-label="Order notes"
                      />
                      <button type="button" className="btn btn-xs" disabled={savingId === o._id || (notesDraft[o._id] ?? '') === (o.notes || '')} onClick={() => saveNotes(o._id)}>
                        {savingId === o._id ? <span className="spinner" /> : 'Save'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
