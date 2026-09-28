import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../api.js';

const ADMIN_NAV = [
  { group: null, items: [{ to: '/admin', label: 'Dashboard', icon: 'fa-gauge-high', end: true }] },
  {
    group: 'Catalog',
    items: [
      { to: '/admin/courses', label: 'Courses', icon: 'fa-book-open' },
      { to: '/admin/batches', label: 'Batch Timings', icon: 'fa-clock' },
    ],
  },
  {
    group: 'Enrollments',
    items: [
      { to: '/admin/students', label: 'Students', icon: 'fa-user-graduate' },
      { to: '/admin/orders', label: 'Orders', icon: 'fa-receipt' },
      { to: '/admin/leads', label: 'Leads', icon: 'fa-inbox' },
    ],
  },
  {
    group: 'Website',
    items: [
      { to: '/admin/home-page', label: 'Home Page', icon: 'fa-house' },
      { to: '/admin/site-content', label: 'Site Content', icon: 'fa-sliders' },
      { to: '/admin/gallery', label: 'Gallery', icon: 'fa-images' },
      { to: '/admin/blog', label: 'Blogs', icon: 'fa-pen-nib' },
      { to: '/admin/reviews', label: 'Reviews', icon: 'fa-star' },
    ],
  },
  { group: 'Settings', items: [{ to: '/admin/account', label: 'Account', icon: 'fa-user-gear' }] },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  function handleLogout() {
    api.admin.clearAdminToken();
    navigate('/admin/login');
  }

  return (
    <div className="cms">
      <header className="cms-topbar">
        <button type="button" className="cms-menu-btn" onClick={() => setMenuOpen((o) => !o)} aria-label="Toggle admin menu">
          <i className={`fas ${menuOpen ? 'fa-xmark' : 'fa-bars'}`} />
        </button>
        <Link to="/admin" className="cms-brand">
          <img src="/images/logo.png" alt="" />
          <span>Admin</span>
        </Link>
        <div className="cms-topbar-actions">
          <a href="/" target="_blank" rel="noreferrer" className="cms-topbar-link">
            <i className="fas fa-arrow-up-right-from-square" /> <span>View Website</span>
          </a>
          <button type="button" className="cms-topbar-link" onClick={handleLogout}>
            <i className="fas fa-right-from-bracket" /> <span>Log Out</span>
          </button>
        </div>
      </header>

      <aside className={`cms-sidebar ${menuOpen ? 'open' : ''}`}>
        {ADMIN_NAV.map((section, i) => (
          <div className="cms-nav-group" key={section.group || i}>
            {section.group && <div className="cms-nav-heading">{section.group}</div>}
            {section.items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `cms-nav-link ${isActive ? 'active' : ''}`}>
                <i className={`fas ${item.icon}`} /> {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </aside>
      {menuOpen && <div className="cms-backdrop" onClick={() => setMenuOpen(false)} />}

      <main className="cms-main">
        <Outlet />
      </main>
    </div>
  );
}
