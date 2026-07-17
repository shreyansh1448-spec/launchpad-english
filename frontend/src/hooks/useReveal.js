import { useEffect, useRef, useState } from 'react';

// Reveals an element (fade + slide up) the first time it scrolls into view.
// Falls back to always-visible if IntersectionObserver isn't available, so
// content is never hidden if JS is slow or unsupported.
export default function useReveal(options) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, ...options }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
}
