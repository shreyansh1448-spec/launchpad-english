import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../api.js';
import HeroSlider from '../components/HeroSlider.jsx';
import CourseListingCard from '../components/CourseListingCard.jsx';
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
import { MODE_META, offersMode } from '../../shared/course.js';

// Fallbacks used whenever SiteContent.homeContent doesn't have a section yet
// (e.g. a fresh install, or before the admin has edited that part) - the
// admin-edited text in content.homeContent always takes priority.
const DEFAULT_HOME = {
  video: {
    eyebrow: 'Watch & Learn',
    heading: 'See Our Classroom Come Alive',
    text: "Every batch at Launch Pad English is live, interactive and speaking-first - not a one-way lecture. Take a look inside a real session and see how our trainers turn grammar and vocabulary into confident, everyday conversation from day one.",
    tags: ['15+ Years Experience', 'Online & Offline Batches', 'Certificate on Completion', 'South Delhi Campus'],
    ctaText: 'Learn More About Us',
  },
  whyChooseUs: {
    eyebrow: 'Why Choose Us',
    heading: 'Why Choose Launch Pad English?',
    imageUrl: '/images/main.jpeg',
    bullets: [
      'Expert, experienced trainers with global exposure to language & communication',
      'Practical, real-world speaking practice - not just textbook grammar',
      'Interview coaching, public speaking & personality development',
      'Small batches with continuous, personalized feedback',
      'Flexible online and offline (classroom) batch timings',
    ],
  },
  learningMethod: {
    eyebrow: 'How We Teach',
    heading: 'Our Learning Method',
    text: 'A structured, speaking-first approach - vocabulary and grammar in context, daily live speaking practice, role plays and group discussions, continuous trainer feedback, and real-world scenarios (interviews, presentations, everyday conversation) from week one.',
    tags: ['Speaking-First Classes', 'Weekly Assessments', 'Personalized Feedback'],
  },
  courseFeatures: {
    eyebrow: "What's Included",
    heading: 'Course Features',
    items: [
      { icon: '🗣️', title: 'English Speaking, Writing & Reading' },
      { icon: '🎙️', title: 'Daily Speaking Practice' },
      { icon: '📖', title: 'Grammar Made Easy' },
      { icon: '📚', title: '3000+ Vocabulary at Your Fingertips' },
      { icon: '🎯', title: 'Personalized Feedback' },
      { icon: '👨‍🏫', title: 'Experienced Trainers' },
    ],
  },
  services: {
    eyebrow: 'What We Offer',
    heading: 'Our Services',
    text: 'Everything you need to speak, present and succeed in English - under one roof.',
    items: [
      { icon: '🗣️', title: 'Spoken English', text: 'Speak English with confidence and clarity - for interviews, meetings and daily life.', link: '/online-courses' },
      { icon: '🎓', title: 'IELTS / PTE Coaching', text: 'Achieve top scores in IELTS and PTE with expert guidance and weekly mock tests.', link: '/online-courses' },
      { icon: '💻', title: 'Online & Offline Classes', text: 'Learn live online from home, or join hands-on classroom batches in South Delhi.', link: '/offline-courses' },
      { icon: '🧑‍🤝‍🧑', title: 'Group Discussion', text: 'Strengthen your group discussion skills with focused, real-world practice sessions.', link: '/counselling' },
      { icon: '✨', title: 'Personality Development', text: 'Grow your personality by expressing yourself clearly and confidently.', link: '/counselling' },
    ],
  },
  coursesPreview: {
    eyebrow: 'Our Courses',
    heading: 'Choose How You Want to Learn',
    text: 'Every program runs live online and in our South Delhi classroom - each with its own batches and pricing.',
  },
  learnOnline: {
    heading: 'Learn Online',
    text: 'Build your English skills from anywhere with live online classes.',
    ctaText: 'Explore Online Courses',
  },
  learnOffline: {
    heading: 'Learn Offline',
    text: 'Join our classroom programs in South Delhi.',
    ctaText: 'Explore Offline Courses',
  },
  batchTimingsSection: {
    eyebrow: 'Plan Your Schedule',
    heading: 'Batch Timings',
    text: 'Every course runs on the same weekday batches, online and offline - pick whichever suits you.',
  },
  counselling: {
    eyebrow: 'Not Sure Where to Start?',
    heading: 'Free Career & Course Counselling',
    text: 'Get one-to-one guidance on the right course, a personalized English-learning roadmap, and honest answers to your questions - free, no obligation.',
    ctaText: 'Book Free Counselling',
    whatYouGetTitle: 'What You Get',
    whatYouGetBullets: [
      'Personal course & batch recommendation',
      'Free language level assessment',
      'IELTS / PTE / study-abroad planning',
      'Interview & career communication guidance',
    ],
  },
  achievements: {
    eyebrow: 'Our Track Record',
    heading: 'Achievements',
    bullets: [
      '10,000+ students trained since inception',
      '15+ years teaching Spoken English, IELTS & PTE',
      '100% batch completion rate',
      'Thousands of successful interview and study-abroad placements',
    ],
  },
  promise: {
    eyebrow: 'Our Commitment',
    heading: 'A Promise to Make You a Professional',
    items: [
      { icon: '💼', title: 'Professional Communication' },
      { icon: '🎤', title: 'Interview Preparation' },
      { icon: '📢', title: 'Public Speaking' },
      { icon: '💪', title: 'Confidence Building' },
      { icon: '🏢', title: 'Business English' },
      { icon: '📈', title: 'Career Development' },
      { icon: '🤝', title: 'Soft Skills' },
      { icon: '💬', title: 'Real-life Communication' },
    ],
  },
  gallery: {
    eyebrow: 'Gallery',
    heading: 'Life at Launch Pad English',
    text: 'Classroom sessions, events and student moments - managed straight from our database.',
  },
  reviews: {
    eyebrow: 'Real Student Stories',
    heading: 'What Our Students Say',
    text: "Testimonials from verified course purchasers, plus students and professionals we've taught over the years.",
    writeReviewTitle: 'Write a Review',
    writeReviewText: 'Only students who have purchased a course can post a review - enter the phone or email you used during registration to verify your purchase.',
  },
  findUs: {
    eyebrow: 'Find Us & Get In Touch',
    heading: 'Our Location & Contact Details',
    text: 'Visit our South Delhi campus, chat with us on WhatsApp, or give us a call.',
  },
  faqsTeaser: {
    eyebrow: 'Have Questions?',
    heading: 'Frequently Asked Questions',
    text: 'Course details, batch timings, certificates and more - answered.',
  },
  statsLabels: {
    students: 'Students Trained',
    years: 'Years of Experience',
    courses: 'Specialized Courses',
    successRate: 'Batch Completion Rate',
  },
};

