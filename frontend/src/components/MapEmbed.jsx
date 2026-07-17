import React from 'react';
import MapPinIcon from './MapPinIcon.jsx';

// Google Maps iframe embed with a "Show on Google Map" badge floating over
// its top-left corner, linking out to the real place listing.
export default function MapEmbed({ lat, lng, placeUrl }) {
  return (
    <div className="map-embed">
      <a
        className="map-embed-badge"
        href={placeUrl || 'https://maps.app.goo.gl/FRorYAGZGYHqL8Z96'}
        target="_blank"
        rel="noreferrer"
      >
        <MapPinIcon size={14} /> Show on Google Map
      </a>
      <iframe
        src={`https://www.google.com/maps?q=${lat},${lng}&z=16&output=embed`}
        title="Launch Pad English location on Google Maps"
        loading="lazy"
      />
    </div>
  );
}
