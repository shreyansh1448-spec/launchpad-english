// Google Ads conversion tracking. The base gtag.js tag (AW-18461918319) is
// loaded in index.html; this just reports a conversion event through it.
// No-ops if the tag was blocked (ad blockers, etc.) so forms never break.
const LEAD_CONVERSION = 'AW-18461918319/7684COm6yowdEO-IquNE';

export function trackLeadConversion() {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', 'conversion', { send_to: LEAD_CONVERSION, value: 1.0, currency: 'INR' });
}
