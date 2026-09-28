import React, { useEffect, useState } from 'react';
import { MODE_META } from '../../shared/course.js';

// Search box + mode / course / payment-status filters shared by the
// Students and Orders pages. Search is debounced; selects apply instantly.
export default function OrderFilters({ filters, onChange, courses }) {
  const [search, setSearch] = useState(filters.search || '');

  useEffect(() => {
    if (search === (filters.search || '')) return undefined;
    const t = setTimeout(() => onChange({ ...filters, search }), 350);
    return () => clearTimeout(t);
  }, [search, filters, onChange]);

  return (
    <div className="admin-toolbar">
      <input
        className="form-control toolbar-search"
        placeholder="Search name, phone, email, course or payment ID…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <select className="form-control toolbar-select" value={filters.mode || ''} onChange={(e) => onChange({ ...filters, mode: e.target.value })} aria-label="Mode">
        <option value="">All modes</option>
        {Object.keys(MODE_META).map((m) => (
          <option key={m} value={m}>
            {MODE_META[m].label}
          </option>
        ))}
      </select>
      <select className="form-control toolbar-select" value={filters.course || ''} onChange={(e) => onChange({ ...filters, course: e.target.value })} aria-label="Course">
        <option value="">All courses</option>
        {courses.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.title}
          </option>
        ))}
      </select>
      <select className="form-control toolbar-select" value={filters.status || ''} onChange={(e) => onChange({ ...filters, status: e.target.value })} aria-label="Payment status">
        <option value="">All payments</option>
        <option value="paid">Paid</option>
        <option value="created">Pending</option>
        <option value="failed">Failed</option>
      </select>
    </div>
  );
}

export const PAYMENT_STATUS = {
  paid: ['badge-success', 'Paid'],
  created: ['badge-warning', 'Pending'],
  failed: ['badge-danger', 'Failed'],
};

export function downloadCsv(filename, rows) {
  const csv = rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
