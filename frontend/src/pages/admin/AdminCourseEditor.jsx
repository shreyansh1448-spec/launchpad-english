import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../api.js';
import RichTextEditor from '../../components/RichTextEditor.jsx';
import CourseDetailView from '../../components/CourseDetailView.jsx';
import BatchManager from '../../admin/BatchManager.jsx';
import { StringListEditor, CurriculumManager, FaqEditor } from '../../admin/ListEditors.jsx';
import { ImageField, GalleryEditor } from '../../admin/ImageField.jsx';
import useSiteContent from '../../hooks/useSiteContent.js';
import { videoEmbed } from '../../lib/video.js';
import {
  MODES,
  MODE_META,
  coursePath,
  courseJsonLd,
  courseSeo,
  discountPct,
  formatPrice,
} from '../../../shared/course.js';

const TABS = [
  { id: 'basic', label: 'Course Info', icon: 'fa-circle-info' },
  { id: 'pricing', label: 'Modes & Pricing', icon: 'fa-indian-rupee-sign' },
  { id: 'content', label: 'Content', icon: 'fa-align-left' },
  { id: 'features', label: 'Features', icon: 'fa-list-check' },
  { id: 'curriculum', label: 'Curriculum', icon: 'fa-layer-group' },
  { id: 'media', label: 'Media', icon: 'fa-image' },
  { id: 'batches', label: 'Batches', icon: 'fa-clock' },
  { id: 'faqs', label: 'FAQs', icon: 'fa-circle-question' },
  { id: 'seo', label: 'SEO', icon: 'fa-magnifying-glass' },
];

const DETAIL_FIELDS = [
  ['numClasses', 'Number of Classes', 'e.g. 60 live classes'],
  ['classDuration', 'Class Duration', 'e.g. 2 hours per class'],
  ['assessments', 'Assessments', 'e.g. Weekly assessments with feedback'],
  ['mockTests', 'Mock Tests', 'e.g. 2 full-length mock exams'],
  ['studyMaterial', 'Study Material', 'e.g. Cambridge books + grammar notes'],
  ['certificate', 'Certificate', 'e.g. Course completion certificate'],
];

