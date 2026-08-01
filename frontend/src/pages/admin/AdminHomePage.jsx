import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';

// Mirrors the fallback copy in Home.jsx - used to pre-fill the form the
// first time (before the admin has ever saved a homeContent section).
const DEFAULT_HOME = {
  video: {
    eyebrow: 'Watch & Learn',
    heading: 'See Our Classroom Come Alive',
    text: "Every batch at Launch Pad English is live, interactive and speaking-first - not a one-way lecture. Take a look inside a real session and see how our trainers turn grammar and vocabulary into confident, everyday conversation from day one.",
    tags: ['15+ Years Experience', 'Online & Offline Batches', 'Certificate on Completion', 'South Delhi Campus'],
    ctaText: 'Learn More About Us',
  },
  whyChooseUs: {
    eyebrow: 'Why Choose Us',
    heading: 'Why Choose Launch Pad English?',
    imageUrl: '/images/main.jpeg',
    bullets: [
      'Expert, experienced trainers with global exposure to language & communication',
      'Practical, real-world speaking practice - not just textbook grammar',
      'Interview coaching, public speaking & personality development',
      'Small batches with continuous, personalized feedback',
      'Flexible online and offline (classroom) batch timings',
    ],
  },
  learningMethod: {
    eyebrow: 'How We Teach',
    heading: 'Our Learning Method',
    text: 'A structured, speaking-first approach - vocabulary and grammar in context, daily live speaking practice, role plays and group discussions, continuous trainer feedback, and real-world scenarios (interviews, presentations, everyday conversation) from week one.',
    tags: ['Speaking-First Classes', 'Weekly Assessments', 'Personalized Feedback'],
  },
  courseFeatures: {
    eyebrow: "What's Included",
    heading: 'Course Features',
    items: [
      { icon: '🗣️', title: 'English Speaking, Writing & Reading' },
      { icon: '🎙️', title: 'Daily Speaking Practice' },
      { icon: '📖', title: 'Grammar Made Easy' },
      { icon: '📚', title: '3000+ Vocabulary at Your Fingertips' },
      { icon: '🎯', title: 'Personalized Feedback' },
      { icon: '👨‍🏫', title: 'Experienced Trainers' },
    ],
  },
  services: {
    eyebrow: 'What We Offer',
    heading: 'Our Services',
    text: 'Everything you need to speak, present and succeed in English - under one roof.',
    items: [
      { icon: '🗣️', title: 'Spoken English', text: 'Speak English with confidence and clarity - for interviews, meetings and daily life.', link: '/online-courses' },
      { icon: '🎓', title: 'IELTS / PTE Coaching', text: 'Achieve top scores in IELTS and PTE with expert guidance and weekly mock tests.', link: '/online-courses' },
      { icon: '💻', title: 'Online & Offline Classes', text: 'Learn live online from home, or join hands-on classroom batches in South Delhi.', link: '/offline-courses' },
      { icon: '🧑‍🤝‍🧑', title: 'Group Discussion', text: 'Strengthen your group discussion skills with focused, real-world practice sessions.', link: '/counselling' },
      { icon: '✨', title: 'Personality Development', text: 'Grow your personality by expressing yourself clearly and confidently.', link: '/counselling' },
    ],
  },
  coursesPreview: {
    eyebrow: 'Our Courses',
    heading: 'Choose Your Course',
    text: 'Five specialised programs, available both online and offline.',
  },
  batchTimingsSection: {
    eyebrow: 'Plan Your Schedule',
    heading: 'Batch Timings',
    text: 'Every course runs on the same weekday batches, online and offline - pick whichever suits you.',
  },
  counselling: {
    eyebrow: 'Not Sure Where to Start?',
    heading: 'Free Career & Course Counselling',
    text: 'Get one-to-one guidance on the right course, a personalized English-learning roadmap, and honest answers to your questions - free, no obligation.',
    ctaText: 'Book Free Counselling',
    whatYouGetTitle: 'What You Get',
    whatYouGetBullets: [
      'Personal course & batch recommendation',
      'Free language level assessment',
      'IELTS / PTE / study-abroad planning',
      'Interview & career communication guidance',
    ],
  },
  achievements: {
    eyebrow: 'Our Track Record',
    heading: 'Achievements',
    bullets: [
      '10,000+ students trained since inception',
      '15+ years teaching Spoken English, IELTS & PTE',
      '100% batch completion rate',
      'Thousands of successful interview and study-abroad placements',
    ],
  },
  promise: {
    eyebrow: 'Our Commitment',
    heading: 'A Promise to Make You a Professional',
    items: [
      { icon: '💼', title: 'Professional Communication' },
      { icon: '🎤', title: 'Interview Preparation' },
      { icon: '📢', title: 'Public Speaking' },
      { icon: '💪', title: 'Confidence Building' },
      { icon: '🏢', title: 'Business English' },
      { icon: '📈', title: 'Career Development' },
      { icon: '🤝', title: 'Soft Skills' },
      { icon: '💬', title: 'Real-life Communication' },
    ],
  },
  gallery: {
    eyebrow: 'Gallery',
    heading: 'Life at Launch Pad English',
    text: 'Classroom sessions, events and student moments - managed straight from our database.',
  },
  reviews: {
    eyebrow: 'Real Student Stories',
    heading: 'What Our Students Say',
    text: "Testimonials from verified course purchasers, plus students and professionals we've taught over the years.",
    writeReviewTitle: 'Write a Review',
    writeReviewText: 'Only students who have purchased a course can post a review - enter the phone or email you used during registration to verify your purchase.',
  },
  findUs: {
    eyebrow: 'Find Us & Get In Touch',
    heading: 'Our Location & Contact Details',
    text: 'Visit our South Delhi campus, chat with us on WhatsApp, or give us a call.',
  },
  faqsTeaser: {
    eyebrow: 'Have Questions?',
    heading: 'Frequently Asked Questions',
    text: 'Course details, batch timings, certificates and more - answered.',
  },
  statsLabels: {
    students: 'Students Trained',
    years: 'Years of Experience',
    courses: 'Specialized Courses',
    successRate: 'Batch Completion Rate',
  },
};

