import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import ReviewStars from './ReviewStars.jsx';

const AUTO_ADVANCE_MS = 6000;

// courseSlug omitted -> shows reviews across all courses (used on Home page).
// Shows one review at a time, auto-advancing on a timer, with prev/next
// controls to browse the full set manually.
export default function ReviewList({ courseSlug }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getReviews(courseSlug)
      .then((data) => {
        if (cancelled) return;
        setReviews(data);
        setIndex(0);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [courseSlug]);

  useEffect(() => {
    if (reviews.length <= 1) return undefined;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % reviews.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timerRef.current);
  }, [reviews.length, index]);

  function goTo(next) {
    clearInterval(timerRef.current);
    setIndex(next);
  }

  if (loading) return <p className="muted">Loading reviews…</p>;
  if (error) return <p className="form-error">{error}</p>;
  if (reviews.length === 0) {
    return <p className="muted">No reviews yet - be the first verified student to share your experience.</p>;
  }

  const r = reviews[index];

  return (
    <div className="review-carousel">
      <div className="review-card" key={r._id}>
        <div className="review-avatar">
          {r.photoUrl ? <img src={r.photoUrl} alt={r.name} /> : r.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="review-name">
            {r.name} {r.featured && <span className="tag" style={{ marginLeft: 8 }}>★ Featured</span>}
          </div>
          {r.role && <div className="muted" style={{ fontSize: 13.5 }}>{r.role}</div>}
          <ReviewStars value={r.stars} readOnly />
          {r.text && <p className="review-text">{r.text}</p>}
        </div>
      </div>

      {reviews.length > 1 && (
        <div className="review-carousel-controls">
          <button
            type="button"
            className="review-carousel-arrow"
            aria-label="Previous review"
            onClick={() => goTo((index - 1 + reviews.length) % reviews.length)}
          >
            ‹
          </button>
          <span className="review-carousel-counter">
            {index + 1} / {reviews.length}
          </span>
          <button
            type="button"
            className="review-carousel-arrow"
            aria-label="Next review"
            onClick={() => goTo((index + 1) % reviews.length)}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
