import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

// Site-wide floating action buttons, fixed bottom-right on every page -
// WhatsApp (green) above Call (blue). Numbers come from SiteContent so
// they stay in sync with the rest of the site.
export default function FloatingContact() {
  const [content, setContent] = useState(null);

  useEffect(() => {
    api.getSiteContent().then(setContent).catch(() => setContent(null));
  }, []);

  const phone = content?.phone || '+91 98105 72736';
  const whatsapp = content?.whatsapp || '919810572736';

  return (
    <div className="floating-contact">
      <a
        className="floating-btn floating-whatsapp"
        href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Hi, I have a question about Launch Pad English courses.')}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        title="Chat on WhatsApp"
      >
        <i className="fab fa-whatsapp" />
      </a>
      <a
        className="floating-btn floating-call"
        href={`tel:${phone.replace(/\s/g, '')}`}
        aria-label="Call us"
        title="Call us"
      >
        <i className="fas fa-phone" />
      </a>
    </div>
  );
}