function toForm(content) {
  const hc = content?.homeContent || {};
  const merge = (key) => ({ ...DEFAULT_HOME[key], ...(hc[key] || {}) });

  const video = merge('video');
  const whyChooseUs = merge('whyChooseUs');
  const learningMethod = merge('learningMethod');
  const counselling = merge('counselling');
  const achievements = merge('achievements');

  return {
    video: { ...video, tagsText: video.tags.join('\n') },
    whyChooseUs: { ...whyChooseUs, bulletsText: whyChooseUs.bullets.join('\n') },
    learningMethod: { ...learningMethod, tagsText: learningMethod.tags.join('\n') },
    courseFeatures: merge('courseFeatures'),
    services: merge('services'),
    coursesPreview: merge('coursesPreview'),
    batchTimingsSection: merge('batchTimingsSection'),
    counselling: { ...counselling, whatYouGetBulletsText: counselling.whatYouGetBullets.join('\n') },
    achievements: { ...achievements, bulletsText: achievements.bullets.join('\n') },
    promise: merge('promise'),
    gallery: merge('gallery'),
    reviews: merge('reviews'),
    findUs: merge('findUs'),
    faqsTeaser: merge('faqsTeaser'),
    statsLabels: merge('statsLabels'),
  };
}

function splitLines(text) {
  return text.split('\n').map((s) => s.trim()).filter(Boolean);
}

