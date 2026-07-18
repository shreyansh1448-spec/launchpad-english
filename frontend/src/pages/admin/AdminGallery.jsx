import React, { useEffect, useState } from 'react';
import { api, resolveMediaUrl } from '../../api.js';

const CATEGORIES = ['classroom', 'event', 'student', 'certificate', 'other'];
const EMPTY = { title: '', mediaType: 'image', imageUrl: '', videoUrl: '', category: 'classroom', courseSlug: '', displayOrder: 0 };

export default function AdminGallery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  function load() {
    setLoading(true);
    api.admin
      .listGallery()
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  function startEdit(item) {
    setEditingId(item._id);
    setForm({
      title: item.title,
      mediaType: item.mediaType || 'image',
      imageUrl: item.imageUrl || '',
      videoUrl: item.videoUrl || '',
      category: item.category,
      courseSlug: item.courseSlug || '',
      displayOrder: item.displayOrder,
    });
  }
  function resetForm() {
    setEditingId(null);
    setForm(EMPTY);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { ...form, displayOrder: Number(form.displayOrder) };
      if (editingId) {
        await api.admin.updateGalleryItem(editingId, payload);
      } else {
        await api.admin.createGalleryItem(payload);
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setError('');
    try {
      await api.admin.deleteGalleryItem(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  // Images are read client-side and embedded as a base64 data URL directly
  // in imageUrl - Vercel's serverless filesystem is read-only, so on-disk
  // uploads aren't an option there. Videos are too large for this (and for
  // MongoDB) - those still need a hosted URL (YouTube embed or direct .mp4).
  function handleFileUpload(e, target) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    if (file.size > 3 * 1024 * 1024) {
      setUploadError('Image must be under 3MB');
      e.target.value = '';
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (target === 'thumbnail') {
        setForm((f) => ({ ...f, imageUrl: reader.result }));
      } else {
        setForm((f) => ({ ...f, mediaType: 'image', imageUrl: reader.result }));
      }
      setUploading(false);
      e.target.value = '';
    };
    reader.onerror = () => {
      setUploadError('Could not read file');
      setUploading(false);
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <h2>Gallery</h2>
      <p className="muted" style={{ fontSize: 13.5 }}>
        Photos and videos here - either paste a URL or upload the file directly - are what the public Gallery
        section shows, grouped into sections by category - each section can hold a mix of photos and videos.
      </p>
      {error && <div className="form-alert error">{error}</div>}

      <form onSubmit={handleSubmit} className="card mb-24">
        <h3>{editingId ? 'Edit Item' : 'Add Item'}</h3>
        <div className="grid grid-2">
          <div className="form-group">
            <label>Title</label>
            <input className="form-control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Category (Section)</label>
            <select className="form-control" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Media Type</label>
          <select className="form-control" value={form.mediaType} onChange={(e) => setForm({ ...form, mediaType: e.target.value })}>
            <option value="image">Photo</option>
            <option value="video">Video</option>
          </select>
        </div>
        {uploadError && <div className="form-alert error">{uploadError}</div>}
        {form.mediaType === 'video' ? (
          <>
            <div className="form-group">
              <label>Video URL (YouTube embed URL, e.g. https://www.youtube.com/embed/VIDEO_ID, or a direct .mp4 URL)</label>
              <input className="form-control" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} required />
              <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>
                Video files must be hosted elsewhere (YouTube, Vimeo, etc.) and linked here - too large to store directly.
              </div>
            </div>
            <div className="form-group">
              <label>Thumbnail Image URL (optional)</label>
              <input className="form-control" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="muted" style={{ fontSize: 13 }}>or upload a thumbnail image:</span>
                <input type="file" accept="image/*" disabled={uploading} onChange={(e) => handleFileUpload(e, 'thumbnail')} />
                {uploading && <span className="spinner" />}
              </div>
            </div>
          </>
        ) : (
          <div className="form-group">
            <label>Image URL</label>
            <input className="form-control" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} required />
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="muted" style={{ fontSize: 13 }}>or upload an image file directly:</span>
              <input type="file" accept="image/*" disabled={uploading} onChange={(e) => handleFileUpload(e, 'image')} />
              {uploading && <span className="spinner" />}
            </div>
          </div>
        )}
        <div className="grid grid-2">
          <div className="form-group">
            <label>Course Slug (optional)</label>
            <input className="form-control" value={form.courseSlug} onChange={(e) => setForm({ ...form, courseSlug: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Display Order</label>
            <input
              className="form-control"
              type="number"
              value={form.displayOrder}
              onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" disabled={saving}>
            {saving ? <span className="spinner" /> : editingId ? 'Save Changes' : 'Add Item'}
          </button>
          {editingId && (
            <button type="button" className="btn btn-navy" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p className="muted">Loading gallery…</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Preview</th>
              <th>Title</th>
              <th>Type</th>
              <th>Category</th>
              <th>Order</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id}>
                <td style={{ position: 'relative' }}>
                  {item.imageUrl ? (
                    <img src={resolveMediaUrl(item.imageUrl)} alt={item.title} style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                  ) : (
                    <div style={{ width: 60, height: 40, borderRadius: 6, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      🎬
                    </div>
                  )}
                  {item.mediaType === 'video' && (
                    <span style={{ position: 'absolute', top: 2, left: 2, fontSize: 12 }}>▶️</span>
                  )}
                </td>
                <td>{item.title || '—'}</td>
                <td>{item.mediaType === 'video' ? 'Video' : 'Photo'}</td>
                <td>{item.category}</td>
                <td>{item.displayOrder}</td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm" onClick={() => startEdit(item)}>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-navy" onClick={() => handleDelete(item._id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
