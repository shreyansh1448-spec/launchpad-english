import React from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal.jsx';
import SectionImage from '../components/SectionImage.jsx';

const VALUES = [
  { icon: '🎯', title: 'Excellence', text: '100% result-assured teaching, refined over 15+ years of classroom experience.' },
  { icon: '🤝', title: 'Trust', text: 'Building genuine connections and trust between students and English-speaking opportunities worldwide.' },
  { icon: '🌍', title: 'Inclusiveness', text: 'A commitment to equality, diversity and inclusiveness for every student who walks through our doors.' },
  { icon: '💡', title: 'Innovation', text: 'A holistic, interactive teaching methodology that blends grammar, vocabulary and real conversation practice.' },
  { icon: '🏆', title: 'Recognition', text: "Awarded 'Best Interactive Classroom' and recognised as India's No. 1 English Learning Centre." },
  { icon: '📈', title: 'Commitment', text: 'Free repeat classes for any student who does not clear their exam on the first attempt.' },
];

const MILESTONES = [
  { year: '2010', title: 'The Beginning', text: 'Our founder started teaching English to a small group of students, driven by a single dream: 100% result assurance.' },
  { year: '2015', title: 'Growing Trust', text: 'LAUNCH PAD became a trusted name with top educational institutions, corporates and government organisations.' },
  { year: '2020', title: 'Going Digital', text: 'Launched live online batches so students anywhere could learn Spoken English, IELTS and PTE from home.' },
  { year: 'Today', title: '10,000+ Students', text: 'A community of 10,000+ students trained, with a 100% batch completion rate and expert faculty across every course.' },
];

export default function About() {
  return (
    <>
      <div className="page-hero">
        <div className="container">
          <h1>About Us</h1>
          <p>Welcome to LAUNCH PAD - building fluency, confidence and global opportunity since 2010.</p>
        </div>
      </div>

      {/* Founder's message */}
      <Reveal as="section" className="section">
        <div className="container grid grid-2" style={{ alignItems: 'center' }}>
          <div>
            <span className="eyebrow">Our Story</span>
            <h2>Welcome to LAUNCH PAD</h2>
            <p>
              I am delighted to have an opportunity to lead LAUNCH PAD since 2010. At LAUNCH PAD, we build
              connections, understanding and trust between people in India and English speaking countries through
              making people fluent in the English language. LAUNCH PAD was established with an aim to teach students
              English with 100% result assurance - a dream I pursued 12 years ago, when I used to teach English to
              students in a small group. We have been able to teach, nurture and establish the careers of many who
              dreamt that learning English would expand their career prospects, and who have benefitted from the
              learning opportunities and inter-cultural experiences provided by LAUNCH PAD. India and the
              international market will require millions of skilled workers by 2030, and India is going to be the
              hub of the skilled workforce of the world. At present, we have a bunch of expert faculties to support
              the requirement of providing English-speaking skilled workers by 2030.
            </p>
          </div>
          <SectionImage src="/images/trainer-classroom-london.png" alt="Launch Pad English trainer teaching a spoken English class" />
        </div>
      </Reveal>

      {/* Trusted by / awards */}
      <Reveal as="section" className="section section-alt">
        <div className="container" style={{ maxWidth: 860 }}>
          <div>
            <span className="eyebrow">Trusted Since 2010</span>
            <h2>A Name Trusted Across India</h2>
            <p>
              LAUNCH PAD is trusted by top educational institutions, leading corporate houses and governmental
              organisations, and we continue to create new partnerships and new learning opportunities. We see our
              commitment to equality, diversity and inclusiveness as one of the main reasons for our continued
              success, and we are proud to share this experience and expertise with partners and students throughout
              English language markets. We have been awarded many times with accolades like &lsquo;Launch Pad
              provides the best interactive classroom&rsquo; and &lsquo;Launch Pad is India&rsquo;s No. 1 English
              Learning Centre&rsquo;.
            </p>
            <p>
              LAUNCH PAD provides the best interactive classroom in Delhi. Under one roof, all your problems related
              to English end here, through our unique, holistic teaching methodology. Any language - be it German,
              French or Hindi - depends on reading, writing, speaking, listening, grammar, vocabulary, knowledge, a
              proper platform for interaction, and a professional guide or mentor. Here, we provide a blend of them
              all. &lsquo;Explore professionalism in yourself&rsquo; or &lsquo;Hone your skill with the wings of
              communication&rsquo;. Once a student joins LAUNCH PAD, the institute ensures 100% command over the
              IELTS syllabus, Spoken English, and English for government jobs - and in case a student does not clear
              an exam on the first attempt, LAUNCH PAD provides free classes to help students and professionals pass
              their exams or tests. Join now, feel the DIFFERENCE!
            </p>
          </div>
        </div>
      </Reveal>

      {/* Mission & values - extra content */}
      <Reveal as="section" className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">What We Stand For</span>
            <h2>Our Mission &amp; Values</h2>
            <p>
              Our mission is simple: make every student in front of us fluent, confident and ready for the world -
              whether that means acing an interview, clearing IELTS/PTE, or simply speaking up without hesitation.
              These are the values that guide every class we teach.
            </p>
          </div>
          <div className="grid grid-3">
            {VALUES.map((v, i) => (
              <div className="card service-card hover-lift" key={i}>
                <div className="service-icon">{v.icon}</div>
                <h3>{v.title}</h3>
                <p className="muted">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Journey / milestones - extra content */}
      <Reveal as="section" className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <div className="section-head" style={{ textAlign: 'left', margin: '0 0 24px' }}>
            <span className="eyebrow">Our Journey</span>
            <h2>From One Classroom to 10,000+ Students</h2>
          </div>
          <ul>
            {MILESTONES.map((m, i) => (
              <li key={i} style={{ marginBottom: 14 }}>
                <strong>{m.year} - {m.title}:</strong> {m.text}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      {/* Closing / contact CTA */}
      <Reveal as="section" className="section center">
        <div className="container" style={{ maxWidth: 720 }}>
          <span className="eyebrow">Get In Touch</span>
          <h2>We&rsquo;d Love to Hear From You</h2>
          <p className="muted">
            If you would like more information, or you&rsquo;d like to share something with us, just drop us an
            email or get in touch through our social media channels. We look forward to hearing from you.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginTop: 10 }}>
            <Link className="btn" to="/contact">
              Get in Touch
            </Link>
            <Link className="btn btn-outline" to="/counselling">
              Book Free Counselling
            </Link>
          </div>
        </div>
      </Reveal>
    </>
  );
}