// Merges admin-edited homeContent over the hardcoded defaults, section by
// section, so a section the admin hasn't touched yet still shows real copy
// instead of blank text.
function mergeHome(homeContent) {
  const hc = homeContent || {};
  const merged = {};
  for (const key of Object.keys(DEFAULT_HOME)) {
    merged[key] = { ...DEFAULT_HOME[key], ...(hc[key] || {}) };
  }
  return merged;
}

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [content, setContent] = useState(null);
  const [batches, setBatches] = useState([]);
  const [modalState, setModalState] = useState(null); // { course, mode }
  const location = useLocation();

  useEffect(() => {
    api.getCourses().then(setCourses).catch(() => setCourses([]));
    api.getSiteContent().then(setContent).catch(() => setContent(null));
    api.getBatches().then(setBatches).catch(() => setBatches([]));
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

  const home = mergeHome(content?.homeContent);

  return (
    <>
      <HeroSlider slides={content?.heroSlides} />

      {/* Trust bar */}
      <section className="stats-strip">
        <div className="container stats-grid">
          <div>
            <Stat className="num" value={studentsCount} suffix="+" />
            <div className="label">{home.statsLabels.students}</div>
          </div>
          <div>
            <Stat className="num" value={yearsExperience} suffix="+" />
            <div className="label">{home.statsLabels.years}</div>
          </div>
          <div>
            <Stat className="num" value={coursesCount} />
            <div className="label">{home.statsLabels.courses}</div>
          </div>
          <div>
            <Stat className="num" value={successRate} suffix="%" />
            <div className="label">{home.statsLabels.successRate}</div>
          </div>
        </div>
      </section>

      {/* Classroom experience video */}
      <Reveal as="section" className="section">
        <div className="container grid grid-2" style={{ alignItems: 'center' }}>
          <div>
            <span className="eyebrow">{home.video.eyebrow}</span>
            <h2>{home.video.heading}</h2>
            <p>{home.video.text}</p>
            <div className="tag-row">
              {home.video.tags.map((t, i) => (
                <span className="tag" key={i}>{t}</span>
              ))}
            </div>
            <Link className="btn btn-navy" to="/about">
              {home.video.ctaText}
            </Link>
          </div>
          <YoutubeSection url={content?.youtubeUrl} />
        </div>
      </Reveal>

      {/* Why Choose Us */}
      <Reveal as="section" className="section section-alt">
        <div className="container grid grid-2" style={{ alignItems: 'center' }}>
          <SectionImage src={home.whyChooseUs.imageUrl} alt="Trainer with students at Launch Pad English" />
          <div>
            <span className="eyebrow">{home.whyChooseUs.eyebrow}</span>
            <h2>{home.whyChooseUs.heading}</h2>
            <ul>
              {home.whyChooseUs.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>

      {/* Our Learning Method */}
      <Reveal as="section" className="section">
        <div className="container section-head">
          <span className="eyebrow">{home.learningMethod.eyebrow}</span>
          <h2>{home.learningMethod.heading}</h2>
          <p className="muted">{home.learningMethod.text}</p>
          <div className="tag-row" style={{ justifyContent: 'center' }}>
            {home.learningMethod.tags.map((t, i) => (
              <span className="tag" key={i}>{t}</span>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Course Features */}
      <Reveal as="section" className="section section-alt">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">{home.courseFeatures.eyebrow}</span>
            <h2>{home.courseFeatures.heading}</h2>
          </div>
          <div className="grid grid-3">
            {home.courseFeatures.items.map((f, i) => (
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
            <span className="eyebrow">{home.services.eyebrow}</span>
            <h2>{home.services.heading}</h2>
            <p>{home.services.text}</p>
          </div>
          <div className="grid grid-3">
            {home.services.items.map((s, i) => (
              <Link className="card service-card hover-lift" to={s.link} key={i}>
                <div className="service-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p className="muted">{s.text}</p>
              </Link>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Courses - online and offline kept in separate blocks */}
      <section className="section section-alt" id="courses">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">{home.coursesPreview.eyebrow}</span>
            <h2>{home.coursesPreview.heading}</h2>
            <p>{home.coursesPreview.text}</p>
          </div>

          {['online', 'offline'].map((mode) => {
            const block = mode === 'online' ? home.learnOnline : home.learnOffline;
            const list = courses.filter((c) => c.featured && offersMode(c, mode));
            return (
              <Reveal className={`learn-block learn-block-${mode}`} key={mode} id={`learn-${mode}`}>
                <div className="learn-block-head">
                  <div>
                    <span className={`cc-mode-badge cc-mode-${mode} cc-mode-badge-inline`}>
                      <i className={`fas ${MODE_META[mode].icon}`} /> {MODE_META[mode].badge}
                    </span>
                    <h2>{block.heading}</h2>
                    <p>{block.text}</p>
                  </div>
                  <Link className="btn" to={MODE_META[mode].listingPath}>
                    {block.ctaText} <i className="fas fa-arrow-right" />
                  </Link>
                </div>
                <div className="cc-grid cc-grid-scroll">
                  {list.map((c) => (
                    <CourseListingCard key={c.slug} course={c} mode={mode} compact onEnroll={(course) => setModalState({ course, mode })} />
                  ))}
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Batch Timings - from the batches table */}
      <Reveal as="section" className="section" id="batch-timings">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">{home.batchTimingsSection.eyebrow}</span>
            <h2>{home.batchTimingsSection.heading}</h2>
            <p>{home.batchTimingsSection.text}</p>
          </div>
          <BatchTimings batches={batches} />
        </div>
      </Reveal>

      {/* Counselling teaser */}
      <Reveal as="section" className="section section-alt">
        <div className="container grid grid-2" style={{ alignItems: 'center' }}>
          <div>
            <span className="eyebrow">{home.counselling.eyebrow}</span>
            <h2>{home.counselling.heading}</h2>
            <p className="muted">{home.counselling.text}</p>
            <Link className="btn" to="/counselling">
              {home.counselling.ctaText}
            </Link>
          </div>
          <div className="card">
            <h3>{home.counselling.whatYouGetTitle}</h3>
            <ul>
              {home.counselling.whatYouGetBullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>

      {/* Achievements */}
      <Reveal as="section" className="section">
        <div className="container" style={{ maxWidth: 640, textAlign: 'center' }}>
          <span className="eyebrow">{home.achievements.eyebrow}</span>
          <h2>{home.achievements.heading}</h2>
          <ul style={{ listStyle: 'none', display: 'inline-block', textAlign: 'left' }}>
            {home.achievements.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      </Reveal>

      {/* Promise */}
      <Reveal as="section" className="section section-alt">
        <div className="container section-head">
          <span className="eyebrow">{home.promise.eyebrow}</span>
          <h2>{home.promise.heading}</h2>
        </div>
        <div className="container grid grid-4">
          {home.promise.items.map((p, i) => (
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
            <span className="eyebrow">{home.gallery.eyebrow}</span>
            <h2>{home.gallery.heading}</h2>
            <p>{home.gallery.text}</p>
          </div>
          <Gallery limit={15} />
        </div>
      </Reveal>

      {/* Site-wide student reviews */}
      <Reveal as="section" className="section section-alt" id="reviews">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">{home.reviews.eyebrow}</span>
            <h2>{home.reviews.heading}</h2>
            <p>{home.reviews.text}</p>
          </div>
          <div className="grid grid-2">
            <div className="card">
              <ReviewList />
            </div>
            <div className="card">
              <h3>{home.reviews.writeReviewTitle}</h3>
              <p className="muted" style={{ fontSize: 13.5 }}>
                {home.reviews.writeReviewText}
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
            <span className="eyebrow">{home.findUs.eyebrow}</span>
            <h2>{home.findUs.heading}</h2>
            <p>{home.findUs.text}</p>
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
          <span className="eyebrow">{home.faqsTeaser.eyebrow}</span>
          <h2>{home.faqsTeaser.heading}</h2>
          <p className="muted">{home.faqsTeaser.text}</p>
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
