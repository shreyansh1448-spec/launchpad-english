import React from 'react';
import useReveal from '../hooks/useReveal.js';

// Fade-up-on-scroll wrapper. `as` lets it render as any tag (section, div,
// etc.) while keeping all other props (className, id, style...) passed through.
export default function Reveal({ as: Tag = 'div', className = '', children, ...rest }) {
  const [ref, visible] = useReveal();
  return (
    <Tag ref={ref} className={`reveal${visible ? ' is-visible' : ''}${className ? ` ${className}` : ''}`} {...rest}>
      {children}
    </Tag>
  );
}
