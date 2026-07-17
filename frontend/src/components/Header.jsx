import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function Header() {
  const [open, setOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [courses, setCourses] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    api.getCourses().then(setCourses).catch(() => setCourses([]));
  }, []);

  function scrollOrNavigate(e, anchor) {
    e.preventDefault();
    setOpen(false);
    if (location.pathname === '/') {
      document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(`/#${anchor}`);
    }
  }

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
              About Us
            </NavLink>

            <CourseDropdown mode="online" label="Online Courses" courses={courses} onNavigate={() => setOpen(false)} />
            <CourseDropdown mode="offline" label="Offline Courses" courses={courses} onNavigate={() => setOpen(false)} />

            <NavLink to="/counselling" onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? 'active' : '')}>
              Counselling
            </NavLink>
            <a href="/#batch-timings" onClick={(e) => scrollOrNavigate(e, 'batch-timings')}>
              Batch Timings
            </a>
            <a href="/#gallery" onClick={(e) => scrollOrNavigate(e, 'gallery')}>
              Gallery
            </a>
            <NavLink to="/faqs" onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? 'active' : '')}>
              FAQs
            </NavLink>
            <NavLink to="/contact" onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? 'active' : '')}>
              Contact
            </NavLink>

            <a href="/#courses" className="btn" onClick={(e) => scrollOrNavigate(e, 'courses')}>
              Enroll Now
            </a>
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
// all courses for a given mode; each item scrolls straight to that course's
// card on the Online/Offline Courses listing page instead of opening a new page.
function CourseDropdown({ mode, label, courses, onNavigate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function goToCourse(slug) {
    setOpen(false);
    onNavigate();
    const path = `/${mode}-courses`;
    if (location.pathname === path) {
      document.getElementById(slug)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(`${path}#${slug}`);
    }
  }

  return (
    <div className={`nav-dropdown ${open ? 'open' : ''}`} ref={ref}>
      <button type="button" className="nav-dropdown-trigger" onClick={() => setOpen((o) => !o)}>
        {label} <span className="nav-dropdown-caret">▾</span>
      </button>
      <div className="nav-dropdown-menu">
        {courses.map((c) => (
          <button type="button" key={c.slug} onClick={() => goToCourse(c.slug)}>
            {c.title.replace(/ Course$| Program.*$/, '')}
          </button>
        ))}
      </div>
    </div>
  );
}
