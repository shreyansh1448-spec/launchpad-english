import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import PriceTag from './PriceTag.jsx';

// Compact preview card used on the Home page. One combined card per course -
// mode (online/offline) is picked inside the purchase modal, not here.
export default function CourseCard({ course, onPurchase }) {
  const { online, offline } = course.pricing;
  const startingPrice = online && offline ? (online.offer <= offline.offer ? online : offline) : online || offline;
  const [showModeChooser, setShowModeChooser] = useState(false);
  const navigate = useNavigate();

  function goToDetails(mode) {
    setShowModeChooser(false);
    navigate(`/${mode}-courses#${course.slug}`);
  }

  return (
    <div className="card course-card hover-lift">
      <span className="badge">{course.level}</span>
      <h3>{course.title}</h3>
      <p className="meta">⏱ {course.duration}</p>
      <p>{course.tagline}</p>
      <div className="tag-row">
        <span className="tag">💻🏫 Online &amp; Offline</span>
      </div>

      <div className="spacer" />

      <span className="course-mode-label">Starting Price</span>
      <PriceTag mrp={startingPrice.mrp} offer={startingPrice.offer} />

      <div className="course-card-actions">
        <button className="btn btn-navy btn-sm" onClick={() => setShowModeChooser(true)}>
          View Details
        </button>
        <button className="btn btn-sm" onClick={() => onPurchase(course)}>
          Purchase Course
        </button>
      </div>

      {showModeChooser &&
        createPortal(
          <div className="modal-overlay" onClick={() => setShowModeChooser(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowModeChooser(false)} aria-label="Close">
                ✕
              </button>
              <h3>View Course Details</h3>
              <div className="sub">{course.title} - select online or offline to continue</div>
              <div className="mode-picker">
                {['online', 'offline'].map((m) => {
                  const p = course.pricing[m];
                  if (!p) return null;
                  return (
                    <button type="button" className="mode-picker-option" key={m} onClick={() => goToDetails(m)}>
                      <span className="mode-picker-label">{m === 'online' ? '💻 Online' : '🏫 Offline'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
