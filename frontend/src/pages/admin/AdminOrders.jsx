import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';

function studentId(order) {
  return `LPE-${order._id.slice(-6).toUpperCase()}`;
}

const EMPTY_FORM = {
  name: '',
  phone: '',
  email: '',
  address: '',
  courseSlug: '',
  mode: 'online',
  amount: '',
  notes: '',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [notesDraft, setNotesDraft] = useState({});
  const [savingId, setSavingId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  function load(q) {
    setLoading(true);
    api.admin
      .listOrders(q)
      .then((data) => {
        setOrders(data);
        setNotesDraft(Object.fromEntries(data.map((o) => [o._id, o.notes || ''])));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }
  useEffect(() => {
    load('');
    api.admin.listCourses().then(setCourses).catch(() => setCourses([]));
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    load(search);
  }

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
    setForm((f) => ({ ...f, [key]: value }));
  }

  const selectedCourse = courses.find((c) => c.slug === form.courseSlug);
  const suggestedPrice = selectedCourse ? selectedCourse.pricing[form.mode]?.offer : null;

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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2>Orders / Student Records</h2>
          <p className="muted" style={{ fontSize: 13.5 }}>
            All orders - online (Razorpay) or cash/offline - newest first. Doubles as the student admissions record.
          </p>
        </div>
        <button className="btn btn-sm" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : '+ Add Cash / Offline Order'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-24">
          <h3>Record a Cash / Offline Payment</h3>
          <p className="muted" style={{ fontSize: 13.5 }}>
            Use this when a student pays in cash (or any way outside Razorpay) so their registration still shows up
            here and unlocks review-writing for their course.
          </p>
          {formError && <div className="form-alert error">{formError}</div>}
          <form onSubmit={handleAddManualOrder}>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input className="form-control" value={form.name} onChange={(e) => setField('name', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input className="form-control" value={form.phone} onChange={(e) => setField('phone', e.target.value)} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <input
                  className="form-control"
                  type="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Address (optional)</label>
                <input className="form-control" value={form.address} onChange={(e) => setField('address', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
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
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Amount Paid (₹)</label>
                <input
                  className="form-control"
                  type="number"
                  min="0"
                  placeholder={suggestedPrice ? `Course price: ₹${suggestedPrice.toLocaleString('en-IN')}` : 'Defaults to course price'}
                  value={form.amount}
                  onChange={(e) => setField('amount', e.target.value)}
                />
                <p className="form-hint">Leave blank to use the course's current price for this mode.</p>
              </div>
              <div className="form-group">
                <label>Notes (optional)</label>
                <input className="form-control" value={form.notes} onChange={(e) => setField('notes', e.target.value)} placeholder="e.g. paid at front desk" />
              </div>
            </div>
            <button className="btn" disabled={saving}>
              {saving ? <span className="spinner" /> : 'Save Cash Order'}
            </button>
          </form>
        </div>
      )}

      <form onSubmit={handleSearch} className="form-row mb-24">
        <input
          className="form-control"
          placeholder="Search phone, email, name or course…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-sm">Search</button>
      </form>
      {error && <div className="form-alert error">{error}</div>}
      {loading ? (
        <p className="muted">Loading orders…</p>
      ) : orders.length === 0 ? (
        <p className="muted">No orders found.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Date</th>
              <th>Course</th>
              <th>Mode</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id}>
                <td className="muted">{studentId(o)}</td>
                <td className="muted">{new Date(o.createdAt).toLocaleString()}</td>
                <td>{o.courseTitle}</td>
                <td style={{ textTransform: 'capitalize' }}>{o.mode}</td>
                <td>{o.name}</td>
                <td>{o.phone}</td>
                <td>{o.email}</td>
                <td>₹{(o.amount / 100).toLocaleString('en-IN')}</td>
                <td>
                  <span className={o.paymentMethod === 'cash' ? 'badge-warning' : 'badge-success'}>
                    {o.paymentMethod === 'cash' ? 'Cash' : 'Razorpay'}
                  </span>
                </td>
                <td className={o.status === 'paid' ? 'text-success' : o.status === 'failed' ? 'text-danger' : ''}>{o.status}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      className="form-control"
                      style={{ minWidth: 140 }}
                      value={notesDraft[o._id] ?? ''}
                      onChange={(e) => setNotesDraft({ ...notesDraft, [o._id]: e.target.value })}
                    />
                    <button className="btn btn-sm" disabled={savingId === o._id} onClick={() => saveNotes(o._id)}>
                      {savingId === o._id ? <span className="spinner" /> : 'Save'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