const FEATURE_SUGGESTIONS = ['Live Classes', 'Personalized Feedback', 'Weekly Tests', 'Study Material', 'Certificate', 'Speaking Practice', 'Small Batches', 'Doubt-Clearing Sessions'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Beginner to Advanced', 'Exam Preparation', 'All Levels'];
const DEFAULT_CATEGORIES = ['Spoken English', 'Exam Preparation', 'Business English', 'General English'];
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const BLANK_MODE_SEO = { title: '', description: '', focusKeyword: '', ogTitle: '', ogDescription: '', ogImage: '', canonical: '' };

const BLANK = {
  title: '',
  slug: '',
  category: '',
  tagline: '',
  shortDescription: '',
  fullDescription: '',
  duration: '',
  level: '',
  overview: '',
  highlights: [],
  whoShouldJoin: [],
  syllabus: [],
  dailyPattern: [],
  outcomes: [],
  faqs: [],
  details: {},
  images: [],
  thumbnail: '',
  heroImage: '',
  promoVideo: '',
  instructor: {},
  modes: { online: true, offline: true },
  pricing: { online: { mrp: '', offer: '' }, offline: { mrp: '', offer: '' } },
  currency: 'INR',
  modeContent: {},
  seo: {},
  displayOrder: 0,
  active: false,
  featured: true,
};

// While typing: slugify but keep one trailing hyphen so "ielts-" can become "ielts-prep".
function slugInput(text) {
  return slugify(text.replace(/\s/g, '-')) + (/[-\s]$/.test(text) ? '-' : '');
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// API course -> editor form (every nested object present, so inputs are controlled).
function toForm(course) {
  const f = { ...BLANK, ...course };
  f.modes = { ...BLANK.modes, ...(course.modes || {}) };
  f.pricing = {
    online: { ...BLANK.pricing.online, ...(course.pricing?.online || {}) },
    offline: { ...BLANK.pricing.offline, ...(course.pricing?.offline || {}) },
  };
  f.details = Object.fromEntries(DETAIL_FIELDS.map(([k]) => [k, course.details?.[k] || '']));
  f.instructor = { name: '', title: '', bio: '', image: '', ...(course.instructor || {}) };
  f.modeContent = {
    online: { headline: '', intro: '', ...(course.modeContent?.online || {}) },
    offline: { headline: '', intro: '', ...(course.modeContent?.offline || {}) },
  };
  f.seo = {
    online: { ...BLANK_MODE_SEO, ...(course.seo?.online || {}) },
    offline: { ...BLANK_MODE_SEO, ...(course.seo?.offline || {}) },
    customSchema: course.seo?.customSchema || '',
  };
  return f;
}

const cleanList = (list) => (list || []).map((s) => String(s).trim()).filter(Boolean);

// Editor form -> API payload (trimmed, empty rows dropped, numbers as numbers).
function toPayload(f) {
  return {
    title: f.title.trim(),
    slug: f.slug.trim(),
    category: f.category.trim(),
    tagline: f.tagline.trim(),
    shortDescription: f.shortDescription.trim(),
    fullDescription: f.fullDescription === '<br>' ? '' : f.fullDescription,
    duration: f.duration.trim(),
    level: f.level.trim(),
    overview: f.overview.trim(),
    highlights: cleanList(f.highlights),
    whoShouldJoin: cleanList(f.whoShouldJoin),
    dailyPattern: cleanList(f.dailyPattern),
    outcomes: cleanList(f.outcomes),
    syllabus: f.syllabus
      .map((m) => ({ module: m.module.trim(), points: cleanList(m.points) }))
      .filter((m) => m.module || m.points.length),
    faqs: f.faqs.map((q) => ({ q: q.q.trim(), a: q.a.trim() })).filter((q) => q.q || q.a),
    details: Object.fromEntries(Object.entries(f.details).map(([k, v]) => [k, String(v).trim()])),
    images: f.images.filter((i) => i.url),
    thumbnail: f.thumbnail,
    heroImage: f.heroImage,
    promoVideo: f.promoVideo.trim(),
    instructor: f.instructor,
    modes: f.modes,
    pricing: {
      online: { mrp: Number(f.pricing.online.mrp) || 0, offer: Number(f.pricing.online.offer) || 0 },
      offline: { mrp: Number(f.pricing.offline.mrp) || 0, offer: Number(f.pricing.offline.offer) || 0 },
    },
    currency: f.currency,
    modeContent: f.modeContent,
    seo: f.seo,
    displayOrder: Number(f.displayOrder) || 0,
    active: !!f.active,
    featured: !!f.featured,
  };
}

// Mirrors the server's checks so problems show up next to the right tab.
function validate(p) {
  if (!p.title) return { tab: 'basic', error: 'Course name is required.' };
  if (!SLUG_RE.test(p.slug)) return { tab: 'basic', error: 'URL slug may only contain lowercase letters, numbers and hyphens.' };
  for (const m of MODES) {
    const pr = p.pricing[m];
    if (pr.mrp > 0 && pr.offer > pr.mrp) return { tab: 'pricing', error: `${MODE_META[m].label} sale price can't be higher than the original price.` };
  }
  if (p.seo.customSchema) {
    try {
      JSON.parse(p.seo.customSchema);
    } catch {
      return { tab: 'seo', error: 'Custom schema must be valid JSON.' };
    }
  }
  if (p.active) {
    if (!p.modes.online && !p.modes.offline) return { tab: 'pricing', error: 'Turn on Online and/or Offline before publishing.' };
    if (!p.duration) return { tab: 'basic', error: 'Add the course duration before publishing.' };
    for (const m of MODES) {
      if (p.modes[m] && !(p.pricing[m].offer > 0)) return { tab: 'pricing', error: `Set the ${m} sale price before publishing.` };
    }
  }
  return null;
}

// Label + control + hint. The first child control gets an id so the label
// is properly associated (screen readers, click-to-focus).
function Field({ label, hint, children, count, max }) {
  const id = useId();
  const kids = React.Children.toArray(children);
  const first = kids[0];
  const linkable = label && React.isValidElement(first) && ['input', 'textarea', 'select'].includes(first.type);
  if (linkable) kids[0] = React.cloneElement(first, { id: first.props.id || id });
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={linkable ? kids[0].props.id : undefined}>
          {label}
          {max ? <span className={`char-count ${count > max ? 'over' : ''}`}>{count}/{max}</span> : null}
        </label>
      )}
      {kids}
      {hint && <p className="form-hint">{hint}</p>}
    </div>
  );
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track" aria-hidden="true" />
      <span>
        <strong>{label}</strong>
        {description && <span className="toggle-desc">{description}</span>}
      </span>
    </label>
  );
}

