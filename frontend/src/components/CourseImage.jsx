import React, { useState } from 'react';

function iconFor(category = '') {
  const c = category.toLowerCase();
  if (c.includes('exam') || c.includes('ielts') || c.includes('pte')) return 'fa-graduation-cap';
  if (c.includes('spoken') || c.includes('speak')) return 'fa-comments';
  if (c.includes('business') || c.includes('interview')) return 'fa-briefcase';
  return 'fa-book-open';
}

// Course thumbnail/hero image with a branded fallback cover, so a course
// created without an image still looks finished.
export default function CourseImage({ course, src, alt, className = '', eager = false }) {
  const [failed, setFailed] = useState(false);
  const url = src ?? course?.thumbnail;
  if (url && !failed) {
    return (
      <img
        className={`cc-img ${className}`}
        src={url}
        alt={alt || course?.title || ''}
        loading={eager ? 'eager' : 'lazy'}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div className={`cc-img cc-img-fallback ${className}`} role="img" aria-label={alt || course?.title || ''}>
      <i className={`fas ${iconFor(course?.category)}`} aria-hidden="true" />
      <span>{course?.category || 'Launch Pad English'}</span>
    </div>
  );
}
