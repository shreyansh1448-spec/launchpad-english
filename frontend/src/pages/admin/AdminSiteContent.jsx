import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';

export default function AdminSiteContent() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    api.admin
      .getSiteContent()
      .then((c) =>
        setForm({
          ...c,
          heroSlides: JSON.stringify(c.heroSlides || [], null, 2),
          batchTimings: JSON.stringify(c.batchTimings || { onlineWeekday: [], onlineWeekend: [], offlineWeekday: [], offlineWeekend: [] }, null, 2),
          stats: { coursesCount: 0, ...c.stats },
        })
      )
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

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      let heroSlides;
      try {
        heroSlides = JSON.parse(form.heroSlides);
      } catch {
        throw new Error('"Hero Slides JSON" is not valid JSON');
      }
      let batchTimings;
      try {
        batchTimings = JSON.parse(form.batchTimings);
      } catch {
        throw new Error('"Batch Timings JSON" is not valid JSON');
      }
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
        batchTimings,
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
      setForm({
        ...updated,
        heroSlides: JSON.stringify(updated.heroSlides || [], null, 2),
        batchTimings: JSON.stringify(updated.batchTimings || { onlineWeekday: [], onlineWeekend: [], offlineWeekday: [], offlineWeekend: [] }, null, 2),
      });
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

        <div className="form-group">
          <label>
            Hero Slides JSON (array of{' '}
            {'{ type, heading, subheading, description, highlights[], imageUrl, videoUrl, ctaText, ctaSubtext, ctaLink }'})
          </label>
          <textarea
            className="form-control admin-json"
            rows={10}
            value={form.heroSlides}
            onChange={(e) => setField('heroSlides', e.target.value)}
          />
        </div>

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

        <h3 className="mt-24">Batch Timings (shown once sitewide)</h3>
        <div className="form-group">
          <label>Batch Timings JSON ({'{ onlineWeekday, onlineWeekend, offlineWeekday, offlineWeekend: string[] }'})</label>
          <textarea
            className="form-control admin-json"
            rows={8}
            value={form.batchTimings}
            onChange={(e) => setField('batchTimings', e.target.value)}
          />
        </div>

        <button className="btn btn-block" disabled={saving}>
          {saving ? <span className="spinner" /> : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
