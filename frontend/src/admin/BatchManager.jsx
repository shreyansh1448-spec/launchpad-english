import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { MODE_META, DAY_TYPE_LABEL, BATCH_STATUS_LABEL } from '../../shared/course.js';
import { formatDate } from '../components/BatchTimings.jsx';

const BLANK = { courseId: '', mode: 'online', dayType: 'weekday', timeLabel: '', classroom: '', seatsAvailable: '', startDate: '', status: 'open', displayOrder: 0 };

const TIME_PRESETS = {
  online: ['9:00 AM - 11:00 AM', '11:00 AM - 1:00 PM', '1:00 PM - 3:00 PM', '9:00 PM - 10:30 PM'],
  offline: ['3:00 PM - 5:00 PM', '4:00 PM - 6:00 PM', '5:00 PM - 7:00 PM', '6:00 PM - 8:00 PM', '7:00 PM - 9:00 PM'],
};

const STATUS_CLASS = { open: 'badge-success', filling: 'badge-warning', full: 'badge-danger', closed: 'badge-muted' };

// Create/edit/delete batch timings. With `courseId`, it manages only that
// course's own batches (the course editor's Batches tab); without it, every
// batch, including "all courses" slots (the Batches page).
export default function BatchManager({ courseId, courses = [] }) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modeFilter, setModeFilter] = useState('all');
  const [form, setForm] = useState(null); // null = closed; {...} = add/edit
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api.admin
      .listBatches(courseId)
      .then(setBatches)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, [courseId]);

  const courseName = (id) => (id ? courses.find((c) => c._id === id)?.title || 'Unknown course' : 'All courses');
  const visible = batches.filter((b) => modeFilter === 'all' || b.mode === modeFilter);

  function startAdd(mode = modeFilter === 'all' ? 'online' : modeFilter) {
    setError('');
    setForm({ ...BLANK, mode, courseId: courseId || '' });
  }

  function startEdit(b) {
    setError('');
    setForm({ ...b, courseId: b.courseId || '', seatsAvailable: b.seatsAvailable ?? '' });
  }

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, courseId: courseId || form.courseId || null };
      if (form._id) await api.admin.updateBatch(form._id, payload);
      else await api.admin.createBatch(payload);
      setForm(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(b) {
    if (!window.confirm(`Delete the ${MODE_META[b.mode].label} ${b.timeLabel} batch?`)) return;
    try {
      await api.admin.deleteBatch(b._id);
      setBatches((prev) => prev.filter((x) => x._id !== b._id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function quickStatus(b, status) {
    try {
      const updated = await api.admin.updateBatch(b._id, { status });
      setBatches((prev) => prev.map((x) => (x._id === b._id ? updated : x)));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="batch-manager">
      <div className="admin-toolbar">
        <div className="segmented" role="tablist">
          {['all', 'online', 'offline'].map((m) => (
            <button key={m} type="button" className={modeFilter === m ? 'active' : ''} onClick={() => setModeFilter(m)}>
              {m === 'all' ? 'All' : MODE_META[m].label}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-sm" onClick={() => startAdd()}>
          <i className="fas fa-plus" /> Add Batch
        </button>
      </div>

      {error && <div className="form-alert error">{error}</div>}

      {form && (
        <form className="admin-panel batch-form" onSubmit={save}>
          <h3>{form._id ? 'Edit Batch' : 'New Batch'}</h3>
          <div className="form-grid">
            {!courseId && (
              <div className="form-group">
                <label>Applies To</label>
                <select className="form-control" value={form.courseId} onChange={(e) => set('courseId', e.target.value)}>
                  <option value="">All courses (shared time slot)</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-group">
              <label>Mode</label>
              <select className="form-control" value={form.mode} onChange={(e) => set('mode', e.target.value)}>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </div>
            <div className="form-group">
              <label>Days</label>
              <select className="form-control" value={form.dayType} onChange={(e) => set('dayType', e.target.value)}>
                <option value="weekday">Weekday (Mon - Fri)</option>
                <option value="weekend">Weekend (Sat - Sun)</option>
                <option value="daily">Daily</option>
              </select>
            </div>
            <div className="form-group">
              <label>Time</label>
              <input
                className="form-control"
                value={form.timeLabel}
                placeholder="e.g. 9:00 AM - 11:00 AM"
                onChange={(e) => set('timeLabel', e.target.value)}
                list={`time-presets-${form.mode}`}
                required
              />
              <datalist id={`time-presets-${form.mode}`}>
                {TIME_PRESETS[form.mode].map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
            {form.mode === 'offline' && (
              <div className="form-group">
                <label>Classroom</label>
                <input className="form-control" value={form.classroom} placeholder="e.g. Green Park Campus - Room 2" onChange={(e) => set('classroom', e.target.value)} />
              </div>
            )}
            <div className="form-group">
              <label>Available Seats</label>
              <input
                className="form-control"
                type="number"
                min="0"
                value={form.seatsAvailable}
                placeholder="Leave blank = not tracked"
                onChange={(e) => set('seatsAvailable', e.target.value)}
              />
              <p className="form-hint">Goes down by 1 with every paid enrollment.</p>
            </div>
            <div className="form-group">
              <label>Start Date</label>
              <input className="form-control" type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select className="form-control" value={form.status} onChange={(e) => set('status', e.target.value)}>
                {Object.entries(BATCH_STATUS_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Display Order</label>
              <input className="form-control" type="number" value={form.displayOrder} onChange={(e) => set('displayOrder', e.target.value)} />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-sm" disabled={saving}>
              {saving ? <span className="spinner" /> : form._id ? 'Save Batch' : 'Create Batch'}
            </button>
            <button type="button" className="btn btn-sm btn-outline" onClick={() => setForm(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="muted">Loading batches…</p>
      ) : visible.length === 0 ? (
        <div className="empty-panel">
          <p>No batches yet{modeFilter !== 'all' ? ` for ${MODE_META[modeFilter].label}` : ''}.</p>
          <button type="button" className="btn btn-sm" onClick={() => startAdd()}>
            <i className="fas fa-plus" /> Add Batch
          </button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="admin-table admin-table-cards">
            <thead>
              <tr>
                <th>Mode</th>
                {!courseId && <th>Course</th>}
                <th>Days</th>
                <th>Time</th>
                <th>Classroom</th>
                <th>Seats</th>
                <th>Start</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {visible.map((b) => (
                <tr key={b._id}>
                  <td data-label="Mode">
                    <span className={`mode-pill mode-pill-${b.mode}`}>{MODE_META[b.mode].label}</span>
                  </td>
                  {!courseId && <td data-label="Course">{courseName(b.courseId)}</td>}
                  <td data-label="Days">{DAY_TYPE_LABEL[b.dayType]}</td>
                  <td data-label="Time">
                    <strong>{b.timeLabel}</strong>
                  </td>
                  <td data-label="Classroom">{b.classroom || '—'}</td>
                  <td data-label="Seats">{b.seatsAvailable ?? '∞'}</td>
                  <td data-label="Start">{b.startDate ? formatDate(b.startDate) : '—'}</td>
                  <td data-label="Status">
                    <select
                      className={`status-select ${STATUS_CLASS[b.status]}`}
                      value={b.status}
                      onChange={(e) => quickStatus(b, e.target.value)}
                      aria-label="Batch status"
                    >
                      {Object.entries(BATCH_STATUS_LABEL).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="row-actions">
                    <button type="button" className="icon-btn" onClick={() => startEdit(b)} aria-label="Edit batch" title="Edit">
                      <i className="fas fa-pen" />
                    </button>
                    <button type="button" className="icon-btn danger" onClick={() => remove(b)} aria-label="Delete batch" title="Delete">
                      <i className="fas fa-trash" />
                    </button>
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
