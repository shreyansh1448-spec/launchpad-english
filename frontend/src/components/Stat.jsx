import React from 'react';
import useCountUp from '../hooks/useCountUp.js';

// Renders a number that counts up from 0 once scrolled into view, with an
// optional prefix/suffix (e.g. suffix="+", suffix="%").
export default function Stat({ value, prefix = '', suffix = '', className = '' }) {
  const [ref, count] = useCountUp(value);
  return (
    <div ref={ref} className={className}>
      {prefix}
      {count.toLocaleString('en-IN')}
      {suffix}
    </div>
  );
}
