import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../api.js';
import PriceTag from './PriceTag.jsx';
import { MODE_META, batchLabel, priceFor, formatPrice, BATCH_STATUS_LABEL } from '../../shared/course.js';
import { formatDate } from './BatchTimings.jsx';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const STEP_FORM = 'form';
const STEP_PAYING = 'paying';
const STEP_SUCCESS = 'success';

// Enrollment + payment modal for ONE course in ONE mode - an online page
// can only ever start an online enrollment, and vice versa.
// On open it re-fetches the course so the price and batch list are current;
// the backend still looks the price up again when creating the Razorpay
// order, so whatever the browser shows is never trusted for the charge.
export default function RegistrationModal({ course: initialCourse, mode, initialBatchId, onClose }) {
  const [course, setCourse] = useState(initialCourse.batches ? initialCourse : null);
  const [loadError, setLoadError] = useState('');
  const [batchId, setBatchId] = useState(initialBatchId || '');

  const [step, setStep] = useState(STEP_FORM);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [paidOrder, setPaidOrder] = useState(null);

  useEffect(() => {
    let alive = true;
    api
      .getCourse(initialCourse.slug)
      .then((c) => alive && setCourse(c))
      .catch((err) => alive && setLoadError(err.message));
    return () => {
      alive = false;
    };
  }, [initialCourse.slug]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && step !== STEP_PAYING) onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, step]);

  const shown = course || initialCourse;
  const price = priceFor(shown, mode);
  const batches = (course?.batches || []).filter((b) => b.mode === mode);
  const bookable = batches.filter((b) => b.bookable);
  const selectedBatch = bookable.find((b) => b._id === batchId);

  async function handlePayNow(e) {
    e.preventDefault();
    setError('');
    if (!/^\d{10}$/.test(phone.replace(/\D/g, '').slice(-10))) return setError('Enter a valid 10-digit phone number');
    if (!name || !email || !address) return setError('Please fill in all fields');
    if (bookable.length && !selectedBatch) return setError('Please choose a batch timing');

    setStep(STEP_PAYING);
    try {
      const order = await api.createOrder({ courseSlug: shown.slug, mode, batchId: selectedBatch?._id, name, phone, email, address });

      const ok = await loadRazorpayScript();
      if (!ok) {
        setError('Could not load Razorpay checkout. Check your internet connection and try again.');
        setStep(STEP_FORM);
        return;
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.razorpayOrderId,
        name: 'Launch Pad English',
        description: `${order.courseTitle} - ${MODE_META[mode].label}${order.batchLabel ? ` (${order.batchLabel})` : ''}`,
        prefill: { name, email, contact: phone },
        theme: { color: '#2563EB' },
        handler: async function (response) {
          try {
            const verified = await api.verifyPayment({
              orderId: order.orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setPaidOrder(verified.order);
            setStep(STEP_SUCCESS);
          } catch (err) {
            setError(err.message);
            setStep(STEP_FORM);
          }
        },
        modal: {
          ondismiss: function () {
            setStep(STEP_FORM);
          },
        },
      });
      rzp.on('payment.failed', function () {
        setError('Payment failed. Please try again.');
        setStep(STEP_FORM);
      });
      rzp.open();
    } catch (err) {
      setError(err.message);
      setStep(STEP_FORM);
    }
  }

  return createPortal(
    <div className="modal-overlay" onClick={() => step !== STEP_PAYING && onClose()}>
      <div className="modal enroll-modal" role="dialog" aria-modal="true" aria-label={`Enroll in ${shown.title}`} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        {step === STEP_SUCCESS ? (
          <>
            <h3>🎉 Enrollment Successful!</h3>
            <p className="sub">
              You're enrolled in <strong>{shown.title}</strong> ({MODE_META[mode].label})
              {paidOrder?.batchLabel ? <> - {paidOrder.batchLabel}</> : null}.
              {paidOrder?.confirmationSent ? ` A confirmation has been sent to ${email}.` : ' Our team will call you shortly with joining details.'}
            </p>
            <div className="form-alert success">Payment ID: {paidOrder?.razorpayPaymentId || '—'}</div>
            <p className="muted" style={{ fontSize: 13.5 }}>
              You can now write a verified review for this course from the Home page - just enter this phone number or
              email when prompted.
            </p>
            <button className="btn btn-block" onClick={onClose}>
              Done
            </button>
          </>
        ) : (
          <>
            <span className={`cc-mode-badge cc-mode-${mode} cc-mode-badge-inline`}>
              <i className={`fas ${MODE_META[mode].icon}`} /> {MODE_META[mode].label} Course
            </span>
            <h3>Enroll: {shown.title}</h3>
            <div className="enroll-summary">
              <PriceTag mrp={price.mrp} offer={price.offer} currency={shown.currency} hideOnly />
              <span className="muted">{shown.duration}</span>
            </div>

            <form onSubmit={handlePayNow}>
              {(error || loadError) && <div className="form-alert error">{error || loadError}</div>}

              {!course && !loadError && <p className="muted">Loading batch timings…</p>}
              {course && batches.length > 0 && (
                <div className="form-group">
                  <label>Choose Your Batch</label>
                  <div className="batch-options">
                    {batches.map((b) => (
                      <label key={b._id} className={`batch-option ${b.bookable ? '' : 'disabled'} ${batchId === b._id ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="batch"
                          value={b._id}
                          disabled={!b.bookable}
                          checked={batchId === b._id}
                          onChange={() => setBatchId(b._id)}
                        />
                        <span className="batch-option-main">{batchLabel(b)}</span>
                        <span className="batch-option-meta">
                          {b.startDate && <>Starts {formatDate(b.startDate)} · </>}
                          {!b.bookable ? BATCH_STATUS_LABEL[b.seatsAvailable === 0 ? 'full' : b.status] : b.seatsAvailable !== null ? `${b.seatsAvailable} seats left` : BATCH_STATUS_LABEL[b.status]}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    className="form-control"
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input className="form-control" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea className="form-control" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" required />
              </div>

              <button className="btn btn-block" disabled={step === STEP_PAYING || !course}>
                {step === STEP_PAYING ? <span className="spinner" /> : `Proceed to Pay ${formatPrice(price.offer, shown.currency)}`}
              </button>
              <p className="form-hint center" style={{ marginTop: 10 }}>
                <i className="fas fa-lock" /> Secured by Razorpay
              </p>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