export default function AdminCourseEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const siteContent = useSiteContent();
  const isNew = !id;

  const [form, setForm] = useState(isNew ? toForm(BLANK) : null);
  const [saved, setSaved] = useState(isNew ? JSON.stringify(toPayload(toForm(BLANK))) : '');
  const [loadError, setLoadError] = useState('');
  const [allCourses, setAllCourses] = useState([]);
  const [tab, setTab] = useState('basic');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null); // { tab, error }
  const [notice, setNotice] = useState(location.state?.notice || '');
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [previewBatches, setPreviewBatches] = useState([]);
  const loadedId = useRef(null);

  const previewMode = params.get('preview');

  useEffect(() => {
    api.admin.listCourses().then(setAllCourses).catch(() => {});
  }, []);

  useEffect(() => {
    if (isNew) {
      loadedId.current = null;
      return;
    }
    if (loadedId.current === id) return;
    setForm(null);
    api.admin
      .getCourse(id)
      .then((c) => {
        loadedId.current = id;
        const f = toForm(c);
        setForm(f);
        setSaved(JSON.stringify(toPayload(f)));
      })
      .catch((err) => setLoadError(err.message));
  }, [id, isNew]);

  useEffect(() => {
    if (!previewMode) return;
    api.admin
      .listBatches()
      .then((all) => setPreviewBatches(all.filter((b) => !b.courseId || b.courseId === id)))
      .catch(() => setPreviewBatches([]));
  }, [previewMode, id]);

  // Any edit clears a previous validation/save error.
  useEffect(() => setError(null), [form]);

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(''), 6000);
    return () => clearTimeout(t);
  }, [notice]);

  const payload = useMemo(() => (form ? toPayload(form) : null), [form]);
  const dirty = payload && JSON.stringify(payload) !== saved;

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const categories = useMemo(
    () => [...new Set([...DEFAULT_CATEGORIES, ...allCourses.map((c) => c.category).filter(Boolean)])],
    [allCourses]
  );

  if (loadError) {
    return (
      <div className="cms-page">
        <div className="form-alert error">{loadError}</div>
        <Link className="btn btn-sm" to="/admin/courses">
          Back to Courses
        </Link>
      </div>
    );
  }
  if (!form) return <p className="muted cms-page">Loading course…</p>;

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setIn = (key, sub, value) => setForm((f) => ({ ...f, [key]: { ...f[key], [sub]: value } }));
  const setMode = (key, mode, sub, value) =>
    setForm((f) => ({ ...f, [key]: { ...f[key], [mode]: { ...f[key][mode], [sub]: value } } }));

  async function save(active = form.active) {
    const body = { ...toPayload(form), active };
    const problem = validate(body);
    if (problem) {
      setError(problem);
      setTab(problem.tab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSaving(true);
    setError(null);
    setNotice('');
    try {
      const result = isNew ? await api.admin.createCourse(body) : await api.admin.updateCourse(id, body);
      const f = toForm(result);
      setForm(f);
      setSaved(JSON.stringify(toPayload(f)));
      const message = result.active
        ? isNew || !form.active
          ? 'Published! The course pages are now live.'
          : 'Saved - the live pages are updated.'
        : 'Saved as draft (not visible on the website).';
      setNotice(message);
      // New course -> its own edit URL (a different route, so the editor remounts).
      if (isNew) navigate(`/admin/courses/${result._id}`, { replace: true, state: { notice: message } });
    } catch (err) {
      setError({ tab, error: err.message });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  }

  function openPreview(mode) {
    const next = new URLSearchParams(params);
    next.set('preview', mode);
    setParams(next, { replace: true });
  }
  function closePreview() {
    const next = new URLSearchParams(params);
    next.delete('preview');
    setParams(next, { replace: true });
  }

  const offered = MODES.filter((m) => form.modes[m]);
  const origin = window.location.origin;

  return (
    <div className="cms-page course-editor">
      {/* ---------- sticky action bar ---------- */}
      <div className="editor-bar">
        <Link
          to="/admin/courses"
          className="icon-btn"
          aria-label="Back to courses"
          onClick={(e) => {
            if (dirty && !window.confirm('You have unsaved changes. Leave without saving?')) e.preventDefault();
          }}
        >
          <i className="fas fa-arrow-left" />
        </Link>
        <div className="editor-bar-title">
          <h1>{isNew ? 'Add New Course' : form.title || 'Untitled course'}</h1>
          <span className={form.active ? 'badge-success' : 'badge-muted'}>{form.active ? 'Published' : 'Draft'}</span>
          {dirty && <span className="unsaved-dot">Unsaved changes</span>}
        </div>
        <div className="editor-bar-actions">
          <button type="button" className="btn btn-sm btn-outline" onClick={() => openPreview(offered[0] || 'online')}>
            <i className="fas fa-eye" /> Preview
          </button>
          {form.active ? (
            <>
              <button type="button" className="btn btn-sm btn-outline" disabled={saving} onClick={() => save(false)}>
                Unpublish
              </button>
              <button type="button" className="btn btn-sm" disabled={saving || (!dirty && !isNew)} onClick={() => save(true)}>
                {saving ? <span className="spinner" /> : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-sm btn-outline" disabled={saving} onClick={() => save(false)}>
                {saving ? <span className="spinner" /> : 'Save Draft'}
              </button>
              <button type="button" className="btn btn-sm btn-success" disabled={saving} onClick={() => save(true)}>
                <i className="fas fa-upload" /> Publish
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="form-alert error">
          {error.error}{' '}
          {error.tab !== tab && (
            <button type="button" className="btn-link" onClick={() => setTab(error.tab)}>
              Go to {TABS.find((t) => t.id === error.tab)?.label}
            </button>
          )}
        </div>
      )}
      {notice && (
        <div className="editor-toast" role="status">
          <i className="fas fa-circle-check" /> {notice}{' '}
          {form.active &&
            offered.map((m) => (
              <a key={m} className="btn-link" href={coursePath(m, form.slug)} target="_blank" rel="noreferrer">
                View {MODE_META[m].label} page ↗
              </a>
            ))}
          <button type="button" className="icon-btn" onClick={() => setNotice('')} aria-label="Dismiss">
            <i className="fas fa-xmark" />
          </button>
        </div>
      )}

      <div className="editor-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`editor-tab ${tab === t.id ? 'active' : ''} ${error?.tab === t.id ? 'has-error' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <i className={`fas ${t.icon}`} /> {t.label}
          </button>
        ))}
      </div>

      <div className="editor-body">
        {/* ---------- Course Info ---------- */}
        {tab === 'basic' && (
          <div className="admin-panel">
            <h2>Course Information</h2>
            <div className="form-grid">
              <Field label="Course Name *">
                <input
                  className="form-control"
                  value={form.title}
                  placeholder="e.g. IELTS Preparation Course"
                  onChange={(e) => {
                    const title = e.target.value;
                    setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }));
                  }}
                />
              </Field>
              <Field label="URL Slug *" hint={`Pages: ${coursePath('online', form.slug || 'your-course')} and ${coursePath('offline', form.slug || 'your-course')}`}>
                <input
                  className="form-control"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set('slug', slugInput(e.target.value));
                  }}
                />
              </Field>
              <Field label="Category">
                <input className="form-control" value={form.category} list="course-categories" placeholder="Choose or type a new one" onChange={(e) => set('category', e.target.value)} />
                <datalist id="course-categories">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Field>
              <Field label="Level">
                <input className="form-control" value={form.level} list="course-levels" placeholder="e.g. Beginner" onChange={(e) => set('level', e.target.value)} />
                <datalist id="course-levels">
                  {LEVELS.map((l) => (
                    <option key={l} value={l} />
                  ))}
                </datalist>
              </Field>
              <Field label="Duration *" hint="Shown on cards and the course page, e.g. 12 Weeks.">
                <input className="form-control" value={form.duration} placeholder="e.g. 12 Weeks" onChange={(e) => set('duration', e.target.value)} />
              </Field>
              <Field label="Display Order" hint="Lower numbers appear first.">
                <input className="form-control" type="number" value={form.displayOrder} onChange={(e) => set('displayOrder', e.target.value)} />
              </Field>
            </div>

            <Field label="Headline" hint="The short, powerful line under the course name." count={form.tagline.length} max={120}>
              <input className="form-control" value={form.tagline} placeholder="e.g. Professional 12-week IELTS coaching to help you achieve Band 7-9" onChange={(e) => set('tagline', e.target.value)} />
            </Field>
            <Field label="Short Description" hint="Used on course cards and as the page intro." count={form.shortDescription.length} max={200}>
              <textarea className="form-control" rows={2} value={form.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} />
            </Field>
            <Field label="Full Description" hint="The main 'Course Overview' section of the page.">
              <RichTextEditor value={form.fullDescription} onChange={(v) => set('fullDescription', v)} />
            </Field>

            <Toggle
              checked={form.featured}
              onChange={(v) => set('featured', v)}
              label="Show on Home page"
              description="Appears in the Home page's Learn Online / Learn Offline sections."
            />
          </div>
        )}

        {/* ---------- Modes & Pricing ---------- */}
        {tab === 'pricing' && (
          <div className="admin-panel">
            <h2>Modes &amp; Pricing</h2>
            <p className="muted">
              Turn on the modes this course is sold in. Each mode gets its own page, listing, price and batches. Prices here are used everywhere - cards,
              course page, checkout, the Razorpay charge and Google structured data.
            </p>
            <div className="mode-cards">
              {MODES.map((m) => {
                const p = form.pricing[m];
                const disc = discountPct(p.mrp, p.offer);
                return (
                  <div className={`mode-card ${form.modes[m] ? 'on' : 'off'}`} key={m}>
                    <Toggle
                      checked={form.modes[m]}
                      onChange={(v) => setIn('modes', m, v)}
                      label={`${MODE_META[m].label} course`}
                      description={form.modes[m] ? `Live at ${coursePath(m, form.slug || '…')}` : `Not offered ${m}`}
                    />
                    {form.modes[m] && (
                      <>
                        <div className="form-grid form-grid-2">
                          <Field label="Original Price (₹)">
                            <input className="form-control" type="number" min="0" value={p.mrp} onChange={(e) => setMode('pricing', m, 'mrp', e.target.value)} />
                          </Field>
                          <Field label="Sale Price (₹) *">
                            <input className="form-control" type="number" min="0" value={p.offer} onChange={(e) => setMode('pricing', m, 'offer', e.target.value)} />
                          </Field>
                        </div>
                        <div className="price-preview">
                          {Number(p.offer) > 0 ? (
                            <>
                              {disc > 0 && <s>{formatPrice(p.mrp)}</s>} <strong>{formatPrice(p.offer)}</strong>
                              {disc > 0 && <span className="discount-mini">{disc}% OFF</span>}
                              <span className="muted"> - discount is calculated automatically</span>
                            </>
                          ) : (
                            <span className="muted">Enter a sale price</span>
                          )}
                        </div>
                        <Field label={`${MODE_META[m].label} page headline (optional)`} hint="Leave blank to use the main headline. A unique line per mode helps SEO.">
                          <input className="form-control" value={form.modeContent[m].headline} placeholder={form.tagline} onChange={(e) => setMode('modeContent', m, 'headline', e.target.value)} />
                        </Field>
                        <Field label={`${MODE_META[m].label} page intro (optional)`}>
                          <textarea
                            className="form-control"
                            rows={2}
                            value={form.modeContent[m].intro}
                            placeholder={m === 'online' ? 'e.g. Live interactive classes you can join from anywhere…' : 'e.g. Classroom coaching at our Green Park campus…'}
                            onChange={(e) => setMode('modeContent', m, 'intro', e.target.value)}
                          />
                        </Field>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            <Field label="Currency">
              <select className="form-control form-control-narrow" value={form.currency} onChange={(e) => set('currency', e.target.value)}>
                <option value="INR">INR (₹)</option>
              </select>
            </Field>
          </div>
        )}

        {/* ---------- Content ---------- */}
        {tab === 'content' && (
          <div className="admin-panel">
            <h2>Course Content</h2>
            <Field label="Course Overview (plain summary)" hint="Short plain-text summary - used where rich text can't be shown.">
              <textarea className="form-control" rows={3} value={form.overview} onChange={(e) => set('overview', e.target.value)} />
            </Field>
            <h3>What Students Will Learn</h3>
            <StringListEditor items={form.outcomes} onChange={(v) => set('outcomes', v)} placeholder="e.g. Master IELTS strategies and time management" />
            <h3 className="mt-24">Who Should Join</h3>
            <StringListEditor items={form.whoShouldJoin} onChange={(v) => set('whoShouldJoin', v)} placeholder="e.g. Students applying to study abroad" />
            <h3 className="mt-24">Daily Class Structure</h3>
            <StringListEditor items={form.dailyPattern} onChange={(v) => set('dailyPattern', v)} placeholder="e.g. Speaking - 30 Minutes" />
            <h3 className="mt-24">Course Details</h3>
            <p className="form-hint">Only filled-in rows are shown on the page.</p>
            <div className="form-grid">
              {DETAIL_FIELDS.map(([key, label, ph]) => (
                <Field label={label} key={key}>
                  <input className="form-control" value={form.details[key]} placeholder={ph} onChange={(e) => setIn('details', key, e.target.value)} />
                </Field>
              ))}
            </div>
          </div>
        )}

        {/* ---------- Features ---------- */}
        {tab === 'features' && (
          <div className="admin-panel">
            <h2>Course Features</h2>
            <p className="muted">The first 3-4 appear on course cards; all of them appear on the course page. Drag to reorder.</p>
            <StringListEditor items={form.highlights} onChange={(v) => set('highlights', v)} placeholder="e.g. Live Classes" addLabel="Add Feature" suggestions={FEATURE_SUGGESTIONS} />
          </div>
        )}

        {/* ---------- Curriculum ---------- */}
        {tab === 'curriculum' && (
          <div className="admin-panel">
            <h2>Curriculum</h2>
            <p className="muted">Add modules and their topics. Drag the ⋮⋮ handle (or use the arrows) to reorder modules or topics.</p>
            <CurriculumManager modules={form.syllabus} onChange={(v) => set('syllabus', v)} />
          </div>
        )}

        {/* ---------- Media ---------- */}
        {tab === 'media' && (
          <div className="admin-panel">
            <h2>Images &amp; Video</h2>
            <div className="form-grid form-grid-2">
              <ImageField label="Course Thumbnail" hint="Used on course cards. Landscape, at least 800×500." value={form.thumbnail} onChange={(v) => set('thumbnail', v)} />
              <ImageField label="Hero Image" hint="Large image at the top of the course page (falls back to the thumbnail)." value={form.heroImage} onChange={(v) => set('heroImage', v)} />
            </div>
            <Field label="Promotional Video" hint="YouTube, Vimeo or .mp4 link - replaces the hero image when set.">
              <input className="form-control" value={form.promoVideo} placeholder="https://www.youtube.com/watch?v=…" onChange={(e) => set('promoVideo', e.target.value)} />
              {form.promoVideo && !videoEmbed(form.promoVideo) && <p className="form-error">This link isn't a supported video.</p>}
            </Field>
            <h3 className="mt-24">Gallery Images</h3>
            <GalleryEditor images={form.images} onChange={(v) => set('images', v)} />

            <h3 className="mt-24">Trainer / Instructor</h3>
            <div className="form-grid form-grid-2">
              <div>
                <Field label="Name">
                  <input className="form-control" value={form.instructor.name} onChange={(e) => setIn('instructor', 'name', e.target.value)} />
                </Field>
                <Field label="Title">
                  <input className="form-control" value={form.instructor.title} placeholder="e.g. Senior IELTS Trainer, 15+ years" onChange={(e) => setIn('instructor', 'title', e.target.value)} />
                </Field>
                <Field label="Short Bio">
                  <textarea className="form-control" rows={3} value={form.instructor.bio} onChange={(e) => setIn('instructor', 'bio', e.target.value)} />
                </Field>
              </div>
              <ImageField label="Instructor Photo" aspect="square" value={form.instructor.image} onChange={(v) => setIn('instructor', 'image', v)} />
            </div>

            {!isNew && <ResourcesManager courseId={id} />}
          </div>
        )}

        {/* ---------- Batches ---------- */}
        {tab === 'batches' && (
          <div className="admin-panel">
            <h2>Batch Timings for This Course</h2>
            <p className="muted">
              Batches added here are only for this course. Time slots shared by every course are managed on the{' '}
              <Link to="/admin/batches">Batch Timings</Link> page and appear here automatically.
            </p>
            {isNew ? <p className="form-alert warning">Save the course (as a draft is fine) to add course-specific batches.</p> : <BatchManager courseId={id} courses={allCourses} />}
          </div>
        )}

        {/* ---------- FAQs ---------- */}
        {tab === 'faqs' && (
          <div className="admin-panel">
            <h2>Course FAQs</h2>
            <FaqEditor faqs={form.faqs} onChange={(v) => set('faqs', v)} />
          </div>
        )}

        {/* ---------- SEO ---------- */}
        {tab === 'seo' && <SeoPanel form={form} setForm={setForm} origin={origin} onSlug={(v) => {
              setSlugTouched(true);
              set('slug', slugInput(v));
            }} />}
      </div>

      {previewMode && (
        <div className="preview-overlay" role="dialog" aria-modal="true" aria-label="Course preview">
          <div className="preview-bar">
            <strong>Preview</strong>
            <span className="muted">{dirty ? 'Showing your unsaved changes' : 'Showing the saved version'}</span>
            <div className="segmented">
              {(offered.length ? offered : ['online']).map((m) => (
                <button key={m} type="button" className={previewMode === m ? 'active' : ''} onClick={() => openPreview(m)}>
                  {MODE_META[m].label}
                </button>
              ))}
            </div>
            <button type="button" className="btn btn-sm" onClick={closePreview}>
              Close Preview
            </button>
          </div>
          <div className="preview-body">
            <CourseDetailView course={{ ...payload, batches: previewBatches, resources: [] }} mode={MODES.includes(previewMode) ? previewMode : 'online'} siteContent={siteContent} preview />
          </div>
        </div>
      )}
    </div>
  );
}

function SeoPanel({ form, setForm, origin, onSlug }) {
  const [mode, setMode] = useState(form.modes.offline && !form.modes.online ? 'offline' : 'online');
  const s = form.seo[mode];
  const setSeo = (key, value) => setForm((f) => ({ ...f, seo: { ...f.seo, [mode]: { ...f.seo[mode], [key]: value } } }));
  // What the page will actually use (admin values, else auto-generated).
  const course = toPayload(form);
  const auto = courseSeo({ ...course, seo: {} }, mode, origin);
  const effective = courseSeo(course, mode, origin);
  let schemaError = '';
  if (form.seo.customSchema) {
    try {
      JSON.parse(form.seo.customSchema);
    } catch {
      schemaError = 'Not valid JSON yet.';
    }
  }

  return (
    <div className="admin-panel">
      <h2>SEO</h2>
      <p className="muted">
        Every field is optional - blank fields are generated automatically from the course content (shown as grey placeholder text). Online and offline pages
        have separate SEO so each can rank for its own searches.
      </p>
      <Field label="URL Slug" hint="Changing it keeps the old URL working with a permanent redirect.">
        <input className="form-control" value={form.slug} onChange={(e) => onSlug(e.target.value)} />
      </Field>

      <div className="segmented mb-16">
        {MODES.map((m) => (
          <button key={m} type="button" className={mode === m ? 'active' : ''} onClick={() => setMode(m)}>
            {MODE_META[m].label} page
          </button>
        ))}
      </div>

      <div className="serp-preview" aria-label="Google search preview">
        <span className="serp-url">{effective.canonical}</span>
        <span className="serp-title">{effective.title}</span>
        <span className="serp-desc">{effective.description}</span>
      </div>

      <div className="form-grid form-grid-2">
        <Field label="SEO Title" count={(s.title || auto.title).length} max={60}>
          <input className="form-control" value={s.title} placeholder={auto.title} onChange={(e) => setSeo('title', e.target.value)} />
        </Field>
        <Field label="Focus Keyword">
          <input className="form-control" value={s.focusKeyword} placeholder={mode === 'online' ? 'e.g. online ielts coaching' : 'e.g. ielts coaching in south delhi'} onChange={(e) => setSeo('focusKeyword', e.target.value)} />
        </Field>
      </div>
      <Field label="Meta Description" count={(s.description || auto.description).length} max={160}>
        <textarea className="form-control" rows={2} value={s.description} placeholder={auto.description} onChange={(e) => setSeo('description', e.target.value)} />
      </Field>
      <div className="form-grid form-grid-2">
        <Field label="OG Title (social sharing)">
          <input className="form-control" value={s.ogTitle} placeholder={effective.title} onChange={(e) => setSeo('ogTitle', e.target.value)} />
        </Field>
        <Field label="Canonical URL" hint="Only change this if another URL should rank instead.">
          <input className="form-control" value={s.canonical} placeholder={auto.canonical} onChange={(e) => setSeo('canonical', e.target.value)} />
        </Field>
      </div>
      <Field label="OG Description">
        <textarea className="form-control" rows={2} value={s.ogDescription} placeholder={effective.description} onChange={(e) => setSeo('ogDescription', e.target.value)} />
      </Field>
      <ImageField label="OG Image (social sharing, 1200×630)" hint="Falls back to the hero image, then the thumbnail." value={s.ogImage} onChange={(v) => setSeo('ogImage', v)} />

      <h3 className="mt-24">Structured Data (Schema)</h3>
      <p className="form-hint">Course, FAQ and Breadcrumb schema are generated automatically from this course. Add extra JSON-LD below if needed.</p>
      <details className="schema-preview">
        <summary>View generated schema for the {MODE_META[mode].label.toLowerCase()} page</summary>
        <pre>{JSON.stringify(courseJsonLd({ ...course, seo: { ...course.seo, customSchema: '' } }, mode, origin), null, 2)}</pre>
      </details>
      <Field label="Custom Schema (JSON-LD, optional)">
        <textarea
          className="form-control code-input"
          rows={5}
          value={form.seo.customSchema}
          placeholder='{"@context": "https://schema.org", "@type": "Event", ...}'
          onChange={(e) => setForm((f) => ({ ...f, seo: { ...f.seo, customSchema: e.target.value } }))}
        />
        {schemaError && <p className="form-error">{schemaError}</p>}
      </Field>
    </div>
  );
}

function ResourcesManager({ courseId }) {
  const [resources, setResources] = useState([]);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    api.admin.getCourse(courseId).then((c) => setResources(c.resources || [])).catch(() => {});
  }, [courseId]);

  async function upload() {
    setError('');
    if (!title || !file) return setError('Pick a PDF and give it a title first');
    setBusy(true);
    try {
      const updated = await api.admin.uploadResource(courseId, title, file);
      setResources(updated.resources);
      setTitle('');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(r) {
    if (!window.confirm(`Remove "${r.title}"?`)) return;
    try {
      const updated = await api.admin.deleteResource(courseId, r._id);
      setResources(updated.resources);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <h3 className="mt-24">Downloadable PDFs</h3>
      <p className="form-hint">Brochure, syllabus PDF, sample notes… downloadable from the course page. Saved immediately (max 3MB each).</p>
      {error && <div className="form-alert error">{error}</div>}
      {resources.map((r) => (
        <div className="list-editor-row resource-row" key={r._id}>
          <i className="far fa-file-pdf" />
          <a href={r.url} target="_blank" rel="noreferrer">
            {r.title}
          </a>
          <button type="button" className="icon-btn danger" onClick={() => remove(r)} aria-label="Remove PDF">
            <i className="fas fa-trash" />
          </button>
        </div>
      ))}
      <div className="list-editor-add">
        <input className="form-control" placeholder="PDF title, e.g. Course Brochure" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input ref={fileRef} className="form-control" type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files[0] || null)} />
        <button type="button" className="btn btn-sm" onClick={upload} disabled={busy}>
          {busy ? <span className="spinner" /> : 'Upload PDF'}
        </button>
      </div>
    </>
  );
}
