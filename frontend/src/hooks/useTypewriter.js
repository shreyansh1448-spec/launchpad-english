import { useEffect, useState } from 'react';

// Types `text` out character by character. Resets whenever `text` changes
// (e.g. hero slide change). Renders the full text immediately if `enabled`
// is false, so it degrades gracefully.
export default function useTypewriter(text, { speed = 35, enabled = true } = {}) {
  const [display, setDisplay] = useState(enabled ? '' : text);

  useEffect(() => {
    if (!enabled || !text) {
      setDisplay(text || '');
      return;
    }
    setDisplay('');
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setDisplay(text.slice(0, i));
      if (i >= text.length) clearInterval(t);
    }, speed);
    return () => clearInterval(t);
  }, [text, enabled, speed]);

  return display;
}
