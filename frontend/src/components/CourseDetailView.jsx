import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Breadcrumbs from './Breadcrumbs.jsx';
import CourseImage from './CourseImage.jsx';
import PriceTag from './PriceTag.jsx';
import BatchTimings from './BatchTimings.jsx';
import CourseListingCard from './CourseListingCard.jsx';
import ReviewList from './ReviewList.jsx';
import WhatsAppIcon from './WhatsAppIcon.jsx';
import { videoEmbed } from '../lib/video.js';
import {
  MODE_META,
  breadcrumbsFor,
  courseH1,
  coursePath,
  modeCopy,
  offersMode,
  priceFor,
  whatsappLink,
} from '../../shared/course.js';

const FALLBACK_GALLERY = [
  { url: '/images/four-skills-book.avif', caption: 'Reading, writing, listening and speaking skills covered in class' },
  { url: '/images/learn-english-illustration.avif', caption: 'Students learning English together at Launch Pad English' },
  { url: '/images/english-pinboard.jfif', caption: 'English learning classroom moments at Launch Pad English' },
];

const DETAIL_ROWS = [
  ['numClasses', 'Number of Classes', 'fa-calendar-check'],
  ['classDuration', 'Class Duration', 'fa-hourglass-half'],
  ['assessments', 'Assessments', 'fa-clipboard-check'],
  ['mockTests', 'Mock Tests', 'fa-file-signature'],
  ['studyMaterial', 'Study Material', 'fa-book'],
  ['certificate', 'Certificate', 'fa-certificate'],
];

const OTHER = { online: 'offline', offline: 'online' };

