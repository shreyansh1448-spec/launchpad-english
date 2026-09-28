import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { MODE_META, coursePath, offersMode, shortTitle } from '../../shared/course.js';

const SOCIAL_ICONS = [
  { key: 'instagram', iconClass: 'fa-instagram', label: 'Instagram' },
  { key: 'facebook', iconClass: 'fa-facebook-f', label: 'Facebook' },
  { key: 'linkedin', iconClass: 'fa-linkedin-in', label: 'LinkedIn' },
  { key: 'youtube', iconClass: 'fa-youtube', label: 'YouTube' },
  { key: 'x', iconClass: 'fa-x-twitter', label: 'X (Twitter)' },
];

export default function Footer() {
  const [logoFailed, setLogoFailed] = useState(false);
  const [content, setContent] = useState(null);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    api.getSiteContent().then(setContent).catch(() => setContent(null));
    api.getCourses().then(setCourses).catch(() => setCourses([]));
  }, []);

  const social = content?.social || {};

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid footer-grid-5">
          <div>
            {!logoFailed && (
              <img
                src="/images/logo.png"
                alt="Launch Pad English"
                className="footer-logo"
                onError={() => setLogoFailed(true)}
              />
            )}
            <h4>Launch Pad English</h4>
            <p style={{ color: '#b9c9ea', fontSize: 14 }}>
              At Launch Pad English, we make English learning fun and effective. Spoken English, IELTS &amp; PTE
              coaching - online and offline - in South Delhi.
            </p>
          </div>
          {['online', 'offline'].map((mode) => (
            <div key={mode}>
              <h4>
                <Link to={MODE_META[mode].listingPath}>{MODE_META[mode].listingTitle}</Link>
              </h4>
              {courses
                .filter((c) => offersMode(c, mode))
                .map((c) => (
                  <Link key={c.slug} to={coursePath(mode, c.slug)}>
                    {shortTitle(c.title)}
                  </Link>
                ))}
            </div>
          ))}
          <div>
            <h4>Quick Links</h4>
            <Link to="/">Home</Link>
            <Link to="/about">About Us</Link>
            <Link to="/gallery">Gallery</Link>
            <Link to="/counselling">Counselling</Link>
            <Link to="/blog">Blogs</Link>
            <Link to="/faqs">FAQs</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/admin/login">Admin</Link>
          </div>
          <div>
            <h4>Contact</h4>
            <a href="tel:+919810572736">+91 98105 72736</a>
            <a href="mailto:launchpadenglish@gmail.com">launchpadenglish@gmail.com</a>
            <a
              href="https://maps.app.goo.gl/FRorYAGZGYHqL8Z96"
              target="_blank"
              rel="noreferrer"
            >
              Thapar House, Gautam Nagar, Green Park Metro Gate No. 2, New Delhi 110049
            </a>
            {SOCIAL_ICONS.some((s) => social[s.key]) && (
              <div className="social-icons social-icons-footer">
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
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Launch Pad English. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms-and-conditions">Terms &amp; Conditions</Link>
            <Link to="/cancellation-refund-policy">Cancellation &amp; Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
