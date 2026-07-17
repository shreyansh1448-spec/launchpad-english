import React, { useState } from 'react';
import Reveal from './Reveal.jsx';
import { API_ORIGIN } from '../api.js';
import PriceTag from './PriceTag.jsx';

// Full detailed course block - used on the Online Courses / Offline Courses
// listing pages (5 of these stacked, one per course) and on the CourseDetail
// deep-link page. `mode` is 'online' | 'offline'. Batch timings, pricing and
// student reviews are shown once, sitewide (course cards / purchase modal /
// Home page) - this block is pure course information, not a pricing page.
export default function CourseSection({ course, mode, onPurchase }) {
  return (
    <div className="course-section" id={course.slug}>
      <div className="course-head">
        <div>
          <span className="eyebrow">
            {mode === 'online' ? 'Online Batch' : 'Offline / Classroom Batch'}
          </span>
          <h2>{course.title}</h2>
          <p>{course.tagline}</p>
          <div className="tag-row">
            <span className="tag">⏱ {course.duration}</span>
            <span className="tag">🎯 {course.level}</span>
          </div>
        </div>
        <div className="course-head-actions">
          {course.pricing?.[mode] && (
            <PriceTag mrp={course.pricing[mode].mrp} offer={course.pricing[mode].offer} size="lg" />
          )}
          <button className="btn btn-block" onClick={() => onPurchase(course, mode)}>
            Purchase {mode === 'online' ? 'Online' : 'Offline'}
          </button>
        </div>
      </div>

      <Reveal className="grid grid-2">
        <div className="card">
          <h3>Course Overview</h3>
          <p>{course.overview}</p>
          <h4>Highlights</h4>
          <ul>
            {course.highlights.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3>Who Should Join?</h3>
          <ul>
            {(course.whoShouldJoin || []).map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
          <h4>Expected Learning Outcomes</h4>
          <ul>
            {course.outcomes.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </div>
      </Reveal>

      <Reveal className="card mt-24">
        <h3>Detailed Syllabus</h3>
        <div className="module-list">
          {course.syllabus.map((m, i) => (
            <div className="module" key={i}>
              <h4>{m.module}</h4>
              <ul>
                {m.points.map((p, j) => (
                  <li key={j}>{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal className="grid grid-2 mt-24">
        <div className="card">
          <h3>Daily Class Structure</h3>
          <ul>
            {course.dailyPattern.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3>Why Choose Launch Pad English?</h3>
          <ul>
            <li>Expert, experienced trainers with global exposure to language &amp; communication</li>
            <li>Practical, real-world speaking practice - not just textbook grammar</li>
            <li>Interview coaching, public speaking &amp; personality development</li>
            <li>Small batches with continuous, personalized feedback</li>
          </ul>
        </div>
      </Reveal>

      <ResourcesBlock resources={course.resources} />

      <CourseGallery title={course.title} />

      <FaqBlock faqs={course.faqs} />
    </div>
  );
}

function ResourcesBlock({ resources }) {
  if (!resources || resources.length === 0) return null;
  return (
    <Reveal className="card mt-24">
      <h3>Course Resources</h3>
      <div className="resource-grid">
        {resources.map((r) => (
          <a className="resource-card" href={`${API_ORIGIN}${r.url}`} target="_blank" rel="noreferrer" key={r._id || r.url}>
            <span className="resource-icon">📄</span>
            <span>
              <strong>{r.title}</strong>
              <span className="resource-download">Download PDF ↓</span>
            </span>
          </a>
        ))}
      </div>
    </Reveal>
  );
}

const GALLERY_IMAGES = [
  { src: '/images/four-skills-book.avif', alt: 'Reading, writing, listening and speaking skills covered in class' },
  { src: '/images/learn-english-illustration.avif', alt: 'Students learning English together at Launch Pad English' },
  { src: '/images/english-pinboard.jfif', alt: 'English learning classroom moments at Launch Pad English' },
];

function CourseGallery({ title }) {
  return (
    <Reveal className="card mt-24">
      <h3>Glimpses of This Course</h3>
      <div className="gallery-grid">
        {GALLERY_IMAGES.map((img) => (
          <div className="gallery-item" key={img.src}>
            <img src={img.src} alt={`${title} - ${img.alt}`} loading="lazy" />
          </div>
        ))}
      </div>
    </Reveal>
  );
}

function FaqBlock({ faqs }) {
  const [openIdx, setOpenIdx] = useState(null);
  if (!faqs || faqs.length === 0) return null;
  return (
    <Reveal className="card mt-24">
      <h3>Course FAQs</h3>
      {faqs.map((f, i) => (
        <div className={`faq-item ${openIdx === i ? 'open' : ''}`} key={i}>
          <button className="faq-q" onClick={() => setOpenIdx(openIdx === i ? null : i)}>
            {f.q} <span>{openIdx === i ? '−' : '+'}</span>
          </button>
          <div className="faq-a">{f.a}</div>
        </div>
      ))}
    </Reveal>
  );
}
