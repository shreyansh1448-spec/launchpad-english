import React, { useState } from 'react';
import { api } from '../api.js';
import ReviewStars from './ReviewStars.jsx';

const STEP_VERIFY = 'verify';
const STEP_CHOOSE = 'choose';
const STEP_WRITE = 'write';
const STEP_DONE = 'done';

// Gated review form, shown sitewide on the Home page (not per-course): the
// reviewer supplies the phone or email used at purchase time, we look up
// every *paid* order for that contact via GET /api/payment/my-orders, they
// pick which course to review (if they've bought more than one), and only
// then can they submit (POST /api/reviews, which re-checks server-side that
// the order is paid).
export default function ReviewForm() {
  const [step, setStep] = useState(STEP_VERIFY);
  const [contact, setContact] = useState('');
  const [orders, setOrders] = useState([]);
  const [matchedOrder, setMatchedOrder] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [stars, setStars] = useState(0);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState('');
  const [existingReview, setExistingReview] = useState(null);

  async function proceedToWrite(order) {
    setMatchedOrder(order);
    setName(order.name);
    setRole('');
    setStars(0);
    setText('');
    setPhoto('');
    setExistingReview(null);
    try {
      const existing = await api.getReviewByOrder(order._id);
      if (existing) {
        setExistingReview(existing);
        setName(existing.name || order.name);
        setRole(existing.role || '');
        setStars(existing.stars || 0);
        setText(existing.text || '');
        setPhoto(existing.photoUrl || '');
      }
    } catch {
      // No existing review found (or lookup failed) - fall back to a fresh form.
    }
    setStep(STEP_WRITE);
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const isEmail = contact.includes('@');
      const paidOrders = await api.myOrders(isEmail ? '' : contact, isEmail ? contact : '');
      if (paidOrders.length === 0) {
        setError('We couldn’t find a completed purchase with that phone/email. Purchase a course to unlock reviews.');
        setBusy(false);
        return;
      }
      if (paidOrders.length === 1) {
        await proceedToWrite(paidOrders[0]);
      } else {
        setOrders(paidOrders);
        setStep(STEP_CHOOSE);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function chooseOrder(order) {
    proceedToWrite(order);
  }

  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Photo must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!stars) return setError('Please select a star rating');
    if (!text.trim()) return setError('Please write a short review');
    setBusy(true);
    try {
      if (existingReview) {
        await api.putReview(matchedOrder._id, {
          courseSlug: matchedOrder.courseSlug,
          name,
          role,
          stars,
          text,
          photoUrl: photo,
        });
      } else {
        await api.postReview({
          orderId: matchedOrder._id,
          courseSlug: matchedOrder.courseSlug,
          name,
          role,
          stars,
          text,
          photoUrl: photo,
        });
      }
      setStep(STEP_DONE);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (step === STEP_DONE) {
    return (
      <div className="form-alert success">
        {existingReview ? 'Your review has been updated.' : 'Thank you! Your review has been posted.'}
      </div>
    );
  }

  if (step === STEP_VERIFY) {
    return (
      <form onSubmit={handleVerify}>
        {error && <div className="form-alert error">{error}</div>}
        <div className="form-group">
          <label>Phone or email used during purchase</label>
          <input
            className="form-control"
            placeholder="e.g. 9810572736 or you@email.com"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            required
          />
        </div>
        <button className="btn btn-navy btn-block" disabled={busy}>
          {busy ? <span className="spinner" /> : 'Verify Purchase & Continue'}
        </button>
      </form>
    );
  }

  if (step === STEP_CHOOSE) {
    return (
      <div>
        <p className="form-hint">Which course would you like to review?</p>
        {orders.map((o) => (
          <button
            type="button"
            key={o._id}
            className="btn btn-navy btn-block mt-24"
            style={{ marginBottom: 10 }}
            onClick={() => chooseOrder(o)}
          >
            {o.courseTitle} ({o.mode === 'online' ? 'Online' : 'Offline'})
          </button>
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="form-alert error">{error}</div>}
      <p className="form-hint">
        {existingReview ? 'Editing your review for' : 'Reviewing'}: <strong>{matchedOrder.courseTitle}</strong> ({matchedOrder.mode === 'online' ? 'Online' : 'Offline'})
      </p>
      <div className="form-group">
        <label>Your Rating</label>
        <ReviewStars value={stars} onChange={setStars} />
      </div>
      <div className="form-group">
        <label>Name</label>
        <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Role / Title (optional)</label>
        <input
          className="form-control"
          placeholder="e.g. BPSC Account Officer"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>Photo (optional)</label>
        <input className="form-control" type="file" accept="image/*" onChange={handlePhoto} />
        {photo && <img src={photo} alt="preview" style={{ width: 60, height: 60, borderRadius: 10, marginTop: 8, objectFit: 'cover' }} />}
      </div>
      <div className="form-group">
        <label>Your Review</label>
        <textarea className="form-control" value={text} onChange={(e) => setText(e.target.value)} required />
      </div>
      <button className="btn btn-block" disabled={busy}>
        {busy ? <span className="spinner" /> : existingReview ? 'Update Review' : 'Submit Review'}
      </button>
    </form>
  );
}
