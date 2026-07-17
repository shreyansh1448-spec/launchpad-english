import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import ContactCard from '../components/ContactCard.jsx';
import MapEmbed from '../components/MapEmbed.jsx';

export default function Contact() {
  const [content, setContent] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getSiteContent().then(setContent).catch(() => setContent(null));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.submitLead({ type: 'contact', name, phone, email, message });
      setStatus('success');
      setName('');
      setPhone('');
      setEmail('');
      setMessage('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-hero">
        <div className="container">
          <h1>Contact Us</h1>
          <p>Have a question about a course, batch timing, or fee? Reach out - we usually reply within a few hours.</p>
        </div>
      </div>

      <section className="section">
        <div className="container grid grid-2">
          <MapEmbed
            lat={content?.mapLat || 28.558361}
            lng={content?.mapLng || 77.2081812}
            placeUrl={content?.mapPlaceUrl}
          />
          <ContactCard content={content} />
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="card" style={{ maxWidth: 620, margin: '0 auto' }}>
            <h2>Send a Message</h2>
            {status === 'success' ? (
              <div className="form-alert success">Thanks! We've received your message and will get back to you shortly.</div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && <div className="form-alert error">{error}</div>}
                <div className="form-group">
                  <label>Name</label>
                  <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input className="form-control" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input className="form-control" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Message</label>
                  <textarea className="form-control" value={message} onChange={(e) => setMessage(e.target.value)} required />
                </div>
                <button className="btn btn-block btn-gradient" disabled={busy}>
                  {busy ? <span className="spinner" /> : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
