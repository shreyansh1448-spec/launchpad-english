import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

const STORAGE_KEY = 'lpe_counselling_popup_shown';
const SHOW_DELAY_MS = 4000;

// Shown once, a few seconds after a visitor's first-ever page load (tracked
// via localStorage so it doesn't reappear on later visits or page changes).
// Lets them request a free counselling callback right from the popup, or
// jump to the full Counselling page.
export default function CounsellingPopup() {
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState(null); // 'success' | 'error'
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.submitLead({ type: 'counselling', name, phone, message: 'Requested via first-visit popup' });
      setStatus('success');
      localStorage.setItem(STORAGE_KEY, '1');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function goToCounselling() {
    dismiss();
    navigate('/counselling');
  }

  if (!visible) return null;

  return createPortal(
    <div className="modal-overlay" onClick={dismiss}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={dismiss} aria-label="Close">
          ✕
        </button>

        {status === 'success' ? (
          <>
            <h3>🎉 Thank You!</h3>
            <p className="sub">Our counselling team will call you back shortly.</p>
            <button className="btn btn-block" onClick={dismiss}>
              Done
            </button>
          </>
        ) : (
          <>
            <h3>🎓 Free Career &amp; Course Counselling</h3>
            <div className="sub">
              Not sure which course fits you best? Share your number and our counselling team will call you back -
              free, no obligation.
            </div>

            <form onSubmit={handleSubmit}>
              {error && <div className="form-alert error">{error}</div>}
              <div className="form-group">
                <label>Full Name</label>
                <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  className="form-control"
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <button className="btn btn-block" disabled={busy}>
                {busy ? <span className="spinner" /> : 'Request Free Callback'}
              </button>
            </form>

            <p className="form-hint center" style={{ marginTop: 14 }}>
              <button type="button" className="link-btn" onClick={goToCounselling}>
                Or visit the full Counselling page →
              </button>
            </p>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
