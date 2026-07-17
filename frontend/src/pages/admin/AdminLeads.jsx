import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';

export default function AdminLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.admin
      .listLeads()
      .then(setLeads)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2>Leads</h2>
      <p className="muted" style={{ fontSize: 13.5 }}>
        Contact and counselling form submissions from the public site, newest first.
      </p>
      {error && <div className="form-alert error">{error}</div>}
      {loading ? (
        <p className="muted">Loading leads…</p>
      ) : leads.length === 0 ? (
        <p className="muted">No leads yet.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Course Type</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l._id}>
                <td className="muted">{new Date(l.createdAt).toLocaleString()}</td>
                <td>{l.type}</td>
                <td>{l.name}</td>
                <td>{l.phone}</td>
                <td>{l.email || '—'}</td>
                <td>{l.courseType || '—'}</td>
                <td style={{ maxWidth: 280 }}>{l.message || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
