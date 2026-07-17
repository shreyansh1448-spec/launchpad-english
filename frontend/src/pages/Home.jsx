import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../api.js';
import HeroSlider from '../components/HeroSlider.jsx';
import CourseCard from '../components/CourseCard.jsx';
import GoogleMapReviews from '../components/GoogleMapReviews.jsx';
import ContactCard from '../components/ContactCard.jsx';
import MapEmbed from '../components/MapEmbed.jsx';
import Gallery from '../components/Gallery.jsx';
import ReviewList from '../components/ReviewList.jsx';
import ReviewForm from '../components/ReviewForm.jsx';
import RegistrationModal from '../components/RegistrationModal.jsx';
import BatchTimings from '../components/BatchTimings.jsx';
import YoutubeSection from '../components/YoutubeSection.jsx';
import SectionImage from '../components/SectionImage.jsx';
import Reveal from '../components/Reveal.jsx';
import Stat from '../components/Stat.jsx';

const COURSE_FEATURES = [
  { icon: '🗣️', title: 'English Speaking, Writing & Reading' },
  { icon: '🎙️', title: 'Daily Speaking Practice' },
  { icon: '📖', title: 'Grammar Made Easy' },
  { icon: '📚', title: '3000+ Vocabulary at Your Fingertips' },
  { icon: '🎯', title: 'Personalized Feedback' },
  { icon: '👨‍🏫', title: 'Experienced Trainers' },
];

const PROMISES = [
  { icon: '💼', title: 'Professional Communication' },
  { icon: '🎤', title: 'Interview Preparation' },
  { icon: '📢', title: 'Public Speaking' },
  { icon: '💪', title: 'Confidence Building' },
  { icon: '🏢', title: 'Business English' },
  { icon: '📈', title: 'Career Development' },
  { icon: '🤝', title: 'Soft Skills' },
  { icon: '💬', title: 'Real-life Communication' },
];

