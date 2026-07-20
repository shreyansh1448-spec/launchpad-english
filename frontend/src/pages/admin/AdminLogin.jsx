import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api.js';

const STEP_LOGIN = 'login';
const STEP_FORGOT = 'forgot';
const STEP_RESET = 'reset';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEP_LOGIN);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [forgotEmail, setForgotEmail] = useState('');
  const [devResetToken, setDevResetToken] = useState('');

  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { token } = await api.admin.login(email, password);
      api.admin.setAdminToken(token);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await api.admin.forgotPassword(forgotEmail);
      setDevResetToken(res.devResetToken || '');
      setResetToken(res.devResetToken || '');
      setStep(STEP_RESET);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmNewPassword) {
      setError('New password and confirm password do not match');
      return;
    }
    setBusy(true);
    try {
      const { token } = await api.admin.resetPassword(resetToken, newPassword);
      api.admin.setAdminToken(token);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container section" style={{ maxWidth: 420 }}>
      <div className="card">
        {step === STEP_LOGIN && (
          <>
            <h2>Admin Login</h2>
            <p className="muted" style={{ fontSize: 13.5 }}>
              Log in to manage courses, site content, gallery, reviews, leads and orders.
            </p>
            <form onSubmit={handleLogin}>
              {error && <div className="form-alert error">{error}</div>}
              <div className="form-group">
                <label>Email</label>
                <input
                  className="form-control"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  className="form-control"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button className="btn btn-block" disabled={busy}>
                {busy ? <span className="spinner" /> : 'Log In'}
              </button>
              <p className="form-hint center" style={{ marginTop: 14 }}>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => {
                    setError('');
                    setForgotEmail(email);
                    setStep(STEP_FORGOT);
                  }}
                >
                  Forgot password?
                </button>
              </p>
            </form>
          </>
        )}

        {step === STEP_FORGOT && (
          <>
            <h2>Forgot Password</h2>
            <p className="muted" style={{ fontSize: 13.5 }}>
              Enter your admin email and we'll generate a password reset link.
            </p>
            <form onSubmit={handleForgotPassword}>
              {error && <div className="form-alert error">{error}</div>}
              <div className="form-group">
                <label>Email</label>
                <input
                  className="form-control"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <button className="btn btn-block" disabled={busy}>
                {busy ? <span className="spinner" /> : 'Send Reset Link'}
              </button>
              <p className="form-hint center" style={{ marginTop: 14 }}>
                <button type="button" className="link-btn" onClick={() => { setError(''); setStep(STEP_LOGIN); }}>
                  ← Back to login
                </button>
              </p>
            </form>
          </>
        )}

        {step === STEP_RESET && (
          <>
            <h2>Reset Password</h2>
            <p className="muted" style={{ fontSize: 13.5 }}>
              {devResetToken
                ? <>No email provider is configured yet, so this is demo mode - the reset token is shown below instead of
                  being emailed. Wire in a real email provider in <code>backend/routes/adminAuth.js</code> to send it for
                  real.</>
                : 'We\'ve emailed a reset token to your admin email address. Paste it below along with your new password.'}
            </p>
            <form onSubmit={handleResetPassword}>
              {error && <div className="form-alert error">{error}</div>}
              <div className="form-group">
                <label>Reset Token</label>
                <input
                  className="form-control"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  required
                />
                {devResetToken && <p className="form-hint">Demo mode - token generated: {devResetToken}</p>}
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  className="form-control"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  required
                  autoFocus
                />
                <p className="form-hint">At least 8 characters.</p>
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  className="form-control"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <button className="btn btn-block" disabled={busy}>
                {busy ? <span className="spinner" /> : 'Reset Password & Log In'}
              </button>
              <p className="form-hint center" style={{ marginTop: 14 }}>
                <button type="button" className="link-btn" onClick={() => { setError(''); setStep(STEP_LOGIN); }}>
                  ← Back to login
                </button>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
