import React from 'react';

function formatRupees(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

// Renders the "Rs 18,000 [struck through] Rs 15,000 Only" style used across
// the whole site. mrp/offer come straight from the course's DB pricing
// object, so editing the price in the database is all it takes to update
// this everywhere.
export default function PriceTag({ mrp, offer, size }) {
  const savePct = mrp > offer ? Math.round(((mrp - offer) / mrp) * 100) : 0;
  return (
    <div className="price-tag" style={size === 'lg' ? { fontSize: '1.05em' } : undefined}>
      {mrp > offer && <span className="mrp">{formatRupees(mrp)}</span>}
      <span className="offer">
        {formatRupees(offer)} <small>Only</small>
      </span>
      {savePct > 0 && <span className="save">Save {savePct}%</span>}
    </div>
  );
}
