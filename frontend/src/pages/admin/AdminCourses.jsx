import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../api.js';
import CourseImage from '../../components/CourseImage.jsx';
import { MODE_META, coursePath, courseModes, formatPrice, priceFor } from '../../../shared/course.js';

// Course catalog table - one row per course per mode it's offered in, so
// online and offline prices are each visible (and editable) at a glance.
export default function AdminCourses() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState('');

  const modeFilter = params.get('mode') || 'all';
  const statusFilter = params.get('status') || 'all';

  function load() {
    setLoading(true);
    api.admin
      .listCourses()
      .then(setCourses)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  function setFilter(key, value) {
    const next = new URLSearchParams(params);
    if (value === 'all') next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  }

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = [];
    for (const c of courses) {
      if (statusFilter === 'published' && !c.active) continue;
      if (statusFilter === 'draft' && c.active) continue;
      if (q && !`${c.title} ${c.category} ${c.slug}`.toLowerCase().includes(q)) continue;
      const modes = courseModes(c);
      if (!modes.length && modeFilter === 'all') out.push({ course: c, mode: null });
      for (const m of modes) if (modeFilter === 'all' || modeFilter === m) out.push({ course: c, mode: m });
    }
    return out;
  }, [courses, search, modeFilter, statusFilter]);

  async function run(course, fn, message) {
    setBusyId(course._id);
    setError('');
    setNotice('');
    try {
      await fn();
      setNotice(message);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const togglePublish = (c) =>
    run(c, () => api.admin.updateCourse(c._id, { active: !c.active }), c.active ? `"${c.title}" unpublished - it's hidden from the website.` : `"${c.title}" is now live.`);

  const duplicate = (c) =>
    run(
      c,
      async () => {
        const copy = await api.admin.duplicateCourse(c._id);
        navigate(`/admin/courses/${copy._id}`);
      },
      'Course duplicated as a draft.'
    );

  const remove = (c) => {
    if (!window.confirm(`Delete "${c.title}" permanently?\n\nIts online and offline pages, its own batches and PDFs will be removed. Past orders and reviews are kept.`)) return;
    run(c, () => api.admin.deleteCourse(c._id), `"${c.title}" deleted.`);
  };

  function preview(c, mode) {
    if (c.active && mode) window.open(coursePath(mode, c.slug), '_blank', 'noopener');
    else navigate(`/admin/courses/${c._id}?preview=${mode || 'online'}`);
  }

  return (
    <div className="cms-page">
      <div className="cms-page-head">
        <div>
          <h1>Courses</h1>
          <p className="muted">Each course can run online, offline or both - with separate prices, pages and batches for each.</p>
        </div>
        <div className="cms-page-actions">
          <Link className="btn btn-sm" to="/admin/courses/new">
            <i className="fas fa-plus" /> Add Course
          </Link>
        </div>
      </div>

      <div className="admin-toolbar">
        <input className="form-control toolbar-search" placeholder="Search courses…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="segmented" aria-label="Filter by mode">
          {['all', 'online', 'offline'].map((m) => (
            <button key={m} type="button" className={modeFilter === m ? 'active' : ''} onClick={() => setFilter('mode', m)}>
              {m === 'all' ? 'All Modes' : MODE_META[m].label}
            </button>
          ))}
        </div>
        <select className="form-control toolbar-select" value={statusFilter} onChange={(e) => setFilter('status', e.target.value)} aria-label="Filter by status">
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {error && <div className="form-alert error">{error}</div>}
      {notice && <div className="form-alert success">{notice}</div>}

      {loading ? (
        <p className="muted">Loading courses…</p>
      ) : rows.length === 0 ? (
        <div className="empty-panel">
          <p>No courses match these filters.</p>
          <Link className="btn btn-sm" to="/admin/courses/new">
            <i className="fas fa-plus" /> Add Course
          </Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="admin-table admin-table-cards">
            <thead>
              <tr>
                <th>Course</th>
                <th>Category</th>
                <th>Mode</th>
                <th>Price</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ course: c, mode }) => {
                const price = mode ? priceFor(c, mode) : null;
                return (
                  <tr key={`${c._id}-${mode}`} className={busyId === c._id ? 'row-busy' : ''}>
                    <td data-label="Course">
                      <Link to={`/admin/courses/${c._id}`} className="course-cell">
                        <span className="course-cell-thumb">
                          <CourseImage course={c} />
                        </span>
                        <span>
                          <strong>{c.title}</strong>
                          <span className="muted course-cell-slug">/{c.slug}</span>
                        </span>
                      </Link>
                    </td>
                    <td data-label="Category">{c.category || '—'}</td>
                    <td data-label="Mode">
                      {mode ? <span className={`mode-pill mode-pill-${mode}`}>{MODE_META[mode].label}</span> : <span className="muted">Not offered</span>}
                    </td>
                    <td data-label="Price">
                      {price ? (
                        <span className="price-cell">
                          <strong>{formatPrice(price.offer, c.currency)}</strong>
                          {price.discount > 0 && (
                            <>
                              <s className="muted">{formatPrice(price.mrp, c.currency)}</s>
                              <span className="discount-mini">-{price.discount}%</span>
                            </>
                          )}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td data-label="Status">
                      <span className="badge-group">
                        <span className={c.active ? 'badge-success' : 'badge-muted'}>{c.active ? 'Active' : 'Draft'}</span>
                        {c.featured && c.active && <span className="badge-info" title="Shown on the Home page">Home</span>}
                      </span>
                    </td>
                    <td className="row-actions">
                      <Link className="btn btn-xs" to={`/admin/courses/${c._id}`}>
                        <i className="fas fa-pen" /> Edit
                      </Link>
                      <button type="button" className="icon-btn" title="Preview" aria-label="Preview" onClick={() => preview(c, mode)}>
                        <i className="fas fa-eye" />
                      </button>
                      <button type="button" className="icon-btn" title="Duplicate" aria-label="Duplicate" onClick={() => duplicate(c)} disabled={busyId === c._id}>
                        <i className="fas fa-copy" />
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        title={c.active ? 'Unpublish' : 'Publish'}
                        aria-label={c.active ? 'Unpublish' : 'Publish'}
                        onClick={() => togglePublish(c)}
                        disabled={busyId === c._id}
                      >
                        <i className={`fas ${c.active ? 'fa-eye-slash' : 'fa-upload'}`} />
                      </button>
                      <button type="button" className="icon-btn danger" title="Delete" aria-label="Delete" onClick={() => remove(c)} disabled={busyId === c._id}>
                        <i className="fas fa-trash" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
