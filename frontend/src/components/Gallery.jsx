import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, resolveMediaUrl } from '../api.js';

const CATEGORIES = [
  { key: '', label: 'All' },
  { key: 'classroom', label: 'Classroom' },
  { key: 'event', label: 'Events' },
  { key: 'student', label: 'Students' },
  { key: 'certificate', label: 'Certificates' },
];

// Every photo here comes from GET /api/gallery, i.e. the Gallery collection
// in MongoDB - adding, replacing or removing a photo is a database change
// (via the admin routes) that shows up here immediately.
// `limit` caps how many photos are shown here (used for the Home page
// teaser) - the full, unlimited gallery lives at /gallery.
export default function Gallery({ limit }) {
  const [category, setCategory] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getGallery(category)
      .then((data) => !cancelled && setItems(data))
      .catch(() => !cancelled && setItems([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [category]);

  const shown = limit ? items.slice(0, limit) : items;

  return (
    <div>
      <div className="gallery-tabs">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={`gallery-tab ${category === c.key ? 'active' : ''}`}
            onClick={() => setCategory(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="muted center">Loading gallery…</p>
      ) : items.length === 0 ? (
        <p className="muted center">No photos in this category yet.</p>
      ) : (
        <div className="gallery-grid">
          {shown.map((item) => (
            <div
              className={`gallery-item ${item.category === 'classroom' ? 'gallery-item-lg' : ''}`}
              key={item._id}
              onClick={() => setLightbox(item)}
            >
              {item.imageUrl && <img src={resolveMediaUrl(item.imageUrl)} alt={item.title || 'Launch Pad English'} loading="lazy" />}
              {item.mediaType === 'video' && (
                <div className={`gallery-play-badge ${item.imageUrl ? '' : 'gallery-play-badge-solo'}`}>▶</div>
              )}
              {item.title && (
                <div className="gallery-overlay">
                  <h4>{item.title}</h4>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {limit && items.length > limit && (
        <div className="center mt-24">
          <Link className="btn btn-navy btn-sm" to="/gallery">
            View Full Gallery ({items.length} photos)
          </Link>
        </div>
      )}

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <button className="lightbox-close" onClick={() => setLightbox(null)} aria-label="Close">
            ✕
          </button>
          {lightbox.mediaType === 'video' ? (
            <div onClick={(e) => e.stopPropagation()}>
              <LightboxVideo url={lightbox.videoUrl} title={lightbox.title} />
            </div>
          ) : (
            <img src={resolveMediaUrl(lightbox.imageUrl)} alt={lightbox.title || 'Launch Pad English'} />
          )}
          {lightbox.title && <div className="lightbox-caption">{lightbox.title}</div>}
        </div>
      )}
    </div>
  );
}

// YouTube embed URLs render in an iframe; anything else (a direct .mp4 URL,
// whether external or a backend upload) plays with the native HTML5 video
// player.
export function LightboxVideo({ url, title }) {
  const isYoutube = /youtube\.com|youtu\.be/.test(url || '');
  if (isYoutube) {
    return (
      <iframe
        className="lightbox-video"
        src={url}
        title={title || 'Video'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  return <video className="lightbox-video" src={resolveMediaUrl(url)} controls autoPlay />;
}
