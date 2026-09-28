import React, { useRef, useState } from 'react';
import { api } from '../api.js';
import { prepareImage } from '../lib/image.js';
import SortableList from './SortableList.jsx';

// Upload a new image (resized in the browser, stored via /api/media) or
// paste an image URL. `value` is the image URL.
export function ImageField({ label, hint, value, onChange, aspect = 'wide' }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      const dataUrl = await prepareImage(file);
      const { url } = await api.admin.uploadMedia(dataUrl, file.name);
      onChange(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="form-group image-field">
      {label && <label>{label}</label>}
      <div className={`image-field-box image-field-${aspect}`}>
        {value ? <img src={value} alt="" /> : <span className="image-field-empty"><i className="far fa-image" /> No image</span>}
        {busy && <span className="image-field-busy"><span className="spinner" /></span>}
      </div>
      <div className="image-field-actions">
        <button type="button" className="btn btn-sm" onClick={() => inputRef.current?.click()} disabled={busy}>
          <i className="fas fa-upload" /> {value ? 'Replace' : 'Upload Image'}
        </button>
        {value && (
          <button type="button" className="btn btn-sm btn-outline" onClick={() => onChange('')}>
            Remove
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
      </div>
      <input
        className="form-control form-control-sm"
        placeholder="…or paste an image URL"
        value={value?.startsWith('/api/media/') ? '' : value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <p className="form-hint">{hint}</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

// Ordered gallery of { url, caption } images.
export function GalleryEditor({ images = [], onChange }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleFiles(e) {
    const files = [...(e.target.files || [])];
    e.target.value = '';
    if (!files.length) return;
    setError('');
    setBusy(true);
    const added = [];
    try {
      for (const file of files) {
        const dataUrl = await prepareImage(file);
        const { url } = await api.admin.uploadMedia(dataUrl, file.name);
        added.push({ url, caption: '' });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      if (added.length) onChange([...images, ...added]);
      setBusy(false);
    }
  }

  return (
    <div>
      <SortableList
        items={images}
        onChange={onChange}
        emptyText="No gallery images - the course page will show general classroom photos instead."
        renderItem={(img, i, { update, remove }) => (
          <div className="gallery-editor-row">
            <img src={img.url} alt="" />
            <input
              className="form-control"
              value={img.caption || ''}
              placeholder="Caption / alt text (good for SEO)"
              onChange={(e) => update({ ...img, caption: e.target.value })}
              aria-label={`Image ${i + 1} caption`}
            />
            <button type="button" className="icon-btn danger" onClick={remove} aria-label="Remove image">
              <i className="fas fa-trash" />
            </button>
          </div>
        )}
      />
      <button type="button" className="btn btn-sm mt-12" onClick={() => inputRef.current?.click()} disabled={busy}>
        {busy ? <span className="spinner" /> : <><i className="fas fa-images" /> Add Images</>}
      </button>
      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={handleFiles} />
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
