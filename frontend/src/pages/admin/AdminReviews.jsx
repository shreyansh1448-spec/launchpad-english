import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';

const NEW_REVIEW_DEFAULT = { courseSlug: '', name: '', role: '', stars: 5, text: '' };

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', role: '', stars: 5, text: '' });

  const [newReview, setNewReview] = useState(NEW_REVIEW_DEFAULT);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  function load() {
    setLoading(true);
    api.admin
      .listReviews()
      .then(setReviews)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);
  useEffect(() => {
    api.admin
      .listCourses()
      .then((list) => {
        setCourses(list);
        setNewReview((prev) => (prev.courseSlug ? prev : { ...prev, courseSlug: list[0]?.slug || '' }));
      })
      .catch(() => {});
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setCreateError('');
    if (!newReview.courseSlug || !newReview.name.trim()) {
      setCreateError('Course and name are required');
      return;
    }
    setCreating(true);
    try {
      const created = await api.admin.createReview(newReview);
      setReviews((prev) => [created, ...prev]);
      setNewReview({ ...NEW_REVIEW_DEFAULT, courseSlug: newReview.courseSlug });
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function toggleApproved(review) {
    setError('');
    try {
      const updated = await api.admin.setReviewApproved(review._id, !review.approved);
      setReviews((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleFeatured(review) {
    setError('');
    try {
      const updated = await api.admin.updateReview(review._id, { featured: !review.featured });
      setReviews((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    setError('');
    try {
      await api.admin.deleteReview(id);
      setReviews((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(review) {
    setEditingId(review._id);
    setEditForm({ name: review.name, role: review.role, stars: review.stars, text: review.text });
  }

  async function saveEdit(id) {
    setError('');
    try {
      const updated = await api.admin.updateReview(id, editForm);
      setReviews((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    }
  }

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.stars, 0) / reviews.length).toFixed(1) : '—';

  return (
    <div>
      <h2>Reviews</h2>
      <p className="muted" style={{ fontSize: 13.5 }}>
        Only reviews with Approved = ✓ show on the public site. Featured reviews are shown first. {reviews.length} total,
        average {avg}★.
      </p>
      {error && <div className="form-alert error">{error}</div>}

      <form onSubmit={handleCreate} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start', margin: '12px 0 20px' }}>
        <select
          className="form-control"
          style={{ width: 220 }}
          value={newReview.courseSlug}
          onChange={(e) => setNewReview({ ...newReview, courseSlug: e.target.value })}
        >
          {courses.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.title}
            </option>
          ))}
          <option value="general">General / Institute testimonial</option>
        </select>
        <input
          className="form-control"
          style={{ width: 160 }}
          placeholder="Name"
          value={newReview.name}
          onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
        />
        <input
          className="form-control"
          style={{ width: 160 }}
          placeholder="Role/title (optional)"
          value={newReview.role}
          onChange={(e) => setNewReview({ ...newReview, role: e.target.value })}
        />
        <input
          className="form-control"
          type="number"
          min={1}
          max={5}
          style={{ width: 70 }}
          value={newReview.stars}
          onChange={(e) => setNewReview({ ...newReview, stars: e.target.value })}
        />
        <textarea
          className="form-control"
          style={{ width: 320 }}
          rows={2}
          placeholder="Review text (optional - leave blank for a photo-only testimonial)"
          value={newReview.text}
          onChange={(e) => setNewReview({ ...newReview, text: e.target.value })}
        />
        <button className="btn btn-sm" type="submit" disabled={creating}>
          {creating ? 'Adding…' : 'Add review'}
        </button>
        {createError && <div className="form-alert error" style={{ width: '100%' }}>{createError}</div>}
      </form>

      {loading ? (
        <p className="muted">Loading reviews…</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Course</th>
              <th>Stars</th>
              <th>Review</th>
              <th>Approved</th>
              <th>Featured</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((r) =>
              editingId === r._id ? (
                <tr key={r._id}>
                  <td>
                    <input
                      className="form-control"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className="form-control"
                      value={editForm.role || ''}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    />
                  </td>
                  <td className="muted">{r.courseSlug}</td>
                  <td>
                    <input
                      className="form-control"
                      type="number"
                      min={1}
                      max={5}
                      style={{ width: 60 }}
                      value={editForm.stars}
                      onChange={(e) => setEditForm({ ...editForm, stars: e.target.value })}
                    />
                  </td>
                  <td style={{ maxWidth: 320 }}>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={editForm.text}
                      onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
                    />
                  </td>
                  <td>{r.approved ? '✓' : '—'}</td>
                  <td>{r.featured ? '★' : '—'}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-sm" onClick={() => saveEdit(r._id)}>
                      Save
                    </button>
                    <button className="btn btn-sm btn-navy" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={r._id}>
                  <td>{r.name}</td>
                  <td className="muted">{r.role}</td>
                  <td className="muted">{r.courseSlug}</td>
                  <td>{'★'.repeat(r.stars)}</td>
                  <td style={{ maxWidth: 320 }}>{r.text}</td>
                  <td>{r.approved ? '✓' : '—'}</td>
                  <td>{r.featured ? '★' : '—'}</td>
                  <td style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn btn-sm" onClick={() => toggleApproved(r)}>
                      {r.approved ? 'Reject' : 'Approve'}
                    </button>
                    <button className="btn btn-sm" onClick={() => toggleFeatured(r)}>
                      {r.featured ? 'Unfeature' : 'Feature'}
                    </button>
                    <button className="btn btn-sm btn-navy" onClick={() => startEdit(r)}>
                      Edit
                    </button>
                    <button className="btn btn-sm btn-navy" onClick={() => handleDelete(r._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
