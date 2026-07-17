import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useTypewriter from '../hooks/useTypewriter.js';

const DEFAULT_SLIDES = [
  {
    type: 'image',
    heading: 'Speak English fluently, clearly, & confidently.',
    subheading: 'Learn English through the Fastest Technology',
    description:
      "Whether you're a student, professional, or job seeker - we help you achieve your goals with practical English.",
    highlights: [
      'Basic to Advance',
      'Online & Offline Classes Available',
      'Prepare for IELTS / PTE',
      'Flexible Batches',
      'Weekday & Weekend',
    ],
    imageUrl: '/images/launchpad-banner.jfif',
    ctaText: 'Join Now',
    ctaLink: '/online-courses',
  },
];

// Slides come from SiteContent.heroSlides in the DB (falls back to
// DEFAULT_SLIDES if the API hasn't loaded yet). The intro video lives in the
// About section (right column), not as a hero slide.
export default function HeroSlider({ slides }) {
  const data = slides && slides.length ? slides : DEFAULT_SLIDES;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % data.length), 7000);
    return () => clearInterval(t);
  }, [data.length]);

  const go = (i) => setIndex((i + data.length) % data.length);

  return (
    <section className="hero-slider">
      <span className="floating-shape" style={{ width: 160, height: 160, top: '10%', left: '6%', background: 'var(--orange)' }} />
      <span className="floating-shape" style={{ width: 220, height: 220, bottom: '-6%', right: '8%', background: '#fff' }} />

      {data.map((slide, i) => (
        <div key={i} className={`hero-slide ${i === index ? 'active' : ''}`}>
          <div className="container">
            <div>
              <HeroHeading text={slide.heading} active={i === index} />
              <p className="lead">{slide.subheading}</p>
              {slide.description && <p className="hero-description">{slide.description}</p>}

              {slide.highlights && slide.highlights.length > 0 && (
                <div className="hero-highlights">
                  {slide.highlights.map((h, hi) => (
                    <span className="hero-highlight-chip" key={hi}>
                      ✔ {h}
                    </span>
                  ))}
                </div>
              )}

              <div className="hero-cta">
                <div>
                  {slide.ctaLink ? (
                    <Link className="btn btn-gradient" to={slide.ctaLink}>
                      {slide.ctaText || 'Join Now'}
                    </Link>
                  ) : (
                    <Link className="btn btn-gradient" to="/online-courses">
                      Join Now
                    </Link>
                  )}
                  {slide.ctaSubtext && <div className="hero-cta-subtext">{slide.ctaSubtext}</div>}
                </div>
                <Link className="btn btn-outline" to="/contact">
                  Talk to a Counsellor
                </Link>
              </div>
            </div>

            {slide.type === 'video' ? (
              <div className="hero-video-wrap">
                <iframe
                  src={slide.videoUrl}
                  title="Launch Pad English introduction video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <HeroArt imageUrl={slide.imageUrl} />
            )}
          </div>
        </div>
      ))}

      {data.length > 1 && (
        <>
          <button className="slider-arrow left" onClick={() => go(index - 1)} aria-label="Previous slide">‹</button>
          <button className="slider-arrow right" onClick={() => go(index + 1)} aria-label="Next slide">›</button>
          <div className="slider-dots">
            {data.map((_, i) => (
              <button key={i} className={i === index ? 'active' : ''} onClick={() => go(i)} aria-label={`Go to slide ${i + 1}`} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// Shows the admin-uploaded hero photo (SiteContent.heroSlides[].imageUrl) if
// set, otherwise falls back to the bullet-list "why us" card.
function HeroArt({ imageUrl }) {
  const [failed, setFailed] = useState(!imageUrl);
  if (!failed) {
    return (
      <div className="hero-art hero-art-image">
        <img src={imageUrl} alt="Launch Pad English students" onError={() => setFailed(true)} />
      </div>
    );
  }
  return (
    <div className="hero-art glass-card">
      <ul>
        <li><span className="dot" /> 15+ years training students in South Delhi</li>
        <li><span className="dot" /> Spoken English, IELTS &amp; PTE under one roof</li>
        <li><span className="dot" /> Live online and offline classroom batches</li>
        <li><span className="dot" /> Certificate + study material on every course</li>
      </ul>
    </div>
  );
}

// Types the heading out once its slide first becomes active - not on every
// re-visit, and not for slides that never become active.
function HeroHeading({ text, active }) {
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (active) setStarted(true);
  }, [active]);
  const display = useTypewriter(text, { enabled: started, speed: 28 });
  return (
    <div className="hero-heading-stack">
      <h1 className="hero-heading-ghost" aria-hidden="true">
        {text}
      </h1>
      <h1>{display || ' '}</h1>
    </div>
  );
}
