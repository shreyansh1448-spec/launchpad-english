import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';

function toForm(c) {
  return {
    ...c,
    heroSlides: (c.heroSlides || []).map((s) => ({
      type: s.type || 'image',
      heading: s.heading || '',
      subheading: s.subheading || '',
      description: s.description || '',
      highlightsText: (s.highlights || []).join('\n'),
      imageUrl: s.imageUrl || '',
      videoUrl: s.videoUrl || '',
      ctaText: s.ctaText || '',
      ctaSubtext: s.ctaSubtext || '',
      ctaLink: s.ctaLink || '',
    })),
    stats: { coursesCount: 0, ...c.stats },
  };
}

const EMPTY_SLIDE = {
  type: 'image',
  heading: '',
  subheading: '',
  description: '',
  highlightsText: '',
  imageUrl: '',
  videoUrl: '',
  ctaText: '',
  ctaSubtext: '',
  ctaLink: '',
};

export default function AdminSiteContent() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    api.admin
      .getSiteContent()
      .then((c) => setForm(toForm(c)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function setStatsField(key, value) {
    setForm((f) => ({ ...f, stats: { ...f.stats, [key]: value } }));
  }
  function setSocialField(key, value) {
    setForm((f) => ({ ...f, social: { ...f.social, [key]: value } }));
  }

  function addSlide() {
    setForm((f) => ({ ...f, heroSlides: [...f.heroSlides, { ...EMPTY_SLIDE }] }));
  }
  function updateSlide(i, key, value) {
    setForm((f) => {
      const heroSlides = [...f.heroSlides];
      heroSlides[i] = { ...heroSlides[i], [key]: value };
      return { ...f, heroSlides };
    });
  }
  function removeSlide(i) {
    setForm((f) => ({ ...f, heroSlides: f.heroSlides.filter((_, idx) => idx !== i) }));
  }

  // Same base64-data-URL approach as AdminGallery.jsx / AdminHomePage.jsx -
  // no writable filesystem to upload real files to.
  function handleSlideImageUpload(e, i) {
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
      updateSlide(i, 'imageUrl', reader.result);
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

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const heroSlides = form.heroSlides.map((s) => ({
        type: s.type,
        heading: s.heading,
        subheading: s.subheading,
        description: s.description,
        highlights: s.highlightsText.split('\n').map((t) => t.trim()).filter(Boolean),
        imageUrl: s.imageUrl,
        videoUrl: s.videoUrl,
        ctaText: s.ctaText,
        ctaSubtext: s.ctaSubtext,
        ctaLink: s.ctaLink,
      }));
      const payload = {
        siteName: form.siteName,
        tagline: form.tagline,
        aboutTitle: form.aboutTitle,
        aboutText: form.aboutText,
        phone: form.phone,
        whatsapp: form.whatsapp,
        email: form.email,
        address: form.address,
        mapLat: Number(form.mapLat),
        mapLng: Number(form.mapLng),
        mapPlaceUrl: form.mapPlaceUrl,
        workingHours: form.workingHours,
        heroSlides,
        youtubeUrl: form.youtubeUrl,
        stats: {
          studentsCount: Number(form.stats.studentsCount),
          yearsExperience: Number(form.stats.yearsExperience),
          successRate: Number(form.stats.successRate),
          coursesCount: Number(form.stats.coursesCount) || 0,
        },
        social: {
          facebook: form.social?.facebook || '',
          instagram: form.social?.instagram || '',
          linkedin: form.social?.linkedin || '',
          youtube: form.social?.youtube || '',
          x: form.social?.x || '',
        },
      };
      const updated = await api.admin.updateSiteContent(payload);
      setForm(toForm(updated));
      setSavedAt(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) return <p className="muted">Loading site content…</p>;

  return (
    <div>
      <h2>Site Content</h2>
      <p className="muted" style={{ fontSize: 13.5 }}>
        Controls the homepage hero, about section, stats and contact/location details shown across the site.
      </p>
      <form onSubmit={handleSave}>
        {error && <div className="form-alert error">{error}</div>}
        {savedAt && <div className="form-alert success">Saved at {savedAt.toLocaleTimeString()}</div>}

        <div className="grid grid-2">
          <div className="form-group">
            <label>Site Name</label>
            <input className="form-control" value={form.siteName} onChange={(e) => setField('siteName', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Tagline</label>
            <input className="form-control" value={form.tagline} onChange={(e) => setField('tagline', e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label>About Title</label>
          <input className="form-control" value={form.aboutTitle} onChange={(e) => setField('aboutTitle', e.target.value)} />
        </div>
        <div className="form-group">
          <label>About Text</label>
          <textarea className="form-control" rows={4} value={form.aboutText} onChange={(e) => setField('aboutText', e.target.value)} />
        </div>

        <h3 className="mt-24">Contact &amp; Location</h3>
        <div className="grid grid-2">
          <div className="form-group">
            <label>Phone</label>
            <input className="form-control" value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
          </div>
          <div className="form-group">
            <label>WhatsApp (digits only, country code)</label>
            <input className="form-control" value={form.whatsapp} onChange={(e) => setField('whatsapp', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input className="form-control" value={form.email} onChange={(e) => setField('email', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Google Maps Place URL</label>
            <input className="form-control" value={form.mapPlaceUrl} onChange={(e) => setField('mapPlaceUrl', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Map Latitude</label>
            <input className="form-control" type="number" step="any" value={form.mapLat} onChange={(e) => setField('mapLat', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Map Longitude</label>
            <input className="form-control" type="number" step="any" value={form.mapLng} onChange={(e) => setField('mapLng', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Working Hours</label>
            <input className="form-control" value={form.workingHours} onChange={(e) => setField('workingHours', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label>Address</label>
          <textarea className="form-control" rows={2} value={form.address} onChange={(e) => setField('address', e.target.value)} />
        </div>

        <h3 className="mt-24">Social Media Links (leave blank to hide the icon)</h3>
        <div className="grid grid-2">
          <div className="form-group">
            <label>Facebook URL</label>
            <input className="form-control" value={form.social?.facebook || ''} onChange={(e) => setSocialField('facebook', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Instagram URL</label>
            <input className="form-control" value={form.social?.instagram || ''} onChange={(e) => setSocialField('instagram', e.target.value)} />
          </div>
          <div className="form-group">
            <label>LinkedIn URL</label>
            <input className="form-control" value={form.social?.linkedin || ''} onChange={(e) => setSocialField('linkedin', e.target.value)} />
          </div>
          <div className="form-group">
            <label>YouTube URL</label>
            <input className="form-control" value={form.social?.youtube || ''} onChange={(e) => setSocialField('youtube', e.target.value)} />
          </div>
          <div className="form-group">
            <label>X (Twitter) URL</label>
            <input
              className="form-control"
              value={form.social?.x || ''}
              onChange={(e) => setSocialField('x', e.target.value)}
            />
          </div>
        </div>

        <h3 className="mt-24">Stats Strip</h3>
        <div className="grid grid-4">
          <div className="form-group">
            <label>Students Trained</label>
            <input
              className="form-control"
              type="number"
              value={form.stats.studentsCount}
              onChange={(e) => setStatsField('studentsCount', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Years Experience</label>
            <input
              className="form-control"
              type="number"
              value={form.stats.yearsExperience}
              onChange={(e) => setStatsField('yearsExperience', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Success Rate (%)</label>
            <input
              className="form-control"
              type="number"
              value={form.stats.successRate}
              onChange={(e) => setStatsField('successRate', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Specialized Courses</label>
            <input
              className="form-control"
              type="number"
              value={form.stats.coursesCount}
              onChange={(e) => setStatsField('coursesCount', e.target.value)}
            />
            <p className="form-hint">0 = auto-count active courses.</p>
          </div>
        </div>

        <h3 className="mt-24">Hero Slides</h3>
        <p className="muted" style={{ fontSize: 13.5 }}>
          These rotate on the homepage banner, in order.
        </p>
        {uploadError && <div className="form-alert error">{uploadError}</div>}
        {form.heroSlides.map((s, i) => (
          <div className="card mb-12" key={i}>
            <h4>Slide {i + 1}</h4>
            <div className="grid grid-2">
              <div className="form-group">
                <label>Type</label>
                <select className="form-control" value={s.type} onChange={(e) => updateSlide(i, 'type', e.target.value)}>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div className="form-group">
                <label>Heading</label>
                <input className="form-control" value={s.heading} onChange={(e) => updateSlide(i, 'heading', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>Subheading</label>
              <input className="form-control" value={s.subheading} onChange={(e) => updateSlide(i, 'subheading', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                className="form-control"
                rows={2}
                value={s.description}
                onChange={(e) => updateSlide(i, 'description', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Highlights (one per line)</label>
              <textarea
                className="form-control"
                rows={3}
                value={s.highlightsText}
                onChange={(e) => updateSlide(i, 'highlightsText', e.target.value)}
              />
            </div>
            <div className="grid grid-2">
              <div className="form-group">
                <label>Image URL</label>
                {s.imageUrl && (
                  <img
                    src={s.imageUrl}
                    alt=""
                    style={{ display: 'block', width: 140, height: 90, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }}
                  />
                )}
                <input className="form-control" value={s.imageUrl} onChange={(e) => updateSlide(i, 'imageUrl', e.target.value)} />
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="muted" style={{ fontSize: 13 }}>or upload directly:</span>
                  <input type="file" accept="image/*" disabled={uploading} onChange={(e) => handleSlideImageUpload(e, i)} />
                  {uploading && <span className="spinner" />}
                </div>
              </div>
              <div className="form-group">
                <label>Video URL (embed link, only used when Type is Video)</label>
                <input className="form-control" value={s.videoUrl} onChange={(e) => updateSlide(i, 'videoUrl', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-2">
              <div className="form-group">
                <label>CTA Button Text</label>
                <input className="form-control" value={s.ctaText} onChange={(e) => updateSlide(i, 'ctaText', e.target.value)} />
              </div>
              <div className="form-group">
                <label>CTA Link</label>
                <input className="form-control" value={s.ctaLink} onChange={(e) => updateSlide(i, 'ctaLink', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>CTA Subtext (optional, shown under the button)</label>
              <input className="form-control" value={s.ctaSubtext} onChange={(e) => updateSlide(i, 'ctaSubtext', e.target.value)} />
            </div>
            <button type="button" className="btn btn-sm btn-navy" onClick={() => removeSlide(i)}>
              Remove Slide
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-sm mb-24" onClick={addSlide}>
          + Add Slide
        </button>

        <h3 className="mt-24">Classroom Experience Video</h3>
        <div className="form-group">
          <label>YouTube Embed URL</label>
          <input
            className="form-control"
            placeholder="https://www.youtube.com/embed/..."
            value={form.youtubeUrl}
            onChange={(e) => setField('youtubeUrl', e.target.value)}
          />
        </div>

        <p className="form-hint mt-24">
          Batch timings are managed on the <Link to="/admin/batches">Batch Timings</Link> page.
        </p>

        <button className="btn btn-block" disabled={saving}>
          {saving ? <span className="spinner" /> : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
