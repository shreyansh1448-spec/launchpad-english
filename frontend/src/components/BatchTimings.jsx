import React from 'react';

// Shown once sitewide (Home page) instead of repeating the same timings on
// every course detail page. Sourced from SiteContent.batchTimings.
export default function BatchTimings({ timings }) {
  const onlineWeekday = timings?.onlineWeekday || [];
  const onlineWeekend = timings?.onlineWeekend || [];
  const offlineWeekday = timings?.offlineWeekday || [];
  const offlineWeekend = timings?.offlineWeekend || [];

  return (
    <div className="grid grid-4">
      <div className="card timing-card hover-lift">
        <h3>💻 Online Weekday</h3>
        <ul className="timing-list">
          {onlineWeekday.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </div>
      <div className="card timing-card hover-lift">
        <h3>🗓️ Online Weekend</h3>
        <ul className="timing-list">
          {onlineWeekend.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </div>
      <div className="card timing-card hover-lift">
        <h3>🏫 Offline Weekday</h3>
        <ul className="timing-list">
          {offlineWeekday.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </div>
      <div className="card timing-card hover-lift">
        <h3>🏫 Offline Weekend</h3>
        <ul className="timing-list">
          {offlineWeekend.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
