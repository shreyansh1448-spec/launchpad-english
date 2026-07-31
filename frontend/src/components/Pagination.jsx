import React from 'react';

// Builds a compact page-number sequence with "..." gaps: page 1, the last
// page, and a small window around the current page (e.g. page 47 of 139
// shows 1 ... 46 47 48 ... 139).
export function getPageNumbers(current, total) {
  const pages = new Set([1, total, current]);
  for (let p = current - 1; p <= current + 1; p++) {
    if (p >= 1 && p <= total) pages.add(p);
  }

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('...');
    result.push(sorted[i]);
  }
  return result;
}

// Shared numbered-pagination control (page 1 ... window ... last, plus an
// optional "jump to page" box for large page counts) used by both the public
// Blog list and the admin Blogs table.
export default function Pagination({
  page,
  totalPages,
  onPageChange,
  prevLabel = '‹',
  nextLabel = '›',
  className = '',
  showJump = false,
  jumpFieldId = 'jumpPage',
}) {
  if (totalPages <= 1) return null;

  return (
    <>
      <div className={`pagination ${className}`.trim()}>
        <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          {prevLabel}
        </button>
        {getPageNumbers(page, totalPages).map((p, i) =>
          p === '...' ? (
            <span className="pagination-ellipsis" key={`ellipsis-${i}`}>
              …
            </span>
          ) : (
            <button key={p} className={p === page ? 'active' : ''} onClick={() => onPageChange(p)}>
              {p}
            </button>
          )
        )}
        <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          {nextLabel}
        </button>
      </div>

      {showJump && totalPages > 10 && (
        <form
          className="blog-jump-form"
          onSubmit={(e) => {
            e.preventDefault();
            const val = Number(new FormData(e.currentTarget).get(jumpFieldId));
            if (val >= 1 && val <= totalPages) onPageChange(val);
          }}
        >
          <label htmlFor={jumpFieldId}>Jump to page</label>
          <input id={jumpFieldId} name={jumpFieldId} type="number" min="1" max={totalPages} placeholder={String(page)} />
          <button type="submit" className="btn btn-sm">
            Go
          </button>
          <span className="muted">of {totalPages}</span>
        </form>
      )}
    </>
  );
}
