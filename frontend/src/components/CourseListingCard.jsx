import React from 'react';
import { Link } from 'react-router-dom';
import CourseImage from './CourseImage.jsx';
import PriceTag from './PriceTag.jsx';
import { MODE_META, coursePath, priceFor, shortTitle } from '../../shared/course.js';

// One course in ONE mode - used on /online-courses, /offline-courses and the
// Home page's Learn Online / Learn Offline sections. Only that mode's price
// is shown, and both buttons stay inside that mode's flow.
export default function CourseListingCard({ course, mode, onEnroll, compact = false }) {
  const path = coursePath(mode, course.slug);
  const price = priceFor(course, mode);
  const features = (course.highlights || []).slice(0, compact ? 3 : 4);

  return (
    <article className={`cc-card ${compact ? 'cc-card-compact' : ''}`}>
      <Link to={path} className="cc-card-media" tabIndex={-1} aria-hidden="true">
        <CourseImage course={course} />
        <span className={`cc-mode-badge cc-mode-${mode}`}>
          <i className={`fas ${MODE_META[mode].icon}`} /> {MODE_META[mode].label}
        </span>
        {price.discount > 0 && <span className="cc-discount-badge">{price.discount}% OFF</span>}
      </Link>

      <div className="cc-card-body">
        <div className="cc-kicker">
          {course.category && <span>{course.category}</span>}
          {course.level && course.level !== course.category && <span>{course.level}</span>}
        </div>
        <h3 className="cc-card-title">
          <Link to={path}>{shortTitle(course.title)}</Link>
        </h3>
        <p className="cc-card-desc">{course.shortDescription || course.tagline}</p>

        <div className="cc-card-meta">
          <span>
            <i className="far fa-clock" /> {course.duration}
          </span>
        </div>

        {features.length > 0 && (
          <ul className="cc-feature-list">
            {features.map((f, i) => (
              <li key={i}>
                <i className="fas fa-check" /> {f}
              </li>
            ))}
          </ul>
        )}

        <div className="cc-card-footer">
          <PriceTag mrp={price.mrp} offer={price.offer} currency={course.currency} hideOnly />
          <div className="cc-card-actions">
            <Link className="btn btn-outline btn-sm" to={path}>
              View Course
            </Link>
            <button type="button" className="btn btn-sm" onClick={() => onEnroll(course, mode)}>
              Enroll Now
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
