import React from 'react';

// Standalone "Watch Our Classroom Experience" section - pulled out of the
// hero slider so it isn't buried in a carousel. URL is admin-editable via
// SiteContent.youtubeUrl.
export default function YoutubeSection({ url }) {
  return (
    <div className="hero-video-wrap">
      <iframe
        src={url || 'https://www.youtube.com/embed/faFU7LFPtrw'}
        title="Launch Pad English classroom experience video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
