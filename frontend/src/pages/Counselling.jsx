import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import Reveal from '../components/Reveal.jsx';
import WhatsAppIcon from '../components/WhatsAppIcon.jsx';

const FEATURES = [
  { icon: '🎯', title: 'Free Career Counselling', text: 'A completely free session to understand your goals and recommend the right path forward.' },
  { icon: '🧑‍🏫', title: 'One-to-One Guidance', text: 'Personal, one-on-one attention from our counselling team - not a generic sales call.' },
  { icon: '📚', title: 'Personal Course Selection', text: 'We match you to Basic, Advanced, Complete Spoken English or IELTS based on your current level.' },
  { icon: '🗣️', title: 'Language Assessment', text: 'A quick spoken-English level check so recommendations are based on where you actually stand.' },
  { icon: '✈️', title: 'Study Abroad Guidance', text: 'Guidance on English requirements and band scores for study-abroad and migration goals.' },
  { icon: '📝', title: 'IELTS Planning', text: 'A realistic study plan and timeline to hit your target IELTS band score.' },
  { icon: '🗺️', title: 'English Learning Roadmap', text: 'A clear, week-by-week roadmap from your current level to fluent, confident English.' },
  { icon: '💼', title: 'Career Communication Skills', text: 'Guidance on workplace English - emails, meetings and professional conversations.' },
  { icon: '🎤', title: 'Job Interview Guidance', text: 'Tips and practice pointers to help you communicate confidently in interviews.' },
  { icon: '🧠', title: 'Personality Assessment', text: 'A friendly assessment of your communication style and confidence, not just your English.' },
  { icon: '⭐', title: 'Best Course Recommendation', text: 'A final, honest recommendation of the single best course and mode (online/offline) for you.' },
];

export default function Counselling() {
  const [content, setContent] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [courseType, setCourseType] = useState('online');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(null); // 'success' | 'error'
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getSiteContent().then(setContent).catch(() => setContent(null));
  }, []);

  const phoneNumber = content?.phone || '+91 98105 72736';
  const whatsapp = content?.whatsapp || '919810572736';

  function scrollToForm() {
    document.getElementById('callback-form')?.scrollIntoView({ behavior: 'smooth' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.submitLead({ type: 'counselling', name, phone, courseType, message });
      setStatus('success');
      setName('');
      setPhone('');
      setMessage('');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-hero">
        <div className="container">
          <h1>Free Career &amp; Course Counselling</h1>
          <p>Not sure which course fits you best? Get free, one-to-one guidance from our counselling team.</p>
          <div className="hero-cta" style={{ justifyContent: 'center', marginTop: 24 }}>
            <a className="btn btn-outline" href={`tel:${phoneNumber.replace(/\s/g, '')}`}>
              📞 Call Now
            </a>
            <a
              className="btn btn-whatsapp"
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Hi, I would like free course counselling.')}`}
              target="_blank"
              rel="noreferrer"
            >
              <WhatsAppIcon /> WhatsApp Counselling
            </a>
            <button className="btn btn-outline" onClick={scrollToForm}>
              📅 Schedule Meeting
            </button>
            <button className="btn" onClick={scrollToForm}>
              Book Counselling
            </button>
          </div>
        </div>
      </div>

      <Reveal as="section" className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">What You Get</span>
            <h2>Everything Covered in Your Free Session</h2>
          </div>
          <div className="grid grid-3">
            {FEATURES.map((f, i) => (
              <div className="card service-card hover-lift" key={i}>
                <div className="service-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p className="muted">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="section section-alt" id="callback-form">
        <div className="container grid grid-2">
          <div className="card">
            <h2>How Our Counselling Works</h2>
            <p>
              Every student's English level, goals and schedule are different. Our counsellors assess your current
              level, understand whether you need Spoken English, IELTS or PTE preparation, and recommend the right
              course, mode (online/offline) and batch timing - completely free of cost.
            </p>
            <ul>
              <li>Free spoken-English level assessment call</li>
              <li>Course &amp; batch recommendation based on your goals</li>
              <li>Guidance on IELTS/PTE band-score targets for study abroad or migration</li>
              <li>Help choosing between online and offline (classroom) formats</li>
              <li>No obligation to enroll - the call is completely free</li>
            </ul>
          </div>

          <div className="card">
            <h2>Get a Callback</h2>
            {status === 'success' ? (
              <div className="form-alert success">Thanks, {name || 'there'}! Our counselling team will call you back shortly.</div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && <div className="form-alert error">{error}</div>}
                <div className="form-group">
                  <label>Name</label>
                  <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input className="form-control" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Course Type</label>
                  <div className="form-row">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                      <input type="radio" name="courseType" checked={courseType === 'online'} onChange={() => setCourseType('online')} /> Online
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                      <input type="radio" name="courseType" checked={courseType === 'offline'} onChange={() => setCourseType('offline')} /> Offline
                    </label>
                  </div>
                </div>
                <div className="form-group">
                  <label>Message (optional)</label>
                  <textarea className="form-control" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us your goal - e.g. interview prep, IELTS Band 7, workplace English…" />
                </div>
                <button className="btn btn-block" disabled={busy}>
                  {busy ? <span className="spinner" /> : 'Request Callback'}
                </button>
              </form>
            )}
          </div>
        </div>
      </Reveal>
    </>
  );
}
