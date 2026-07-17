import React from 'react';

// Google Maps style location pin (red teardrop, black outline, black dot) -
// matching the reference icon the user provided - used inline right before
// "Get Directions".
export default function MapPinIcon({ size = 18, style, ...props }) {
  return (
    <svg
      width={size}
      height={size * 1.15}
      viewBox="0 0 24 26"
      style={{ flexShrink: 0, ...style }}
      {...props}
    >
      <path
        d="M20 10c0 6-8 14-8 14s-8-8-8-14a8 8 0 0 1 16 0Z"
        fill="#EA1B1B"
        stroke="#000"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="3.2" fill="#000" />
    </svg>
  );
}
