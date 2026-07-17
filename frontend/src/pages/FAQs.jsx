import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

const GENERAL_FAQS = [
  { q: 'What courses does Launch Pad English offer?', a: 'We offer Basic Spoken English, Advanced Spoken English, a Complete Basic+Advanced program, IELTS Preparation and PTE Preparation - each available in Online and Offline modes.' },
  { q: 'Does Launch Pad English offer online classes?', a: 'Yes, we offer both online and offline classes, allowing learners to choose the mode that best fits their schedule and learning preferences.' },
  { q: 'Can I join if I am a complete beginner in English?', a: 'Absolutely. Our Basic Spoken English course is designed to build a strong foundation, starting from basic grammar and vocabulary to simple conversation skills.' },
  { q: 'Is a certificate provided after the course?', a: 'Yes, every course includes a course completion certificate.' },
  { q: 'What is the fee structure?', a: 'Fees vary by course and mode (online/offline) - see the pricing on each course page. All prices include study material and mock tests, with no hidden charges.' },
  { q: 'How can I contact Launch Pad English?', a: 'You can reach us via the Contact page, by phone at +91 98105 72736, or by email at launchpadenglish@gmail.com.' },
];

export default function FAQs() {
  const [courseFaqs, setCourseFaqs] = useState([]);
  const [openKey, setOpenKey] = useState(null);

  useEffect(() => {
    api
      .getCourses()
      .then((courses) => {
        const flat = [];
        courses.forEach((c) => {
          (c.faqs || []).forEach((f) => flat.push({ ...f, course: c.title }));
        });
        setCourseFaqs(flat);
      })
      .catch(() => setCourseFaqs([]));
  }, []);

  return (
    <>
      <div className="page-hero">
        <div className="container">
          <h1>Frequently Asked Questions</h1>
          <p>Everything you need to know before you enroll.</p>
        </div>
      </div>

      <section className="section">
        <div className="container grid grid-2">
          <div>
            <h2>General</h2>
            {GENERAL_FAQS.map((f, i) => {
              const key = `g-${i}`;
              return (
                <div className={`faq-item ${openKey === key ? 'open' : ''}`} key={key}>
                  <button className="faq-q" onClick={() => setOpenKey(openKey === key ? null : key)}>
                    {f.q} <span>{openKey === key ? '−' : '+'}</span>
                  </button>
                  <div className="faq-a">{f.a}</div>
                </div>
              );
            })}
          </div>
          <div>
            <h2>Course-Specific</h2>
            {courseFaqs.map((f, i) => {
              const key = `c-${i}`;
              return (
                <div className={`faq-item ${openKey === key ? 'open' : ''}`} key={key}>
                  <button className="faq-q" onClick={() => setOpenKey(openKey === key ? null : key)}>
                    {f.q} <span>{openKey === key ? '−' : '+'}</span>
                  </button>
                  <div className="faq-a">
                    {f.a}
                    <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                      - {f.course}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
