import React from 'react';

// readOnly display (review cards) or interactive picker (review form).
export default function ReviewStars({ value = 0, onChange, readOnly = false }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <span className={`stars ${readOnly ? '' : 'interactive'}`}>
      {stars.map((s) => (
        <span
          key={s}
          className={`star ${s <= value ? 'filled' : ''}`}
          onClick={readOnly ? undefined : () => onChange && onChange(s)}
          role={readOnly ? undefined : 'button'}
          aria-label={readOnly ? undefined : `Rate ${s} star${s > 1 ? 's' : ''}`}
        >
          ★
        </span>
      ))}
    </span>
  );
}
