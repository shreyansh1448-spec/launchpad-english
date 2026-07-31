import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import RichTextEditor from '../../components/RichTextEditor.jsx';
import Pagination from '../../components/Pagination.jsx';

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function toDateInputValue(iso) {
  if (!iso) return new Date().toISOString().slice(0, 10);
  return String(iso).slice(0, 10);
}

const EMPTY = { title: '', slug: '', excerpt: '', content: '', thumbnail: '', publishedAt: toDateInputValue(), active: true };

export default function AdminBlog() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [editingSlug, setEditingSlug] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  function load() {
    setLoading(true);
    api.admin
      .listBlogPosts(page, search)
      .then((res) => {
        setItems(res.posts);
        setTotal(res.total);
        setPageSize(res.pageSize);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, [page, search]);

  function startEdit(post) {
    setEditingSlug(post.slug);
    setSlugTouched(true);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content || '',
      thumbnail: post.thumbnail || '',
      publishedAt: toDateInputValue(post.publishedAt),
      active: post.active,
    });
    window.scrollTo(0, 0);
  }
  function resetForm() {
    setEditingSlug(null);
    setSlugTouched(false);
    setForm(EMPTY);
  }

  function handleTitleChange(title) {
    setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { ...form, publishedAt: `${form.publishedAt}T00:00:00` };
      if (editingSlug) {
        await api.admin.updateBlogPost(editingSlug, payload);
      } else {
        await api.admin.createBlogPost(payload);
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(slug) {
    if (!window.confirm('Permanently delete this post?')) return;
    setError('');
    try {
      await api.admin.deleteBlogPost(slug);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  // Thumbnail is read client-side and embedded as a base64 data URL, same
  // approach as AdminGallery.jsx - no writable filesystem to upload to.
  function handleFileUpload(e) {
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
      setForm((f) => ({ ...f, thumbnail: reader.result }));
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

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  const totalPages = Math.max(1, Math.ceil(total / (pageSize || 20)));

  return (
    <div>
      <h2>Blogs</h2>
      <p className="muted" style={{ fontSize: 13.5 }}>
        Posts here power the public Blog section. {total.toLocaleString()} post{total === 1 ? '' : 's'} total.
      </p>
      {error && <div className="form-alert error">{error}</div>}

      <form onSubmit={handleSubmit} className="card mb-24">
        <h3>{editingSlug ? 'Edit Post' : 'Add Post'}</h3>
        <div className="grid grid-2">
          <div className="form-group">
            <label>Title</label>
            <input className="form-control" value={form.title} onChange={(e) => handleTitleChange(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Slug</label>
            <input
              className="form-control"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm({ ...form, slug: e.target.value });
              }}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Excerpt (shown on the blog list card)</label>
          <textarea
            className="form-control"
            rows={2}
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Content</label>
          <RichTextEditor value={form.content} onChange={(html) => setForm((f) => ({ ...f, content: html }))} />
        </div>

        {uploadError && <div className="form-alert error">{uploadError}</div>}
        <div className="form-group">
          <label>Thumbnail URL</label>
          <input className="form-control" value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} />
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="muted" style={{ fontSize: 13 }}>or upload an image file directly:</span>
            <input type="file" accept="image/*" disabled={uploading} onChange={handleFileUpload} />
            {uploading && <span className="spinner" />}
          </div>
        </div>

        <div className="grid grid-2">
          <div className="form-group">
            <label>Published Date</label>
            <input
              type="date"
              className="form-control"
              value={form.publishedAt}
              onChange={(e) => setForm({ ...form, publishedAt: e.target.value })}
              required
            />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              Published (visible on the public blog)
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" disabled={saving}>
            {saving ? <span className="spinner" /> : editingSlug ? 'Save Changes' : 'Add Post'}
          </button>
          {editingSlug && (
            <button type="button" className="btn btn-navy" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <form onSubmit={handleSearchSubmit} className="admin-search mb-24">
        <input
          className="form-control"
          placeholder="Search by title…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button className="btn btn-sm" type="submit">
          Search
        </button>
      </form>

      {loading ? (
        <p className="muted">Loading posts…</p>
      ) : (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Slug</th>
                <th>Published</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((post) => (
                <tr key={post._id}>
                  <td>{post.title}</td>
                  <td className="muted">{post.slug}</td>
                  <td>{toDateInputValue(post.publishedAt)}</td>
                  <td>{post.active ? 'Published' : 'Hidden'}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-sm" onClick={() => startEdit(post)}>
                      Edit
                    </button>
                    <button className="btn btn-sm btn-navy" onClick={() => handleDelete(post.slug)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} showJump jumpFieldId="adminJumpPage" />
        </>
      )}
    </div>
  );
}
