import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { api } from '../../api.js';

const ADMIN_NAV = [
  { to: '/admin/courses', label: 'Courses' },
  { to: '/admin/site-content', label: 'Site Content' },
  { to: '/admin/gallery', label: 'Gallery' },
  { to: '/admin/blog', label: 'Blogs' },
  { to: '/admin/reviews', label: 'Reviews' },
  { to: '/admin/leads', label: 'Leads' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/account', label: 'Account' },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  function handleLogout() {
    api.admin.clearAdminToken();
    navigate('/admin/login');
  }

  return (
    <div className="container section-tight">
      <div className="admin-shell">
        <aside className="admin-nav">
          {ADMIN_NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
              {item.label}
            </NavLink>
          ))}
          <button className="admin-nav-link admin-logout" onClick={handleLogout}>
            Log Out
          </button>
        </aside>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
