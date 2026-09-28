import React from 'react';
import { Link } from 'react-router-dom';

// crumbs: [{ name, path }] - the last one is the current page (not a link).
// Built by breadcrumbsFor() in shared/course.js, which also feeds the
// BreadcrumbList JSON-LD, so the visible trail and structured data match.
export default function Breadcrumbs({ crumbs, light = false }) {
  return (
    <nav className={`breadcrumbs ${light ? 'breadcrumbs-light' : ''}`} aria-label="Breadcrumb">
      <ol>
        {crumbs.map((c, i) => (
          <li key={c.path}>
            {i === crumbs.length - 1 ? <span aria-current="page">{c.name}</span> : <Link to={c.path}>{c.name}</Link>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