function toPayload(form) {
  return {
    video: { eyebrow: form.video.eyebrow, heading: form.video.heading, text: form.video.text, tags: splitLines(form.video.tagsText), ctaText: form.video.ctaText },
    whyChooseUs: {
      eyebrow: form.whyChooseUs.eyebrow,
      heading: form.whyChooseUs.heading,
      imageUrl: form.whyChooseUs.imageUrl,
      bullets: splitLines(form.whyChooseUs.bulletsText),
    },
    learningMethod: { eyebrow: form.learningMethod.eyebrow, heading: form.learningMethod.heading, text: form.learningMethod.text, tags: splitLines(form.learningMethod.tagsText) },
    courseFeatures: { eyebrow: form.courseFeatures.eyebrow, heading: form.courseFeatures.heading, items: form.courseFeatures.items.filter((i) => i.icon || i.title) },
    services: { eyebrow: form.services.eyebrow, heading: form.services.heading, text: form.services.text, items: form.services.items.filter((i) => i.icon || i.title) },
    coursesPreview: { ...form.coursesPreview },
    batchTimingsSection: { ...form.batchTimingsSection },
    counselling: {
      eyebrow: form.counselling.eyebrow,
      heading: form.counselling.heading,
      text: form.counselling.text,
      ctaText: form.counselling.ctaText,
      whatYouGetTitle: form.counselling.whatYouGetTitle,
      whatYouGetBullets: splitLines(form.counselling.whatYouGetBulletsText),
    },
    achievements: { eyebrow: form.achievements.eyebrow, heading: form.achievements.heading, bullets: splitLines(form.achievements.bulletsText) },
    promise: { eyebrow: form.promise.eyebrow, heading: form.promise.heading, items: form.promise.items.filter((i) => i.icon || i.title) },
    gallery: { ...form.gallery },
    reviews: { ...form.reviews },
    findUs: { ...form.findUs },
    faqsTeaser: { ...form.faqsTeaser },
    statsLabels: { ...form.statsLabels },
  };
}