const SERVICES = [
  { icon: '🗣️', title: 'Spoken English', text: 'Speak English with confidence and clarity - for interviews, meetings and daily life.', link: '/online-courses' },
  { icon: '🎓', title: 'IELTS / PTE Coaching', text: 'Achieve top scores in IELTS and PTE with expert guidance and weekly mock tests.', link: '/online-courses' },
  { icon: '💻', title: 'Online & Offline Classes', text: 'Learn live online from home, or join hands-on classroom batches in South Delhi.', link: '/offline-courses' },
  { icon: '🧑‍🤝‍🧑', title: 'Group Discussion', text: 'Strengthen your group discussion skills with focused, real-world practice sessions.', link: '/counselling' },
  { icon: '✨', title: 'Personality Development', text: 'Grow your personality by expressing yourself clearly and confidently.', link: '/counselling' },
];

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [content, setContent] = useState(null);
  const [modalState, setModalState] = useState(null); // { course, mode }
  const location = useLocation();

  useEffect(() => {
    api.getCourses().then(setCourses).catch(() => setCourses([]));
    api.getSiteContent().then(setContent).catch(() => setContent(null));
  }, []);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1);
      const t = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 150);
      return () => clearTimeout(t);
    }
  }, [location.hash]);

  const studentsCount = content?.stats?.studentsCount || 10000;
  const yearsExperience = content?.stats?.yearsExperience || 15;
  const successRate = content?.stats?.successRate || 100;
  const coursesCount = content?.stats?.coursesCount || courses.length || 5;

  return (
    <>
      <HeroSlider slides={content?.heroSlides} />

      {/* Trust bar */}
      <section className="stats-strip">
        <div className="container stats-grid">
          <div>
            <Stat className="num" value={studentsCount} suffix="+" />
            <div className="label">Students Trained</div>
          </div>
          <div>
            <Stat className="num" value={yearsExperience} suffix="+" />
            <div className="label">Years of Experience</div>
          </div>
          <div>
            <Stat className="num" value={coursesCount} />
            <div className="label">Specialized Courses</div>
          </div>
          <div>
            <Stat className="num" value={successRate} suffix="%" />
            <div className="label">Batch Completion Rate</div>
          </div>
        </div>
      </section>

      {/* Classroom experience video */}
      <Reveal as="section" className="section">
        <div className="container grid grid-2" style={{ alignItems: 'center' }}>
          <div>
            <span className="eyebrow">Watch &amp; Learn</span>
            <h2>See Our Classroom Come Alive</h2>
            <p>
              Every batch at Launch Pad English is live, interactive and speaking-first - not a one-way lecture.
              Take a look inside a real session and see how our trainers turn grammar and vocabulary into
              confident, everyday conversation from day one.
            </p>
            <div className="tag-row">
              <span className="tag">15+ Years Experience</span>
              <span className="tag">Online &amp; Offline Batches</span>
              <span className="tag">Certificate on Completion</span>
              <span className="tag">South Delhi Campus</span>
            </div>
            <Link className="btn btn-navy" to="/about">
              Learn More About Us
            </Link>
          </div>
          <YoutubeSection url={content?.youtubeUrl} />
        </div>
      </Reveal>

      {/* Why Choose Us */}
      <Reveal as="section" className="section section-alt">
        <div className="container grid grid-2" style={{ alignItems: 'center' }}>
          <SectionImage src="/images/main.jpeg" alt="Trainer with students at Launch Pad English" />
          <div>
            <span className="eyebrow">Why Choose Us</span>
            <h2>Why Choose Launch Pad English?</h2>
            <ul>
              <li>Expert, experienced trainers with global exposure to language &amp; communication</li>
              <li>Practical, real-world speaking practice - not just textbook grammar</li>
              <li>Interview coaching, public speaking &amp; personality development</li>
              <li>Small batches with continuous, personalized feedback</li>
              <li>Flexible online and offline (classroom) batch timings</li>
            </ul>
          </div>
        </div>
      </Reveal>

      {/* Our Learning Method */}
      <Reveal as="section" className="section">
        <div className="container section-head">
          <span className="eyebrow">How We Teach</span>
          <h2>Our Learning Method</h2>
          <p className="muted">
            A structured, speaking-first approach - vocabulary and grammar in context, daily live speaking
            practice, role plays and group discussions, continuous trainer feedback, and real-world scenarios
            (interviews, presentations, everyday conversation) from week one.
          </p>
          <div className="tag-row" style={{ justifyContent: 'center' }}>
            <span className="tag">Speaking-First Classes</span>
            <span className="tag">Weekly Assessments</span>
            <span className="tag">Personalized Feedback</span>
          </div>
        </div>
      </Reveal>

      {/* Course Features */}
      <Reveal as="section" className="section section-alt">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">What's Included</span>
            <h2>Course Features</h2>
          </div>
          <div className="grid grid-3">
            {COURSE_FEATURES.map((f, i) => (
              <div className="card service-card hover-lift" key={i}>
                <div className="service-icon">{f.icon}</div>
                <h3>{f.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Services */}
      <Reveal as="section" className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">What We Offer</span>
            <h2>Our Services</h2>
            <p>Everything you need to speak, present and succeed in English - under one roof.</p>
          </div>
          <div className="grid grid-3">
            {SERVICES.map((s, i) => (
              <Link className="card service-card hover-lift" to={s.link} key={i}>
                <div className="service-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p className="muted">{s.text}</p>
              </Link>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Courses preview */}
      <Reveal as="section" className="section section-alt" id="courses">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Our Courses</span>
            <h2>Choose Your Course</h2>
            <p>Five specialised programs, available both online and offline.</p>
          </div>
          <div className="grid grid-3">
            {courses.filter((c) => c.featured).map((c) => (
              <CourseCard key={c.slug} course={c} onPurchase={(course) => setModalState({ course })} />
            ))}
          </div>
          <div className="center mt-24" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link className="btn btn-navy" to="/online-courses">
              View All Online Courses
            </Link>
            <Link className="btn" to="/offline-courses">
              View All Offline Courses
            </Link>
          </div>
        </div>
      </Reveal>

      {/* Batch Timings - shown once sitewide */}
      <Reveal as="section" className="section" id="batch-timings">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Plan Your Schedule</span>
            <h2>Batch Timings</h2>
            <p>Every course runs on the same weekday batches, online and offline - pick whichever suits you.</p>
          </div>
          <BatchTimings timings={content?.batchTimings} />
        </div>
      </Reveal>

      {/* Counselling teaser */}
      <Reveal as="section" className="section section-alt">
        <div className="container grid grid-2" style={{ alignItems: 'center' }}>
          <div>
            <span className="eyebrow">Not Sure Where to Start?</span>
            <h2>Free Career &amp; Course Counselling</h2>
            <p className="muted">
              Get one-to-one guidance on the right course, a personalized English-learning roadmap, and honest
              answers to your questions - free, no obligation.
            </p>
            <Link className="btn" to="/counselling">
              Book Free Counselling
            </Link>
          </div>
          <div className="card">
            <h3>What You Get</h3>
            <ul>
              <li>Personal course &amp; batch recommendation</li>
              <li>Free language level assessment</li>
              <li>IELTS / PTE / study-abroad planning</li>
              <li>Interview &amp; career communication guidance</li>
            </ul>
          </div>
        </div>
      </Reveal>

      {/* Achievements */}
      <Reveal as="section" className="section">
        <div className="container" style={{ maxWidth: 640, textAlign: 'center' }}>
          <span className="eyebrow">Our Track Record</span>
          <h2>Achievements</h2>
          <ul style={{ listStyle: 'none', display: 'inline-block', textAlign: 'left' }}>
            <li>{studentsCount.toLocaleString('en-IN')}+ students trained since inception</li>
            <li>{yearsExperience}+ years teaching Spoken English, IELTS &amp; PTE</li>
            <li>{successRate}% batch completion rate</li>
            <li>Thousands of successful interview and study-abroad placements</li>
          </ul>
        </div>
      </Reveal>

      {/* Promise */}
      <Reveal as="section" className="section section-alt">
        <div className="container section-head">
          <span className="eyebrow">Our Commitment</span>
          <h2>A Promise to Make You a Professional</h2>
        </div>
        <div className="container grid grid-4">
          {PROMISES.map((p, i) => (
            <div className="promise-item" key={i}>
              <span className="promise-icon">{p.icon}</span> {p.title}
            </div>
          ))}
        </div>
      </Reveal>

      {/* Gallery */}
      <Reveal as="section" className="section" id="gallery">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Gallery</span>
            <h2>Life at Launch Pad English</h2>
            <p>Classroom sessions, events and student moments - managed straight from our database.</p>
          </div>
          <Gallery limit={15} />
        </div>
      </Reveal>

      {/* Site-wide student reviews */}
      <Reveal as="section" className="section section-alt" id="reviews">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Real Student Stories</span>
            <h2>What Our Students Say</h2>
            <p>Testimonials from verified course purchasers, plus students and professionals we've taught over the years.</p>
          </div>
          <div className="grid grid-2">
            <div className="card">
              <ReviewList />
            </div>
            <div className="card">
              <h3>Write a Review</h3>
              <p className="muted" style={{ fontSize: 13.5 }}>
                Only students who have purchased a course can post a review - enter the phone or email you used
                during registration to verify your purchase.
              </p>
              <ReviewForm />
            </div>
          </div>
        </div>
      </Reveal>

      {/* Find us + contact + Google reviews */}
      <Reveal as="section" className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Find Us &amp; Get In Touch</span>
            <h2>Our Location &amp; Contact Details</h2>
            <p>Visit our South Delhi campus, chat with us on WhatsApp, or give us a call.</p>
          </div>
          <div className="grid grid-2 mb-24">
            <MapEmbed
              lat={content?.mapLat || 28.558361}
              lng={content?.mapLng || 77.2081812}
              placeUrl={content?.mapPlaceUrl}
            />
            <ContactCard content={content} />
          </div>
          <GoogleMapReviews placeUrl={content?.mapPlaceUrl} />
        </div>
      </Reveal>

      {/* FAQs teaser */}
      <Reveal as="section" className="section section-alt">
        <div className="container center">
          <span className="eyebrow">Have Questions?</span>
          <h2>Frequently Asked Questions</h2>
          <p className="muted">Course details, batch timings, certificates and more - answered.</p>
          <Link className="btn" to="/faqs">
            View All FAQs
          </Link>
        </div>
      </Reveal>

      {modalState && (
        <RegistrationModal course={modalState.course} mode={modalState.mode} onClose={() => setModalState(null)} />
      )}
    </>
  );
}
