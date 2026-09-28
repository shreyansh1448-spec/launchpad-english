import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import CourseListingCard from '../components/CourseListingCard.jsx';
import RegistrationModal from '../components/RegistrationModal.jsx';
import BatchTimings from '../components/BatchTimings.jsx';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import useSeo from '../hooks/useSeo.js';
import { MODE_META, breadcrumbsFor, coursePath, listingSeo, listingJsonLd } from '../../shared/course.js';

const OTHER = { online: 'offline', offline: 'online' };

// /online-courses and /offline-courses - the same template, but each page
// only ever lists (and prices) courses in its own mode.
export default function CourseListing({ mode }) {
  const meta = MODE_META[mode];
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [enroll, setEnroll] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setCategory('All');
    Promise.all([api.getCourses(mode).catch(() => []), api.getBatches(mode).catch(() => [])])
      .then(([c, b]) => {
        setCourses(c);
        setBatches(b);
      })
      .finally(() => setLoading(false));
  }, [mode]);

  // Old links pointed at /online-courses#<slug> - send them to the course's own page.
  useEffect(() => {
    if (loading || !location.hash) return;
    const slug = decodeURIComponent(location.hash.slice(1));
    const match = courses.find((c) => c.slug === slug || (c.legacySlugs || []).includes(slug));
    if (match) navigate(coursePath(mode, match.slug), { replace: true });
  }, [loading, location.hash, courses, mode, navigate]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  useSeo(listingSeo(mode, origin), loading ? [] : listingJsonLd(mode, courses, origin));

  const categories = useMemo(() => ['All', ...new Set(courses.map((c) => c.category).filter(Boolean))], [courses]);
  const visible = category === 'All' ? courses : courses.filter((c) => c.category === category);

  return (
    <>
      <section className={`listing-hero listing-hero-${mode}`}>
        <div className="container">
          <Breadcrumbs crumbs={breadcrumbsFor(mode)} light />
          <span className="listing-hero-badge">
            <i className={`fas ${meta.icon}`} /> {mode === 'online' ? 'Learn from anywhere' : 'Green Park, South Delhi'}
          </span>
          <h1>{meta.listingTitle}</h1>
          <p>{meta.listingIntro}</p>
          <Link className="listing-switch" to={MODE_META[OTHER[mode]].listingPath}>
            {mode === 'online' ? 'Prefer classroom learning? See Offline Courses' : 'Prefer to learn from home? See Online Courses'}{' '}
            <i className="fas fa-arrow-right" />
          </Link>
        </div>
      </section>

      <section className="section section-tight-top">
        <div className="container">
          {categories.length > 2 && (
            <div className="filter-chips" role="tablist" aria-label="Filter by category">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={category === cat}
                  className={`filter-chip ${category === cat ? 'active' : ''}`}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="cc-grid">
              {[0, 1, 2].map((i) => (
                <div className="cc-card cc-skeleton" key={i} />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <p className="muted center section">No {mode} courses are open right now - please check back soon or talk to our counsellor.</p>
          ) : (
            <div className="cc-grid">
              {visible.map((c) => (
                <CourseListingCard key={c.slug} course={c} mode={mode} onEnroll={(course) => setEnroll(course)} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section section-alt" id="batch-timings">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Plan Your Schedule</span>
            <h2>{meta.label} Batch Timings</h2>
            <p>Pick the slot that suits you when you enroll - timings apply across our {meta.listingTitle.toLowerCase()}.</p>
          </div>
          <BatchTimings batches={batches} modes={[mode]} />
        </div>
      </section>

      <section className="section">
        <div className="container cta-band">
          <div>
            <h2>Not sure which course is right for you?</h2>
            <p>Get a free level assessment and a personal course recommendation from our counsellor.</p>
          </div>
          <Link className="btn" to="/counselling">
            Book Free Counselling
          </Link>
        </div>
      </section>

      {enroll && <RegistrationModal course={enroll} mode={mode} onClose={() => setEnroll(null)} />}
    </>
  );
}
