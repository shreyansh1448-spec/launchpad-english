import { useEffect, useState } from 'react';
import { api } from '../api.js';

// One shared request per page load for the site-wide content (phone,
// WhatsApp number, "why choose us" copy...) instead of one per component.
let cached = null;
let pending = null;

export default function useSiteContent() {
  const [content, setContent] = useState(cached);
  useEffect(() => {
    if (cached) return undefined;
    let alive = true;
    pending =
      pending ||
      api
        .getSiteContent()
        .then((c) => (cached = c))
        .catch(() => null);
    pending.then((c) => alive && setContent(c));
    return () => {
      alive = false;
    };
  }, []);
  return content;
}
