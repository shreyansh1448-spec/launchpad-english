import React, { useEffect, useState } from 'react';
import { api, API_ORIGIN } from '../../api.js';

const LINES_FIELDS = [
  { key: 'highlights', label: 'Highlights (one per line)' },
  { key: 'whoShouldJoin', label: 'Who Should Join (one per line)' },
  { key: 'dailyPattern', label: 'Daily Class Pattern (one per line)' },
  { key: 'outcomes', label: 'Learning Outcomes (one per line)' },
];
const JSON_FIELDS = [
  { key: 'syllabus', label: 'Syllabus JSON (array of { module, points[] })' },
  { key: 'faqs', label: 'FAQs JSON (array of { q, a })' },
  { key: 'batchTimings', label: 'Batch Timings JSON ({ online[], offline[] })' },
];

function toForm(course) {
  const form = { ...course };
  for (const { key } of LINES_FIELDS) form[key] = (course[key] || []).join('\n');
  for (const { key } of JSON_FIELDS) form[key] = JSON.stringify(course[key] ?? (key === 'batchTimings' ? {} : []), null, 2);
  form.pricing = JSON.parse(JSON.stringify(course.pricing || { online: { mrp: 0, offer: 0 }, offline: { mrp: 0, offer: 0 } }));
  return form;
}