// The single template every course page renders through - everything on it
// comes from the course record. Used by the public /online-courses/:slug and
// /offline-courses/:slug pages and by the admin editor's live preview.
export default function CourseDetailView({ course, mode, related = [], siteContent, onEnroll, preview = false }) {
  const [openModule, setOpenModule] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const meta = MODE_META[mode];
  const price = priceFor(course, mode);
  const { headline, intro } = modeCopy(course, mode);
  const video = videoEmbed(course.promoVideo);
  const batches = (course.batches || []).filter((b) => b.mode === mode);
  const details = DETAIL_ROWS.filter(([key]) => course.details?.[key]);
  const gallery = course.images?.length ? course.images : FALLBACK_GALLERY;
  const instructor = course.instructor || {};
  const whyUs = siteContent?.homeContent?.whyChooseUs?.bullets || [
    'Expert, experienced trainers with global exposure to language & communication',
    'Practical, real-world speaking practice - not just textbook grammar',
    'Interview coaching, public speaking & personality development',
    'Small batches with continuous, personalized feedback',
  ];
  const waLink = whatsappLink(
    siteContent?.whatsapp,
    `Hi, I'm interested in the ${course.title} (${meta.label}). Please share more details.`
  );
  const otherMode = OTHER[mode];
  const hasOther = offersMode(course, otherMode);
  const topicCount = (course.syllabus || []).reduce((n, m) => n + (m.points?.length || 0), 0);

  const enroll = (batchId) => onEnroll?.(batchId);

  return (
    <div className={`cd ${preview ? 'cd-preview' : ''}`}>
      {/* ---------------- Hero ---------------- */}
      <section className={`cd-hero cd-hero-${mode}`}>
        <div className="container cd-hero-grid">
          <div className="cd-hero-copy">
            <Breadcrumbs crumbs={breadcrumbsFor(mode, course)} light />
            <div className="cd-badges">
              <span className={`cc-mode-badge cc-mode-${mode} cc-mode-badge-inline`}>
                <i className={`fas ${meta.icon}`} /> {meta.badge}
              </span>
              {course.category && <span className="cd-chip">{course.category}</span>}
              {price.discount > 0 && <span className="cd-chip cd-chip-accent">{price.discount}% OFF</span>}
            </div>
            <h1>{courseH1(course, mode)}</h1>
            {headline && <p className="cd-headline">{headline}</p>}
            {intro && intro !== headline && <p className="cd-intro">{intro}</p>}

            <div className="cd-facts">
              {course.duration && (
                <span>
                  <i className="far fa-clock" /> {course.duration}
                </span>
              )}
              {course.level && (
                <span>
                  <i className="fas fa-signal" /> {course.level}
                </span>
              )}
              {course.details?.numClasses && (
                <span>
                  <i className="fas fa-calendar-check" /> {course.details.numClasses}
                </span>
              )}
              {course.details?.certificate && (
                <span>
                  <i className="fas fa-certificate" /> Certificate
                </span>
              )}
            </div>

            <PriceTag mrp={price.mrp} offer={price.offer} currency={course.currency} size="lg" hideOnly />

            <div className="cd-cta">
              <button type="button" className="btn btn-lg" onClick={() => enroll()}>
                Enroll Now
              </button>
              <a className="btn btn-whatsapp btn-lg" href={waLink} target="_blank" rel="noreferrer">
                <WhatsAppIcon size={18} /> Talk to a Counsellor
              </a>
            </div>
          </div>

          <div className="cd-hero-media">
            {video?.type === 'iframe' ? (
              <div className="cd-video">
                <iframe src={video.src} title={`${course.title} video`} allow="encrypted-media; picture-in-picture" allowFullScreen loading="lazy" />
              </div>
            ) : video?.type === 'video' ? (
              <video className="cd-video" src={video.src} controls preload="metadata" poster={course.heroImage || course.thumbnail || undefined} />
            ) : (
              <CourseImage course={course} src={course.heroImage || course.thumbnail} alt={courseH1(course, mode)} eager />
            )}
          </div>
        </div>
      </section>

      <nav className="cd-subnav" aria-label="Course sections">
        <div className="container">
          <a href="#overview">Overview</a>
          {course.syllabus?.length > 0 && <a href="#curriculum">Curriculum</a>}
          <a href="#batches">Batches</a>
          {course.faqs?.length > 0 && <a href="#faqs">FAQs</a>}
          <a href="#reviews">Reviews</a>
        </div>
      </nav>

      {/* ---------------- Body ---------------- */}
      <div className="container cd-layout">
        <div className="cd-main">
          <section id="overview" className="cd-section">
            <h2>Course Overview</h2>
            {course.fullDescription ? (
              <div className="rich-content" dangerouslySetInnerHTML={{ __html: course.fullDescription }} />
            ) : (
              <p>{course.overview}</p>
            )}
          </section>

          {course.outcomes?.length > 0 && (
            <section className="cd-section">
              <h2>What You'll Learn</h2>
              <ul className="cd-check-grid">
                {course.outcomes.map((o, i) => (
                  <li key={i}>
                    <i className="fas fa-check-circle" /> {o}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {course.highlights?.length > 0 && (
            <section className="cd-section">
              <h2>Course Features</h2>
              <div className="cd-feature-grid">
                {course.highlights.map((f, i) => (
                  <div className="cd-feature" key={i}>
                    <i className="fas fa-star" /> <span>{f}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {course.syllabus?.length > 0 && (
            <section id="curriculum" className="cd-section">
              <div className="cd-section-head">
                <h2>Course Curriculum</h2>
                <span className="muted">
                  {course.syllabus.length} modules · {topicCount} topics
                </span>
              </div>
              <div className="curriculum">
                {course.syllabus.map((m, i) => (
                  <div className={`curriculum-module ${openModule === i ? 'open' : ''}`} key={i}>
                    <button type="button" className="curriculum-head" onClick={() => setOpenModule(openModule === i ? null : i)} aria-expanded={openModule === i}>
                      <span className="curriculum-index">{String(i + 1).padStart(2, '0')}</span>
                      <span className="curriculum-title">{m.module}</span>
                      <span className="curriculum-count">{m.points?.length || 0} topics</span>
                      <i className="fas fa-chevron-down" />
                    </button>
                    {openModule === i && (
                      <ul className="curriculum-topics">
                        {(m.points || []).map((p, j) => (
                          <li key={j}>
                            <i className="far fa-circle-play" /> {p}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {details.length > 0 && (
            <section className="cd-section">
              <h2>Course Details</h2>
              <dl className="cd-details">
                {course.duration && (
                  <div>
                    <dt>
                      <i className="far fa-clock" /> Duration
                    </dt>
                    <dd>{course.duration}</dd>
                  </div>
                )}
                {details.map(([key, label, icon]) => (
                  <div key={key}>
                    <dt>
                      <i className={`fas ${icon}`} /> {label}
                    </dt>
                    <dd>{course.details[key]}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {(course.whoShouldJoin?.length > 0 || course.dailyPattern?.length > 0) && (
            <section className="cd-section cd-two-col">
              {course.whoShouldJoin?.length > 0 && (
                <div>
                  <h2>Who Should Join?</h2>
                  <ul className="cd-list">
                    {course.whoShouldJoin.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
              {course.dailyPattern?.length > 0 && (
                <div>
                  <h2>Daily Class Structure</h2>
                  <ul className="cd-list">
                    {course.dailyPattern.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          <section id="batches" className="cd-section">
            <h2>{meta.label} Batch Timings</h2>
            <p className="muted">Choose a slot to enroll directly in that batch.</p>
            <BatchTimings batches={batches} modes={[mode]} onSelect={(b) => enroll(b._id)} />
          </section>

          {(instructor.name || instructor.bio) && (
            <section className="cd-section cd-instructor">
              <h2>Your Trainer</h2>
              <div className="cd-instructor-card">
                {instructor.image ? (
                  <img src={instructor.image} alt={instructor.name || 'Trainer'} loading="lazy" />
                ) : (
                  <span className="cd-instructor-avatar">{(instructor.name || 'T').charAt(0)}</span>
                )}
                <div>
                  <h3>{instructor.name}</h3>
                  {instructor.title && <p className="muted">{instructor.title}</p>}
                  {instructor.bio && <p>{instructor.bio}</p>}
                </div>
              </div>
            </section>
          )}

          <section className="cd-section">
            <h2>Why Choose Launch Pad English?</h2>
            <ul className="cd-check-grid">
              {whyUs.map((b, i) => (
                <li key={i}>
                  <i className="fas fa-check-circle" /> {b}
                </li>
              ))}
            </ul>
          </section>

          <section className="cd-section">
            <h2>Glimpses of This Course</h2>
            <div className="gallery-grid">
              {gallery.map((img, i) => (
                <div className="gallery-item" key={img.url + i}>
                  <img src={img.url} alt={img.caption || `${course.title} - photo ${i + 1}`} loading="lazy" />
                </div>
              ))}
            </div>
          </section>

          {course.resources?.length > 0 && (
            <section className="cd-section">
              <h2>Course Resources</h2>
              <div className="resource-grid">
                {course.resources.map((r) => (
                  <a className="resource-card" href={r.url} target="_blank" rel="noreferrer" key={r._id || r.url} download={`${r.title}.pdf`}>
                    <span className="resource-icon">📄</span>
                    <span>
                      <strong>{r.title}</strong>
                      <span className="resource-download">Download PDF ↓</span>
                    </span>
                  </a>
                ))}
              </div>
            </section>
          )}

          <section id="reviews" className="cd-section">
            <h2>What Our Students Say</h2>
            {preview ? <p className="muted">Student reviews appear here.</p> : <ReviewList />}
          </section>

          {course.faqs?.length > 0 && (
            <section id="faqs" className="cd-section">
              <h2>Frequently Asked Questions</h2>
              {course.faqs.map((f, i) => (
                <div className={`faq-item ${openFaq === i ? 'open' : ''}`} key={i}>
                  <button type="button" className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i}>
                    {f.q} <span>{openFaq === i ? '−' : '+'}</span>
                  </button>
                  <div className="faq-a">{f.a}</div>
                </div>
              ))}
            </section>
          )}
        </div>

        {/* ---------------- Sticky enrollment card ---------------- */}
        <aside className="cd-sidebar">
          <div className="cd-enroll-card">
            <span className={`cc-mode-badge cc-mode-${mode} cc-mode-badge-inline`}>
              <i className={`fas ${meta.icon}`} /> {meta.label} Course
            </span>
            <PriceTag mrp={price.mrp} offer={price.offer} currency={course.currency} hideOnly />
            <ul className="cd-enroll-facts">
              {course.duration && (
                <li>
                  <i className="far fa-clock" /> {course.duration}
                </li>
              )}
              {course.level && (
                <li>
                  <i className="fas fa-signal" /> {course.level}
                </li>
              )}
              {batches.filter((b) => b.bookable).length > 0 && (
                <li>
                  <i className="fas fa-users" /> {batches.filter((b) => b.bookable).length} batch timings available
                </li>
              )}
              {course.details?.certificate && (
                <li>
                  <i className="fas fa-certificate" /> {course.details.certificate}
                </li>
              )}
            </ul>
            <button type="button" className="btn btn-block" onClick={() => enroll()}>
              Enroll Now
            </button>
            <a className="btn btn-whatsapp btn-block" href={waLink} target="_blank" rel="noreferrer">
              <WhatsAppIcon size={16} /> Talk to a Counsellor
            </a>
            {hasOther && (
              <Link className="cd-other-mode" to={coursePath(otherMode, course.slug)}>
                Also available {MODE_META[otherMode].label.toLowerCase()} <i className="fas fa-arrow-right" />
              </Link>
            )}
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="section section-alt">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Explore More</span>
              <h2>Other {meta.listingTitle}</h2>
            </div>
            <div className="cc-grid">
              {related.slice(0, 3).map((c) => (
                <CourseListingCard key={c.slug} course={c} mode={mode} compact onEnroll={(rc) => onEnroll?.(undefined, rc)} />
              ))}
            </div>
            <div className="center mt-24">
              <Link className="btn btn-outline" to={meta.listingPath}>
                View All {meta.listingTitle}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Mobile sticky enroll bar */}
      <div className="cd-mobile-bar">
        <div>
          <strong>{price.offer ? `₹${price.offer.toLocaleString('en-IN')}` : ''}</strong>
          {price.discount > 0 && <span> {price.discount}% OFF</span>}
        </div>
        <button type="button" className="btn btn-sm" onClick={() => enroll()}>
          Enroll Now
        </button>
      </div>
    </div>
  );
}