function TextField({ label, value, onChange }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <input className="form-control" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function TextAreaField({ label, value, onChange, rows = 3 }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <textarea className="form-control" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

// Repeater for { icon, title } items (Course Features, Promise).
function IconTitleRepeater({ items, onAdd, onUpdate, onRemove }) {
  return (
    <>
      {items.map((it, i) => (
        <div className="card mb-12" key={i}>
          <div className="grid grid-2">
            <TextField label="Icon (emoji)" value={it.icon} onChange={(v) => onUpdate(i, 'icon', v)} />
            <TextField label="Title" value={it.title} onChange={(v) => onUpdate(i, 'title', v)} />
          </div>
          <button type="button" className="btn btn-sm btn-navy" onClick={() => onRemove(i)}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" className="btn btn-sm mb-24" onClick={onAdd}>
        + Add Item
      </button>
    </>
  );
}

export default function AdminHomePage() {
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

  function setField(section, key, value) {
    setForm((f) => ({ ...f, [section]: { ...f[section], [key]: value } }));
  }

  // Same base64-data-URL approach as AdminGallery.jsx / AdminBlog.jsx - no
  // writable filesystem to upload real files to.
  function handleImageUpload(e, section, key) {
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
      setField(section, key, reader.result);
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
  function addItem(section, blank) {
    setForm((f) => ({ ...f, [section]: { ...f[section], items: [...f[section].items, blank] } }));
  }
  function updateItem(section, i, key, value) {
    setForm((f) => {
      const items = [...f[section].items];
      items[i] = { ...items[i], [key]: value };
      return { ...f, [section]: { ...f[section], items } };
    });
  }
  function removeItem(section, i) {
    setForm((f) => ({ ...f, [section]: { ...f[section], items: f[section].items.filter((_, idx) => idx !== i) } }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const homeContent = toPayload(form);
      await api.admin.updateSiteContent({ homeContent });
      setSavedAt(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) return <p className="muted">Loading Home page content…</p>;

  return (
    <div>
      <h2>Home Page</h2>
      <p className="muted" style={{ fontSize: 13.5 }}>
        Every heading, paragraph and list on the public Home page (below the hero banner, which is edited on the
        Site Content page) - editing here changes the live site.
      </p>
      <form onSubmit={handleSave}>
        {error && <div className="form-alert error">{error}</div>}
        {savedAt && <div className="form-alert success">Saved at {savedAt.toLocaleTimeString()}</div>}

        <h3 className="mt-24">Classroom Video Section</h3>
        <div className="grid grid-2">
          <TextField label="Eyebrow" value={form.video.eyebrow} onChange={(v) => setField('video', 'eyebrow', v)} />
          <TextField label="Heading" value={form.video.heading} onChange={(v) => setField('video', 'heading', v)} />
        </div>
        <TextAreaField label="Paragraph" value={form.video.text} onChange={(v) => setField('video', 'text', v)} />
        <TextAreaField label="Tags (one per line)" value={form.video.tagsText} onChange={(v) => setField('video', 'tagsText', v)} rows={4} />
        <TextField label="Button Text" value={form.video.ctaText} onChange={(v) => setField('video', 'ctaText', v)} />

        <h3 className="mt-24">Why Choose Us</h3>
        <div className="grid grid-2">
          <TextField label="Eyebrow" value={form.whyChooseUs.eyebrow} onChange={(v) => setField('whyChooseUs', 'eyebrow', v)} />
          <TextField label="Heading" value={form.whyChooseUs.heading} onChange={(v) => setField('whyChooseUs', 'heading', v)} />
        </div>
        <TextAreaField label="Bullets (one per line)" value={form.whyChooseUs.bulletsText} onChange={(v) => setField('whyChooseUs', 'bulletsText', v)} rows={5} />
        {uploadError && <div className="form-alert error">{uploadError}</div>}
        <div className="form-group">
          <label>Photo</label>
          {form.whyChooseUs.imageUrl && (
            <img
              src={form.whyChooseUs.imageUrl}
              alt=""
              style={{ display: 'block', width: 160, height: 110, objectFit: 'cover', borderRadius: 8, marginBottom: 10 }}
            />
          )}
          <input className="form-control" value={form.whyChooseUs.imageUrl} onChange={(e) => setField('whyChooseUs', 'imageUrl', e.target.value)} />
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="muted" style={{ fontSize: 13 }}>or upload an image file directly:</span>
            <input type="file" accept="image/*" disabled={uploading} onChange={(e) => handleImageUpload(e, 'whyChooseUs', 'imageUrl')} />
            {uploading && <span className="spinner" />}
          </div>
        </div>

        <h3 className="mt-24">Our Learning Method</h3>
        <div className="grid grid-2">
          <TextField label="Eyebrow" value={form.learningMethod.eyebrow} onChange={(v) => setField('learningMethod', 'eyebrow', v)} />
          <TextField label="Heading" value={form.learningMethod.heading} onChange={(v) => setField('learningMethod', 'heading', v)} />
        </div>
        <TextAreaField label="Paragraph" value={form.learningMethod.text} onChange={(v) => setField('learningMethod', 'text', v)} />
        <TextAreaField label="Tags (one per line)" value={form.learningMethod.tagsText} onChange={(v) => setField('learningMethod', 'tagsText', v)} />

        <h3 className="mt-24">Course Features</h3>
        <div className="grid grid-2">
          <TextField label="Eyebrow" value={form.courseFeatures.eyebrow} onChange={(v) => setField('courseFeatures', 'eyebrow', v)} />
          <TextField label="Heading" value={form.courseFeatures.heading} onChange={(v) => setField('courseFeatures', 'heading', v)} />
        </div>
        <IconTitleRepeater
          items={form.courseFeatures.items}
          onAdd={() => addItem('courseFeatures', { icon: '', title: '' })}
          onUpdate={(i, k, v) => updateItem('courseFeatures', i, k, v)}
          onRemove={(i) => removeItem('courseFeatures', i)}
        />

        <h3 className="mt-24">Services</h3>
        <div className="grid grid-2">
          <TextField label="Eyebrow" value={form.services.eyebrow} onChange={(v) => setField('services', 'eyebrow', v)} />
          <TextField label="Heading" value={form.services.heading} onChange={(v) => setField('services', 'heading', v)} />
        </div>
        <TextAreaField label="Paragraph" value={form.services.text} onChange={(v) => setField('services', 'text', v)} rows={2} />
        {form.services.items.map((it, i) => (
          <div className="card mb-12" key={i}>
            <div className="grid grid-2">
              <TextField label="Icon (emoji)" value={it.icon} onChange={(v) => updateItem('services', i, 'icon', v)} />
              <TextField label="Title" value={it.title} onChange={(v) => updateItem('services', i, 'title', v)} />
            </div>
            <TextAreaField label="Description" value={it.text} onChange={(v) => updateItem('services', i, 'text', v)} rows={2} />
            <TextField label="Link (internal path, e.g. /online-courses)" value={it.link} onChange={(v) => updateItem('services', i, 'link', v)} />
            <button type="button" className="btn btn-sm btn-navy" onClick={() => removeItem('services', i)}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-sm mb-24" onClick={() => addItem('services', { icon: '', title: '', text: '', link: '' })}>
          + Add Service
        </button>

        <h3 className="mt-24">Courses Preview Section Header</h3>
        <div className="grid grid-2">
          <TextField label="Eyebrow" value={form.coursesPreview.eyebrow} onChange={(v) => setField('coursesPreview', 'eyebrow', v)} />
          <TextField label="Heading" value={form.coursesPreview.heading} onChange={(v) => setField('coursesPreview', 'heading', v)} />
        </div>
        <TextAreaField label="Paragraph" value={form.coursesPreview.text} onChange={(v) => setField('coursesPreview', 'text', v)} rows={2} />
        <p className="form-hint">The course cards themselves are managed on the Courses page.</p>

        <h3 className="mt-24">Batch Timings Section Header</h3>
        <div className="grid grid-2">
          <TextField label="Eyebrow" value={form.batchTimingsSection.eyebrow} onChange={(v) => setField('batchTimingsSection', 'eyebrow', v)} />
          <TextField label="Heading" value={form.batchTimingsSection.heading} onChange={(v) => setField('batchTimingsSection', 'heading', v)} />
        </div>
        <TextAreaField label="Paragraph" value={form.batchTimingsSection.text} onChange={(v) => setField('batchTimingsSection', 'text', v)} rows={2} />
        <p className="form-hint">The actual timings are edited on the Site Content page.</p>

        <h3 className="mt-24">Counselling Section</h3>
        <div className="grid grid-2">
          <TextField label="Eyebrow" value={form.counselling.eyebrow} onChange={(v) => setField('counselling', 'eyebrow', v)} />
          <TextField label="Heading" value={form.counselling.heading} onChange={(v) => setField('counselling', 'heading', v)} />
        </div>
        <TextAreaField label="Paragraph" value={form.counselling.text} onChange={(v) => setField('counselling', 'text', v)} />
        <div className="grid grid-2">
          <TextField label="Button Text" value={form.counselling.ctaText} onChange={(v) => setField('counselling', 'ctaText', v)} />
          <TextField label={'"What You Get" Card Title'} value={form.counselling.whatYouGetTitle} onChange={(v) => setField('counselling', 'whatYouGetTitle', v)} />
        </div>
        <TextAreaField label={'"What You Get" Bullets (one per line)'} value={form.counselling.whatYouGetBulletsText} onChange={(v) => setField('counselling', 'whatYouGetBulletsText', v)} rows={4} />

        <h3 className="mt-24">Achievements</h3>
        <div className="grid grid-2">
          <TextField label="Eyebrow" value={form.achievements.eyebrow} onChange={(v) => setField('achievements', 'eyebrow', v)} />
          <TextField label="Heading" value={form.achievements.heading} onChange={(v) => setField('achievements', 'heading', v)} />
        </div>
        <TextAreaField label="Bullets (one per line)" value={form.achievements.bulletsText} onChange={(v) => setField('achievements', 'bulletsText', v)} rows={4} />
        <p className="form-hint">These are plain text - update the numbers here yourself if the Stats Strip numbers (Site Content page) change.</p>

        <h3 className="mt-24">Promise Section</h3>
        <div className="grid grid-2">
          <TextField label="Eyebrow" value={form.promise.eyebrow} onChange={(v) => setField('promise', 'eyebrow', v)} />
          <TextField label="Heading" value={form.promise.heading} onChange={(v) => setField('promise', 'heading', v)} />
        </div>
        <IconTitleRepeater
          items={form.promise.items}
          onAdd={() => addItem('promise', { icon: '', title: '' })}
          onUpdate={(i, k, v) => updateItem('promise', i, k, v)}
          onRemove={(i) => removeItem('promise', i)}
        />

        <h3 className="mt-24">Gallery Section Header</h3>
        <div className="grid grid-2">
          <TextField label="Eyebrow" value={form.gallery.eyebrow} onChange={(v) => setField('gallery', 'eyebrow', v)} />
          <TextField label="Heading" value={form.gallery.heading} onChange={(v) => setField('gallery', 'heading', v)} />
        </div>
        <TextAreaField label="Paragraph" value={form.gallery.text} onChange={(v) => setField('gallery', 'text', v)} rows={2} />

        <h3 className="mt-24">Reviews Section</h3>
        <div className="grid grid-2">
          <TextField label="Eyebrow" value={form.reviews.eyebrow} onChange={(v) => setField('reviews', 'eyebrow', v)} />
          <TextField label="Heading" value={form.reviews.heading} onChange={(v) => setField('reviews', 'heading', v)} />
        </div>
        <TextAreaField label="Paragraph" value={form.reviews.text} onChange={(v) => setField('reviews', 'text', v)} rows={2} />
        <div className="grid grid-2">
          <TextField label={'"Write a Review" Card Title'} value={form.reviews.writeReviewTitle} onChange={(v) => setField('reviews', 'writeReviewTitle', v)} />
        </div>
        <TextAreaField label={'"Write a Review" Helper Text'} value={form.reviews.writeReviewText} onChange={(v) => setField('reviews', 'writeReviewText', v)} rows={2} />

        <h3 className="mt-24">Find Us Section Header</h3>
        <div className="grid grid-2">
          <TextField label="Eyebrow" value={form.findUs.eyebrow} onChange={(v) => setField('findUs', 'eyebrow', v)} />
          <TextField label="Heading" value={form.findUs.heading} onChange={(v) => setField('findUs', 'heading', v)} />
        </div>
        <TextAreaField label="Paragraph" value={form.findUs.text} onChange={(v) => setField('findUs', 'text', v)} rows={2} />
        <p className="form-hint">The map, phone, WhatsApp and address are edited on the Site Content page.</p>

        <h3 className="mt-24">FAQs Teaser Section</h3>
        <div className="grid grid-2">
          <TextField label="Eyebrow" value={form.faqsTeaser.eyebrow} onChange={(v) => setField('faqsTeaser', 'eyebrow', v)} />
          <TextField label="Heading" value={form.faqsTeaser.heading} onChange={(v) => setField('faqsTeaser', 'heading', v)} />
        </div>
        <TextAreaField label="Paragraph" value={form.faqsTeaser.text} onChange={(v) => setField('faqsTeaser', 'text', v)} rows={2} />

        <h3 className="mt-24">Trust Bar Stat Labels</h3>
        <div className="grid grid-4">
          <TextField label="Students Label" value={form.statsLabels.students} onChange={(v) => setField('statsLabels', 'students', v)} />
          <TextField label="Years Label" value={form.statsLabels.years} onChange={(v) => setField('statsLabels', 'years', v)} />
          <TextField label="Courses Label" value={form.statsLabels.courses} onChange={(v) => setField('statsLabels', 'courses', v)} />
          <TextField label="Success Rate Label" value={form.statsLabels.successRate} onChange={(v) => setField('statsLabels', 'successRate', v)} />
        </div>
        <p className="form-hint">The numbers themselves are edited on the Site Content page (Stats Strip).</p>

        <button className="btn btn-block mt-24" disabled={saving}>
          {saving ? <span className="spinner" /> : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
