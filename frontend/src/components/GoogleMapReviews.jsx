import React from 'react';

// Real testimonials gathered from launchpadenglish.com, shown here in a
// "Google Reviews" style card list. There's no Google Places API key wired
// in (none was provided), so this renders curated reviews instead of a live
// Places widget - swap the fetch for the Places API once you have a key
// (see README "Going live: Google Reviews"). Shown full-width, below the
// map + contact card (not side-by-side with the map).
const GOOGLE_REVIEWS = [
  { name: 'Komal', role: 'Nursing Officer, AIIMS', stars: 5, text: 'I joined Launch Pad English to improve my English skills, and it has been a great experience. The teachers explain everything clearly. Good communication is important for my role, and this institute really helped me.' },
  { name: 'Ankit', role: 'BPSC Account Officer', stars: 5, text: 'Excellent experience! The coaching provided was top-notch, helping me prepare effectively for the BPSC exam. The supportive environment and dedicated instructors made a significant difference.' },
  { name: 'Madhumalini', role: 'Sub Inspector', stars: 5, text: 'I completed a Spoken English course here. The atmosphere is very warm and friendly, and the teachers really care about the improvement of their students. Best institute for English learning.' },
  { name: 'Shushanta Lenka', role: 'Defence, Indian Army', stars: 5, text: 'Your classes have made learning enjoyable and effective. I have gained so much confidence in my English skills, which is vital for my career in the army.' },
  { name: 'Priya Mittle', role: 'Medical Transcriptionist H.O.D', stars: 5, text: 'Thank you for transforming my communication skills! Your engaging lessons and practical approach made a significant difference in my professional life.' },
];

export default function GoogleMapReviews({ placeUrl }) {
  return (
    <div className="card google-reviews-strip">
      <div className="google-badge">
        <span className="g-logo">
          <span>G</span><span>o</span><span>o</span><span>g</span><span>l</span><span>e</span>
        </span>
        <span style={{ fontWeight: 700 }}>Reviews · 4.9 ★ (424 Google reviews)</span>
      </div>
      <div className="grid grid-3">
        {GOOGLE_REVIEWS.map((r, i) => (
          <div className="testi-card" key={i}>
            <div style={{ color: '#ffb300', marginBottom: 6 }}>{'★'.repeat(r.stars)}</div>
            <p className="testi-quote">“{r.text}”</p>
            <div className="testi-person">
              <div className="review-avatar" style={{ width: 36, height: 36 }}>{r.name.charAt(0)}</div>
              <div>
                <div className="review-name">{r.name}</div>
                <div className="review-date">{r.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="center mt-24">
        <a
          className="btn btn-navy btn-sm"
          href={placeUrl || 'https://maps.app.goo.gl/FRorYAGZGYHqL8Z96'}
          target="_blank"
          rel="noreferrer"
        >
          View All Reviews on Google
        </a>
      </div>
    </div>
  );
}
