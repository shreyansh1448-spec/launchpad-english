import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../api.js';
import PriceTag from './PriceTag.jsx';

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

const STEP_MODE = 'mode';
const STEP_FORM = 'form';
const STEP_PAYING = 'paying';
const STEP_SUCCESS = 'success';

// Registration + payment modal.
// Student first picks Online or Offline (live pricing shown for both), then
// fills in Fields: name, phone (+ OTP verify), email (no OTP), address.
// Payment: creates a Razorpay order on the backend (price pulled live from
// the course's DB pricing), opens Razorpay Checkout, then verifies the
// signature server-side before marking the order paid.
export default function RegistrationModal({ course, mode: fixedMode, onClose }) {
  const [mode, setMode] = useState(fixedMode || null);
  const price = mode ? course.pricing[mode] : null;

  const [step, setStep] = useState(fixedMode ? STEP_FORM : STEP_MODE);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpError, setOtpError] = useState('');

  const [error, setError] = useState('');
  const [paidOrder, setPaidOrder] = useState(null);

  async function handleSendOtp() {
    setOtpError('');
    if (!/^\d{10}$/.test(phone.replace(/\D/g, '').slice(-10))) {
      setOtpError('Enter a valid 10-digit phone number first');
      return;
    }
    setOtpBusy(true);
    try {
      const res = await api.sendOtp(phone);
      setOtpSent(true);
      setDevOtp(res.devOtp || ''); // demo mode only - see backend/routes/otp.js
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setOtpBusy(false);
    }
  }

  async function handleVerifyOtp() {
    setOtpError('');
    setOtpBusy(true);
    try {
      await api.verifyOtp(phone, otp);
      setPhoneVerified(true);
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setOtpBusy(false);
    }
  }

  async function handlePayNow(e) {
    e.preventDefault();
    setError('');
    if (!phoneVerified) return setError('Please verify your phone number with OTP first');
    if (!name || !email || !address) return setError('Please fill in all fields');

    setStep(STEP_PAYING);
    try {
      const order = await api.createOrder({ courseSlug: course.slug, mode, name, phone, email, address });

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
        description: `${order.courseTitle} - ${mode === 'online' ? 'Online' : 'Offline'} Batch`,
        prefill: { name, email, contact: phone },
        theme: { color: '#0b2e59' },
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        {step === STEP_MODE ? (
          <>
            <h3>Choose Your Batch</h3>
            <div className="sub">{course.title} - select online or offline to continue</div>
            <div className="mode-picker">
              {['online', 'offline'].map((m) => {
                const p = course.pricing[m];
                if (!p) return null;
                return (
                  <button
                    type="button"
                    className="mode-picker-option"
                    key={m}
                    onClick={() => {
                      setMode(m);
                      setStep(STEP_FORM);
                    }}
                  >
                    <span className="mode-picker-label">{m === 'online' ? '💻 Online' : '🏫 Offline'}</span>
                    <PriceTag mrp={p.mrp} offer={p.offer} />
                  </button>
                );
              })}
            </div>
          </>
        ) : step === STEP_SUCCESS ? (
          <>
            <h3>🎉 Registration Successful!</h3>
            <p className="sub">
              You're enrolled in <strong>{course.title}</strong> ({mode === 'online' ? 'Online' : 'Offline'}). A
              confirmation has been sent to {email}.
            </p>
            <div className="form-alert success">
              Payment ID: {paidOrder?.razorpayPaymentId || '—'}
            </div>
            <p className="muted" style={{ fontSize: 13.5 }}>
              You can now write a verified review for this course from the Home page - just enter this phone
              number or email when prompted.
            </p>
            <button className="btn btn-block" onClick={onClose}>
              Done
            </button>
          </>
        ) : (
          <>
            <h3>Register for {course.title}</h3>
            <div className="sub">
              {mode === 'online' ? 'Online' : 'Offline'} batch · <PriceTag mrp={price.mrp} offer={price.offer} />
            </div>

            <form onSubmit={handlePayNow}>
              {error && <div className="form-alert error">{error}</div>}

              <div className="form-group">
                <label>Full Name</label>
                <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <div className="form-row">
                  <input
                    className="form-control"
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={phone}
                    disabled={phoneVerified}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                  {!phoneVerified && (
                    <button type="button" className="btn btn-navy btn-sm" onClick={handleSendOtp} disabled={otpBusy}>
                      {otpBusy ? <span className="spinner" /> : otpSent ? 'Resend OTP' : 'Send OTP'}
                    </button>
                  )}
                  {phoneVerified && <span className="otp-badge verified">✓ Verified</span>}
                </div>
                {devOtp && !phoneVerified && (
                  <p className="form-hint">
                    Demo mode - no SMS provider connected, so your OTP is: <strong>{devOtp}</strong> (see README to
                    wire in a real SMS provider)
                  </p>
                )}
              </div>

              {otpSent && !phoneVerified && (
                <div className="form-group">
                  <label>Enter OTP</label>
                  <div className="form-row">
                    <input
                      className="form-control"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      placeholder="6-digit code"
                    />
                    <button type="button" className="btn btn-sm" onClick={handleVerifyOtp} disabled={otpBusy}>
                      {otpBusy ? <span className="spinner" /> : 'Verify'}
                    </button>
                  </div>
                  {otpError && <div className="form-error">{otpError}</div>}
                </div>
              )}
              {otpError && !otpSent && <div className="form-error">{otpError}</div>}

              <div className="form-group">
                <label>Email Address</label>
                <input
                  className="form-control"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <p className="form-hint">No OTP required for email.</p>
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea className="form-control" value={address} onChange={(e) => setAddress(e.target.value)} required />
              </div>

              <button className="btn btn-block" disabled={step === STEP_PAYING}>
                {step === STEP_PAYING ? <span className="spinner" /> : `Proceed to Pay ${'₹' + price.offer.toLocaleString('en-IN')}`}
              </button>
              <p className="form-hint center" style={{ marginTop: 10 }}>
                Secured by Razorpay
              </p>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
