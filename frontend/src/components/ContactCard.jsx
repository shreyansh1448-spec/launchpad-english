import React from 'react';
import WhatsAppIcon from './WhatsAppIcon.jsx';
import MapPinIcon from './MapPinIcon.jsx';

const SOCIAL_ICONS = [
  { key: 'instagram', iconClass: 'fa-instagram', label: 'Instagram' },
  { key: 'facebook', iconClass: 'fa-facebook-f', label: 'Facebook' },
  { key: 'linkedin', iconClass: 'fa-linkedin-in', label: 'LinkedIn' },
  { key: 'youtube', iconClass: 'fa-youtube', label: 'YouTube' },
  { key: 'x', iconClass: 'fa-x-twitter', label: 'X (Twitter)' },
];

// Premium contact card - address/phone/email/hours plus WhatsApp/Call/
// Directions buttons and social icons, all sourced from SiteContent so
// admins can update every link without touching code.
export default function ContactCard({ content }) {
  const phone = content?.phone || '+91 98105 72736';
  const whatsapp = content?.whatsapp || '919810572736';
  const email = content?.email || 'launchpadenglish@gmail.com';
  const address =
    content?.address || 'Thapar House, behind Axis Bank, Gautam Nagar, Green Park Metro Station Gate No. 2, New Delhi, 110049';
  const workingHours = content?.workingHours || 'Mon - Sat, 9:00 AM - 9:00 PM';
  const social = content?.social || {};

  return (
    <div className="card contact-card">
      <h2>Get In Touch</h2>
      <div className="contact-info-row">
        <span className="contact-info-icon">📍</span>
        <span>{address}</span>
      </div>
      <div className="contact-info-row">
        <span className="contact-info-icon">📞</span>
        <a href={`tel:${phone.replace(/\s/g, '')}`}>{phone}</a>
      </div>
      <div className="contact-info-row">
        <span className="contact-info-icon">✉️</span>
        <a href={`mailto:${email}`}>{email}</a>
      </div>
      <div className="contact-info-row">
        <span className="contact-info-icon">🕒</span>
        <span>{workingHours}</span>
      </div>

      <div className="contact-card-actions">
        <a
          className="btn btn-whatsapp btn-sm"
          href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Hi, I have a question about Launch Pad English courses.')}`}
          target="_blank"
          rel="noreferrer"
        >
          <WhatsAppIcon /> WhatsApp
        </a>
        <a className="btn btn-navy btn-sm" href={`tel:${phone.replace(/\s/g, '')}`}>
          📞 Call Now
        </a>
        <a
          className="btn btn-sm"
          href={content?.mapPlaceUrl || 'https://maps.app.goo.gl/FRorYAGZGYHqL8Z96'}
          target="_blank"
          rel="noreferrer"
        >
          <MapPinIcon /> Get Directions
        </a>
      </div>

      {SOCIAL_ICONS.some((s) => social[s.key]) && (
        <div className="social-icons">
          {SOCIAL_ICONS.filter((s) => social[s.key]).map((s) => (
            <a
              href={social[s.key]}
              target="_blank"
              rel="noreferrer"
              key={s.key}
              title={s.label}
              aria-label={s.label}
              className={`social-icon-${s.key}`}
            >
              <i className={`fab ${s.iconClass}`} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
