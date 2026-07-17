import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';

export default function AdminAccount() {
  const [email, setEmail] = useState('');

  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSaved, setEmailSaved] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    api.admin
      .me()
      .then((data) => {
        setEmail(data.email);
        setNewEmail(data.email);
      })
      .catch(() => {});
  }, []);

  async function handleChangeEmail(e) {
    e.preventDefault();
    setEmailError('');
    setEmailSaved(false);
    setSavingEmail(true);
    try {
      const updated = await api.admin.changeEmail(currentPasswordForEmail, newEmail);
      setEmail(updated.email);
      setCurrentPasswordForEmail('');
      setEmailSaved(true);
    } catch (err) {
      setEmailError(err.message);
    } finally {
      setSavingEmail(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSaved(false);
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New password and confirm password do not match');
      return;
    }
    setSavingPassword(true);
    try {
      await api.admin.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordSaved(true);
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div>
      <h2>Account</h2>
      <p className="muted" style={{ fontSize: 13.5 }}>
        Logged in as <strong>{email}</strong>. Changing your email or password here updates your login for future
        visits.
      </p>

      <div className="grid grid-2">
        <form onSubmit={handleChangeEmail} className="card">
          <h3>Change Email</h3>
          {emailError && <div className="form-alert error">{emailError}</div>}
          {emailSaved && <div className="form-alert success">Email updated.</div>}
          <div className="form-group">
            <label>New Email</label>
            <input
              className="form-control"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Current Password</label>
            <input
              className="form-control"
              type="password"
              value={currentPasswordForEmail}
              onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-block" disabled={savingEmail}>
            {savingEmail ? <span className="spinner" /> : 'Update Email'}
          </button>
        </form>

        <form onSubmit={handleChangePassword} className="card">
          <h3>Change Password</h3>
          {passwordError && <div className="form-alert error">{passwordError}</div>}
          {passwordSaved && <div className="form-alert success">Password updated.</div>}
          <div className="form-group">
            <label>Current Password</label>
            <input
              className="form-control"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
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
          <button className="btn btn-block" disabled={savingPassword}>
            {savingPassword ? <span className="spinner" /> : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
