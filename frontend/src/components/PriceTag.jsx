import React from 'react';
import { discountPct, formatPrice } from '../../shared/course.js';

// Renders the "₹18,000 [struck through] ₹15,000 Only - Save 17%" style used
// across the whole site. mrp/offer come straight from the course's DB
// pricing, so editing the price in the admin panel updates this everywhere.
export default function PriceTag({ mrp, offer, size, currency = 'INR', hideOnly = false }) {
  const savePct = discountPct(mrp, offer);
  return (
    <div className={`price-tag ${size === 'lg' ? 'price-tag-lg' : ''} ${size === 'sm' ? 'price-tag-sm' : ''}`}>
      {savePct > 0 && <span className="mrp">{formatPrice(mrp, currency)}</span>}
      <span className="offer">
        {formatPrice(offer, currency)} {!hideOnly && <small>Only</small>}
      </span>
      {savePct > 0 && <span className="save">{savePct}% OFF</span>}
    </div>
  );
}
