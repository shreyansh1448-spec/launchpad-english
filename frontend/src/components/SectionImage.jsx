import React, { useState } from 'react';

// Decorative "look good" photo used alongside homepage copy (About, Why
// Choose Us, Learning Method, Achievements). These are static files placed
// in frontend/public/images/ - not database-managed - so this component
// simply hides itself if the file hasn't been placed yet, instead of
// showing a broken image icon.
export default function SectionImage({ src, alt }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <div className="section-image">
      <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
    </div>
  );
}
