import React, { useEffect, useState } from 'react';
import { api, resolveMediaUrl } from '../api.js';
import { LightboxVideo } from '../components/Gallery.jsx';

const SECTIONS = [
  { key: 'classroom', label: 'Classroom' },
  { key: 'event', label: 'Events' },
  { key: 'student', label: 'Students' },
  { key: 'certificate', label: 'Certificates' },
  { key: 'other', label: 'More' },
];

// The full, unlimited gallery - every photo grouped into its own section by
// category. Linked from the Home page's gallery teaser (which only shows a
// handful of photos per category).
export default function GalleryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    api
      .getGallery()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const groups = SECTIONS.map((s) => ({ ...s, items: items.filter((i) => i.category === s.key) })).filter(
    (s) => s.items.length > 0
  );

  return (
    <>
      <div className="page-hero">
        <div className="container">
          <h1>Full Gallery</h1>
          <p>Every classroom session, event, student moment and certificate - straight from our database.</p>
        </div>
      </div>

      {loading ? (
        <section className="section">
          <div className="container">
            <p className="muted center">Loading gallery…</p>
          </div>
        </section>
      ) : groups.length === 0 ? (
        <section className="section">
          <div className="container">
            <p className="muted center">No photos yet.</p>
          </div>
        </section>
      ) : (
        groups.map((group) => (
          <section className="section" key={group.key}>
            <div className="container">
              <div className="section-head">
                <h2>{group.label}</h2>
                <p className="muted">{group.items.length} photos</p>
              </div>
              <div className="gallery-grid">
                {group.items.map((item) => (
                  <div className="gallery-item" key={item._id} onClick={() => setLightbox(item)}>
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
            </div>
          </section>
        ))
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
    </>
  );
}
