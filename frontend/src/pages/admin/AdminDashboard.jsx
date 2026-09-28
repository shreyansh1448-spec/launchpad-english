import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import { MODE_META } from '../../../shared/course.js';

function rupees(n) {
  return `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;
}

function when(iso) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

const STATUS_CLASS = { paid: 'badge-success', created: 'badge-warning', failed: 'badge-danger' };
const STATUS_LABEL = { paid: 'Paid', created: 'Pending', failed: 'Failed' };

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.admin.getDashboard().then(setData).catch((err) => setError(err.message));
  }, []);

  const cards = data
    ? [
        { label: 'Total Courses', value: data.totalCourses, icon: 'fa-book-open', to: '/admin/courses', sub: `${data.publishedCourses} published` },
        { label: 'Online Courses', value: data.onlineCourses, icon: 'fa-laptop', to: '/admin/courses?mode=online' },
        { label: 'Offline Courses', value: data.offlineCourses, icon: 'fa-chalkboard-user', to: '/admin/courses?mode=offline' },
        { label: 'Active Batches', value: data.activeBatches, icon: 'fa-clock', to: '/admin/batches' },
        { label: 'Total Enrollments', value: data.totalEnrollments, icon: 'fa-user-graduate', to: '/admin/students' },
        { label: 'Total Revenue', value: rupees(data.totalRevenue), icon: 'fa-indian-rupee-sign', to: '/admin/orders?status=paid' },
      ]
    : [];

  return (
    <div className="cms-page">
      <div className="cms-page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Everything on the website - courses, prices, batches and enrollments - is managed from here.</p>
        </div>
        <div className="cms-page-actions">
          <Link className="btn btn-sm" to="/admin/courses/new">
            <i className="fas fa-plus" /> Add Course
          </Link>
          <Link className="btn btn-sm btn-outline" to="/admin/batches">
            <i className="fas fa-clock" /> Manage Batches
          </Link>
        </div>
      </div>

      {error && <div className="form-alert error">{error}</div>}
      {!data && !error && <p className="muted">Loading…</p>}

      {data && (
        <>
          <div className="stat-grid">
            {cards.map((c) => (
              <Link to={c.to} className="stat-tile" key={c.label}>
                <span className="stat-tile-icon">
                  <i className={`fas ${c.icon}`} />
                </span>
                <span className="stat-tile-value">{c.value}</span>
                <span className="stat-tile-label">{c.label}</span>
                {c.sub && <span className="stat-tile-sub">{c.sub}</span>}
              </Link>
            ))}
          </div>

          <div className="cms-two-col">
            <section className="admin-panel">
              <div className="admin-panel-head">
                <h2>Recent Orders</h2>
                <Link to="/admin/orders">View all</Link>
              </div>
              {data.recentOrders.length === 0 ? (
                <p className="muted">No orders yet.</p>
              ) : (
                <ul className="activity-list">
                  {data.recentOrders.map((o) => (
                    <li key={o._id}>
                      <div>
                        <strong>{o.name}</strong>
                        <span className="muted">
                          {o.courseTitle} · {MODE_META[o.mode]?.label}
                        </span>
                      </div>
                      <div className="activity-right">
                        <span>{rupees(o.amount / 100)}</span>
                        <span className={STATUS_CLASS[o.status]}>{STATUS_LABEL[o.status]}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="admin-panel">
              <div className="admin-panel-head">
                <h2>Recent Students</h2>
                <Link to="/admin/students">View all</Link>
              </div>
              {data.recentStudents.length === 0 ? (
                <p className="muted">No enrollments yet.</p>
              ) : (
                <ul className="activity-list">
                  {data.recentStudents.map((o) => (
                    <li key={o._id}>
                      <div>
                        <strong>{o.name}</strong>
                        <span className="muted">
                          {o.phone} · {o.batchLabel || MODE_META[o.mode]?.label}
                        </span>
                      </div>
                      <div className="activity-right">
                        <span className="muted">{when(o.createdAt)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
