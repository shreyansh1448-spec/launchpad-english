import React from 'react';
import { MODE_META, DAY_TYPE_LABEL, BATCH_STATUS_LABEL } from '../../shared/course.js';

// Batch slots from the batches table, grouped as Online/Offline x
// Weekday/Weekend. `modes` limits which modes are shown (e.g. only online on
// the Online Courses page). With `onSelect`, each slot becomes a button.
export default function BatchTimings({ batches = [], modes = ['online', 'offline'], onSelect, selectedId }) {
  const groups = [];
  for (const mode of modes) {
    for (const dayType of ['weekday', 'weekend', 'daily']) {
      const items = batches.filter((b) => b.mode === mode && b.dayType === dayType);
      if (items.length) groups.push({ mode, dayType, items });
    }
  }
  if (!groups.length) {
    return <p className="muted center">New batch timings will be announced soon - talk to our counsellor for the next start date.</p>;
  }

  return (
    <div className={`grid batch-grid batch-grid-${Math.min(groups.length, 4)}`}>
      {groups.map(({ mode, dayType, items }) => (
        <div className="card timing-card" key={`${mode}-${dayType}`}>
          <h3>
            <i className={`fas ${MODE_META[mode].icon}`} /> {MODE_META[mode].label} {DAY_TYPE_LABEL[dayType]}
          </h3>
          <ul className="timing-list">
            {items.map((b) => {
              const content = (
                <>
                  <span className="timing-time">{b.timeLabel}</span>
                  <span className="timing-meta">
                    {b.classroom && <span>{b.classroom}</span>}
                    {b.startDate && <span>Starts {formatDate(b.startDate)}</span>}
                    {b.seatsAvailable !== null && b.bookable && <span>{b.seatsAvailable} seats left</span>}
                    {b.status !== 'open' && <span className={`batch-status batch-status-${b.status}`}>{BATCH_STATUS_LABEL[b.status]}</span>}
                  </span>
                </>
              );
              return (
                <li key={b._id} className={b.bookable ? '' : 'timing-unavailable'}>
                  {onSelect && b.bookable ? (
                    <button
                      type="button"
                      className={`timing-select ${selectedId === b._id ? 'selected' : ''}`}
                      onClick={() => onSelect(b)}
                    >
                      {content}
                    </button>
                  ) : (
                    content
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function formatDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
