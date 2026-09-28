import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { api } from '../api.js';
import { MODE_META, coursePath, offersMode, shortTitle } from '../../shared/course.js';

export default function Header() {
  const [open, setOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [courses, setCourses] = useState([]);
  const location = useLocation();

  useEffect(() => {
    api.getCourses().then(setCourses).catch(() => setCourses([]));
  }, []);

  // Close the mobile menu whenever the route changes.
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <>
      <div className="topbar">
        <div className="container">
          <div className="topbar-links">
            <a href="tel:+919810572736">📞 +91 98105 72736</a>
            <a href="mailto:launchpadenglish@gmail.com">✉️ launchpadenglish@gmail.com</a>
          </div>
          <div className="topbar-links">
            <span>Green Park, South Delhi</span>
          </div>
        </div>
      </div>

      <header className="site-header">
        <div className="container">
          <NavLink to="/" className="brand" onClick={() => setOpen(false)}>
            {logoFailed ? (
              <span className="brand-badge">LP</span>
            ) : (
              <img
                src="/images/logo.png"
                alt="Launch Pad English"
                className="brand-logo"
                onError={() => setLogoFailed(true)}
              />
            )}
          </NavLink>

          <nav className={`nav ${open ? 'open' : ''}`}>
            <NavLink to="/" end onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? 'active' : '')}>
              Home
            </NavLink>
            <NavLink to="/about" onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? 'active' : '')}>
              About
            </NavLink>

            <CourseDropdown mode="online" label="Online Courses" courses={courses} onNavigate={() => setOpen(false)} />
            <CourseDropdown mode="offline" label="Offline Courses" courses={courses} onNavigate={() => setOpen(false)} />

            <NavLink to="/counselling" onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? 'active' : '')}>
              Counselling
            </NavLink>
            <NavLink to="/blog" onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? 'active' : '')}>
              Blogs
            </NavLink>
            <NavLink to="/faqs" onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? 'active' : '')}>
              FAQs
            </NavLink>
            <NavLink to="/contact" onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? 'active' : '')}>
              Contact
            </NavLink>

            <Link to="/#courses" className="btn" onClick={() => setOpen(false)}>
              Enroll Now
            </Link>
          </nav>

          <button className="nav-toggle" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
            {open ? '✕' : '☰'}
          </button>
        </div>
      </header>
    </>
  );
}

// Click-to-toggle dropdown (works the same on desktop and mobile) listing
// only the courses offered in this mode - online and offline never mix.
// Each item links to that course's own page.
function CourseDropdown({ mode, label, courses, onNavigate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();
  const items = courses.filter((c) => offersMode(c, mode));
  const active = location.pathname.startsWith(MODE_META[mode].listingPath);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  function done() {
    setOpen(false);
    onNavigate();
  }

  return (
    <div className={`nav-dropdown ${open ? 'open' : ''}`} ref={ref}>
      <button
        type="button"
        className={`nav-dropdown-trigger ${active ? 'active' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {label} <span className="nav-dropdown-caret">▾</span>
      </button>
      <div className="nav-dropdown-menu">
        <Link to={MODE_META[mode].listingPath} className="nav-dropdown-all" onClick={done}>
          <i className={`fas ${MODE_META[mode].icon}`} /> All {label}
        </Link>
        {items.map((c) => (
          <Link key={c.slug} to={coursePath(mode, c.slug)} onClick={done}>
            {shortTitle(c.title)}
          </Link>
        ))}
      </div>
    </div>
  );
}