const BLANK_COURSE = {
  slug: '',
  title: '',
  tagline: '',
  duration: '',
  level: 'All Levels',
  overview: '',
  highlights: [],
  whoShouldJoin: [],
  syllabus: [],
  dailyPattern: [],
  outcomes: [],
  batchTimings: { online: [], offline: [] },
  faqs: [],
  images: [],
  thumbnail: '',
  resources: [],
  pricing: { online: { mrp: 0, offer: 0 }, offline: { mrp: 0, offer: 0 } },
  displayOrder: 0,
  active: true,
  featured: true,
};

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSlug, setEditingSlug] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceFile, setResourceFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  function load() {
    setLoading(true);
    api.admin
      .listCourses()
      .then(setCourses)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function startEdit(course) {
    setEditingSlug(course.slug);
    setCreating(false);
    setForm(toForm(course));
    setError('');
    setSavedAt(null);
    setResourceTitle('');
    setResourceFile(null);
    setUploadError('');
  }

  function startCreate() {
    setEditingSlug(null);
    setCreating(true);
    setForm(toForm(BLANK_COURSE));
    setError('');
    setSavedAt(null);
  }

  function backToList() {
    setEditingSlug(null);
    setCreating(false);
    setForm(null);
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { ...form };
      for (const { key } of LINES_FIELDS) {
        payload[key] = form[key].split('\n').map((s) => s.trim()).filter(Boolean);
      }
      for (const { key } of JSON_FIELDS) {
        try {
          payload[key] = JSON.parse(form[key]);
        } catch {
          throw new Error(`"${key}" is not valid JSON`);
        }
      }
      payload.pricing = {
        online: { mrp: Number(form.pricing.online.mrp), offer: Number(form.pricing.online.offer) },
        offline: { mrp: Number(form.pricing.offline.mrp), offer: Number(form.pricing.offline.offer) },
      };
      payload.displayOrder = Number(form.displayOrder);
      delete payload._id;
      delete payload.__v;
      delete payload.createdAt;
      delete payload.updatedAt;

      if (creating) {
        payload.slug = slugify(payload.slug || payload.title);
        if (!payload.slug) throw new Error('Slug is required');
        const created = await api.admin.createCourse(payload);
        setCourses((prev) => [...prev, created]);
        setEditingSlug(created.slug);
        setCreating(false);
        setForm(toForm(created));
        setSavedAt(new Date());
      } else {
        delete payload.slug;
        const updated = await api.admin.updateCourse(editingSlug, payload);
        setCourses((prev) => prev.map((c) => (c.slug === updated.slug ? updated : c)));
        setForm(toForm(updated));
        setSavedAt(new Date());
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function setPriceField(mode, key, value) {
    setForm((f) => ({ ...f, pricing: { ...f.pricing, [mode]: { ...f.pricing[mode], [key]: value } } }));
  }

  async function handleUploadResource(e) {
    e.preventDefault();
    setUploadError('');
    if (!resourceTitle || !resourceFile) return setUploadError('Pick a PDF and give it a title first');
    setUploading(true);
    try {
      const updated = await api.admin.uploadResource(editingSlug, resourceTitle, resourceFile);
      setForm((f) => ({ ...f, resources: updated.resources }));
      setCourses((prev) => prev.map((c) => (c.slug === updated.slug ? updated : c)));
      setResourceTitle('');
      setResourceFile(null);
      e.target.reset();
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteResource(resourceId) {
    setUploadError('');
    try {
      const updated = await api.admin.deleteResource(editingSlug, resourceId);
      setForm((f) => ({ ...f, resources: updated.resources }));
      setCourses((prev) => prev.map((c) => (c.slug === updated.slug ? updated : c)));
    } catch (err) {
      setUploadError(err.message);
    }
  }

  if (loading) return <p className="muted">Loading courses…</p>;

  if (!editingSlug && !creating) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <h2>Courses</h2>
          <button className="btn btn-sm" onClick={startCreate}>
            + Add New Course
          </button>
        </div>
        <p className="muted" style={{ fontSize: 13.5 }}>
          Editing here changes the live database - the same content the public site reads. Protected fields
          (description, syllabus, duration, outcomes, pricing, batch timings, FAQs) are editable, but nothing was
          changed by default - forms are pre-filled with current values.
        </p>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Slug</th>
              <th>Active</th>
              <th>Featured (Home)</th>
              <th>Online / Offline Price</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.slug}>
                <td>{c.title}</td>
                <td className="muted">{c.slug}</td>
                <td>{c.active ? '✓' : '—'}</td>
                <td>{c.featured ? '✓' : '—'}</td>
                <td>
                  ₹{c.pricing.online.offer.toLocaleString('en-IN')} / ₹{c.pricing.offline.offer.toLocaleString('en-IN')}
                </td>
                <td>
                  <button className="btn btn-sm" onClick={() => startEdit(c)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div>
      <button className="btn btn-sm btn-navy" onClick={backToList} style={{ marginBottom: 18 }}>
        ← Back to Courses
      </button>
      <h2>{creating ? 'Add New Course' : `Edit: ${form.title}`}</h2>
      <form onSubmit={handleSave}>
        {error && <div className="form-alert error">{error}</div>}
        {savedAt && (
          <div className="form-alert success">
            {creating ? 'Course created' : 'Saved'} at {savedAt.toLocaleTimeString()}
          </div>
        )}

        {creating && (
          <div className="form-group">
            <label>Slug (URL-safe, unique - auto-filled from Title if left blank)</label>
            <input
              className="form-control"
              placeholder="e.g. business-english-course"
              value={form.slug}
              onChange={(e) => setField('slug', e.target.value)}
            />
          </div>
        )}

        <div className="grid grid-2">
          <div className="form-group">
            <label>Title</label>
            <input
              className="form-control"
              value={form.title}
              onChange={(e) => {
                const title = e.target.value;
                setForm((f) => ({
                  ...f,
                  title,
                  slug: creating && (!f.slug || f.slug === slugify(f.title)) ? slugify(title) : f.slug,
                }));
              }}
            />
          </div>
          <div className="form-group">
            <label>Level</label>
            <input className="form-control" value={form.level} onChange={(e) => setField('level', e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label>Tagline</label>
          <input className="form-control" value={form.tagline} onChange={(e) => setField('tagline', e.target.value)} />
        </div>

        <div className="grid grid-2">
          <div className="form-group">
            <label>Duration</label>
            <input className="form-control" value={form.duration} onChange={(e) => setField('duration', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Display Order</label>
            <input
              className="form-control"
              type="number"
              value={form.displayOrder}
              onChange={(e) => setField('displayOrder', e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Overview</label>
          <textarea className="form-control" rows={4} value={form.overview} onChange={(e) => setField('overview', e.target.value)} />
        </div>

        <div className="grid grid-2">
          <div className="form-group">
            <label>Thumbnail / Banner Image URL</label>
            <input className="form-control" value={form.thumbnail} onChange={(e) => setField('thumbnail', e.target.value)} />
          </div>
          <div className="form-group" style={{ display: 'flex', gap: 24, alignItems: 'center', paddingTop: 26 }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" checked={!!form.active} onChange={(e) => setField('active', e.target.checked)} />
              Active (visible on site)
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" checked={!!form.featured} onChange={(e) => setField('featured', e.target.checked)} />
              Featured (shown on Home)
            </label>
          </div>
        </div>

        <h3 className="mt-24">Pricing</h3>
        <div className="grid grid-2">
          {['online', 'offline'].map((mode) => (
            <div className="card" key={mode}>
              <h4 style={{ textTransform: 'capitalize' }}>{mode}</h4>
              <div className="form-group">
                <label>MRP</label>
                <input
                  className="form-control"
                  type="number"
                  value={form.pricing[mode].mrp}
                  onChange={(e) => setPriceField(mode, 'mrp', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Offer Price</label>
                <input
                  className="form-control"
                  type="number"
                  value={form.pricing[mode].offer}
                  onChange={(e) => setPriceField(mode, 'offer', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        {LINES_FIELDS.map(({ key, label }) => (
          <div className="form-group" key={key}>
            <label>{label}</label>
            <textarea className="form-control" rows={4} value={form[key]} onChange={(e) => setField(key, e.target.value)} />
          </div>
        ))}

        {JSON_FIELDS.map(({ key, label }) => (
          <div className="form-group" key={key}>
            <label>{label}</label>
            <textarea
              className="form-control admin-json"
              rows={8}
              value={form[key]}
              onChange={(e) => setField(key, e.target.value)}
            />
          </div>
        ))}

        <button className="btn btn-block" disabled={saving}>
          {saving ? <span className="spinner" /> : creating ? 'Create Course' : 'Save Changes'}
        </button>
      </form>

      {!creating && (
        <>
      <h3 className="mt-24">Course Resources (PDFs)</h3>
      <p className="muted" style={{ fontSize: 13.5 }}>
        Uploaded here, downloadable from the course's detail page - e.g. Brochure, Sample Notes, Grammar Notes,
        Vocabulary, Worksheet, Assignment, Mock Test, Speaking Practice, Syllabus PDF.
      </p>
      {uploadError && <div className="form-alert error">{uploadError}</div>}

      {(form.resources || []).length > 0 && (
        <table className="admin-table mb-24">
          <thead>
            <tr>
              <th>Title</th>
              <th>File</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {form.resources.map((r) => (
              <tr key={r._id}>
                <td>{r.title}</td>
                <td>
                  <a href={`${API_ORIGIN}${r.url}`} target="_blank" rel="noreferrer">
                    View PDF
                  </a>
                </td>
                <td>
                  <button className="btn btn-sm btn-navy" onClick={() => handleDeleteResource(r._id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <form onSubmit={handleUploadResource} className="card">
        <div className="grid grid-2">
          <div className="form-group">
            <label>Resource Title</label>
            <input
              className="form-control"
              placeholder="e.g. Brochure, Syllabus PDF"
              value={resourceTitle}
              onChange={(e) => setResourceTitle(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>PDF File</label>
            <input
              className="form-control"
              type="file"
              accept="application/pdf"
              onChange={(e) => setResourceFile(e.target.files[0] || null)}
            />
          </div>
        </div>
        <button className="btn btn-sm" disabled={uploading}>
          {uploading ? <span className="spinner" /> : 'Upload PDF'}
        </button>
      </form>
        </>
      )}
    </div>
  );
}
