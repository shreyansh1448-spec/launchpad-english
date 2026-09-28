import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../api.js';
import OrderFilters, { PAYMENT_STATUS, downloadCsv } from '../../admin/OrderFilters.jsx';
import { MODE_META } from '../../../shared/course.js';

function date(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Student admissions view of the orders table - who enrolled in what, which
// mode and batch. Defaults to paid enrollments.
export default function AdminStudents() {
  const [courses, setCourses] = useState([]);
  const [filters, setFilters] = useState({ status: 'paid' });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.admin.listCourses().then(setCourses).catch(() => setCourses([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    api.admin
      .listOrders(filters)
      .then(setStudents)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters]);

  const onFilters = useCallback((f) => setFilters(f), []);

  function exportCsv() {
    downloadCsv('students.csv', [
      ['Name', 'Phone', 'Email', 'Course', 'Mode', 'Batch', 'Payment Status', 'Enrollment Date'],
      ...students.map((s) => [s.name, s.phone, s.email, s.courseTitle, MODE_META[s.mode]?.label, s.batchLabel, PAYMENT_STATUS[s.status]?.[1], date(s.createdAt)]),
    ]);
  }

  return (
    <div className="cms-page">
      <div className="cms-page-head">
        <div>
          <h1>Students</h1>
          <p className="muted">Everyone who enrolled - online payments and cash admissions.</p>
        </div>
        <div className="cms-page-actions">
          <button type="button" className="btn btn-sm btn-outline" onClick={exportCsv} disabled={!students.length}>
            <i className="fas fa-download" /> Export CSV
          </button>
        </div>
      </div>

      <OrderFilters filters={filters} onChange={onFilters} courses={courses} />
      {error && <div className="form-alert error">{error}</div>}

      {loading ? (
        <p className="muted">Loading students…</p>
      ) : students.length === 0 ? (
        <div className="empty-panel">
          <p>No students match these filters.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <p className="muted table-count">{students.length} record{students.length === 1 ? '' : 's'}</p>
          <table className="admin-table admin-table-cards">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Course</th>
                <th>Mode</th>
                <th>Batch</th>
                <th>Payment</th>
                <th>Enrolled</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s._id}>
                  <td data-label="Name">
                    <strong>{s.name}</strong>
                  </td>
                  <td data-label="Phone">
                    <a href={`tel:${s.phone}`}>{s.phone}</a>
                  </td>
                  <td data-label="Email">{s.email}</td>
                  <td data-label="Course">{s.courseTitle}</td>
                  <td data-label="Mode">
                    <span className={`mode-pill mode-pill-${s.mode}`}>{MODE_META[s.mode]?.label}</span>
                  </td>
                  <td data-label="Batch">{s.batchLabel || '—'}</td>
                  <td data-label="Payment">
                    <span className="badge-group">
                      <span className={PAYMENT_STATUS[s.status]?.[0]}>{PAYMENT_STATUS[s.status]?.[1]}</span>
                      {s.paymentMethod === 'cash' && <span className="badge-muted">Cash</span>}
                    </span>
                  </td>
                  <td data-label="Enrolled">{date(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
