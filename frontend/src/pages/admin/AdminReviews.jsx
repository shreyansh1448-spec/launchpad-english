import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';

const NEW_REVIEW_DEFAULT = { courseSlug: '', name: '', role: '', stars: 5, text: '', reviewDate: '', photoUrl: '' };

function Thumb({ url, size = 44 }) {
  return url ? (
    <img src={url} alt="" style={{ width: size, height: size, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
  ) : (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        background: '#eee',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        color: '#888',
        flexShrink: 0,
      }}
    >
      No photo
    </div>
  );
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', role: '', stars: 5, text: '', reviewDate: '', photoUrl: '' });

  const [newReview, setNewReview] = useState(NEW_REVIEW_DEFAULT);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [photoError, setPhotoError] = useState('');

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

  function handlePhoto(e, onLoaded) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError('');
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('Photo must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onLoaded(reader.result);
    reader.readAsDataURL(file);
  }

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
    setPhotoError('');
    const date = review.reviewDate || review.createdAt;
    setEditForm({
      name: review.name,
      role: review.role,
      stars: review.stars,
      text: review.text,
      reviewDate: date ? date.slice(0, 10) : '',
      photoUrl: review.photoUrl || '',
    });
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
        average {avg}★. Each purchaser can post one review per order - resubmitting the site's review form edits it
        instead of creating a duplicate.
      </p>
      {error && <div className="form-alert error">{error}</div>}

      <form onSubmit={handleCreate} className="review-admin-card" style={{ margin: '12px 0 24px' }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Thumb url={newReview.photoUrl} size={80} />
            <input
              type="file"
              accept="image/*"
              style={{ width: 130 }}
              onChange={(e) => handlePhoto(e, (dataUrl) => setNewReview((prev) => ({ ...prev, photoUrl: dataUrl })))}
            />
            {newReview.photoUrl && (
              <button
                type="button"
                className="btn btn-sm btn-navy"
                onClick={() => setNewReview((prev) => ({ ...prev, photoUrl: '' }))}
              >
                Remove photo
              </button>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: 200 }}>
                <label className="muted review-admin-label">Course</label>
                <select
                  className="form-control"
                  style={{ width: '100%' }}
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
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label className="muted review-admin-label">Name</label>
                <input
                  className="form-control"
                  style={{ width: '100%' }}
                  value={newReview.name}
                  onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                />
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label className="muted review-admin-label">Role (optional)</label>
                <input
                  className="form-control"
                  style={{ width: '100%' }}
                  value={newReview.role}
                  onChange={(e) => setNewReview({ ...newReview, role: e.target.value })}
                />
              </div>
              <div style={{ width: 90 }}>
                <label className="muted review-admin-label">Stars</label>
                <input
                  className="form-control"
                  type="number"
                  min={1}
                  max={5}
                  style={{ width: '100%' }}
                  value={newReview.stars}
                  onChange={(e) => setNewReview({ ...newReview, stars: e.target.value })}
                />
              </div>
              <div style={{ width: 160 }}>
                <label className="muted review-admin-label" title="Date shown on the public site (leave blank to use today's date)">
                  Date (optional)
                </label>
                <input
                  className="form-control"
                  type="date"
                  style={{ width: '100%' }}
                  value={newReview.reviewDate}
                  onChange={(e) => setNewReview({ ...newReview, reviewDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="muted review-admin-label">Review text (optional - leave blank for a photo-only testimonial)</label>
              <textarea
                className="form-control"
                rows={3}
                style={{ width: '100%', resize: 'vertical' }}
                value={newReview.text}
                onChange={(e) => setNewReview({ ...newReview, text: e.target.value })}
              />
            </div>
            {photoError && <div className="form-alert error">{photoError}</div>}
            {createError && <div className="form-alert error">{createError}</div>}
            <div>
              <button className="btn btn-sm" type="submit" disabled={creating}>
                {creating ? 'Adding…' : 'Add review'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {loading ? (
        <p className="muted">Loading reviews…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {reviews.map((r) =>
            editingId === r._id ? (
              <div key={r._id} className="review-admin-card">
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <Thumb url={editForm.photoUrl} size={96} />
                    <input
                      type="file"
                      accept="image/*"
                      style={{ width: 130 }}
                      onChange={(e) => handlePhoto(e, (dataUrl) => setEditForm((prev) => ({ ...prev, photoUrl: dataUrl })))}
                    />
                    {editForm.photoUrl && (
                      <button
                        type="button"
                        className="btn btn-sm btn-navy"
                        onClick={() => setEditForm((prev) => ({ ...prev, photoUrl: '' }))}
                      >
                        Remove photo
                      </button>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <label className="muted review-admin-label">Name</label>
                        <input
                          className="form-control"
                          style={{ width: '100%' }}
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <label className="muted review-admin-label">Role</label>
                        <input
                          className="form-control"
                          style={{ width: '100%' }}
                          value={editForm.role || ''}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                        />
                      </div>
                      <div style={{ width: 90 }}>
                        <label className="muted review-admin-label">Stars</label>
                        <input
                          className="form-control"
                          type="number"
                          min={1}
                          max={5}
                          style={{ width: '100%' }}
                          value={editForm.stars}
                          onChange={(e) => setEditForm({ ...editForm, stars: e.target.value })}
                        />
                      </div>
                      <div style={{ width: 160 }}>
                        <label className="muted review-admin-label">Date</label>
                        <input
                          className="form-control"
                          type="date"
                          style={{ width: '100%' }}
                          value={editForm.reviewDate}
                          onChange={(e) => setEditForm({ ...editForm, reviewDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="muted review-admin-label">Review ({r.courseSlug})</label>
                      <textarea
                        className="form-control"
                        rows={6}
                        style={{ width: '100%', resize: 'vertical' }}
                        value={editForm.text}
                        onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
                      />
                    </div>
                    {photoError && <div className="form-alert error">{photoError}</div>}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-sm" onClick={() => saveEdit(r._id)}>
                        Save
                      </button>
                      <button className="btn btn-sm btn-navy" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div key={r._id} className="review-admin-card">
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <Thumb url={r.photoUrl} size={56} />
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: 16 }}>{r.name}</strong>
                      {r.role && <span className="muted">{r.role}</span>}
                      <span style={{ color: '#F59E0B' }}>{'★'.repeat(r.stars)}</span>
                    </div>
                    <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                      {r.courseSlug} ·{' '}
                      {new Date(r.reviewDate || r.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      · {r.approved ? 'Approved ✓' : 'Not approved'}
                      {r.featured ? ' · Featured ★' : ''}
                    </div>
                    {r.text && (
                      <p style={{ marginTop: 10, marginBottom: 0, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{r.text}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignContent: 'flex-start' }}>
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
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
