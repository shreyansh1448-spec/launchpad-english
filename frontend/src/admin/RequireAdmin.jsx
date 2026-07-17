import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { api } from '../api.js';

// Gate for every /admin/* route except /admin/login. Re-checks the stored
// session token against the backend on mount so a stale/expired token
// bounces back to login instead of showing broken admin screens.
export default function RequireAdmin() {
  const [status, setStatus] = useState('checking'); // checking | ok | invalid

  useEffect(() => {
    if (!api.admin.getAdminToken()) {
      setStatus('invalid');
      return;
    }
    api.admin
      .me()
      .then(() => setStatus('ok'))
      .catch(() => {
        api.admin.clearAdminToken();
        setStatus('invalid');
      });
  }, []);

  if (status === 'checking') return <p className="center muted section">Checking admin access…</p>;
  if (status === 'invalid') return <Navigate to="/admin/login" replace />;
  return <Outlet />;
}
