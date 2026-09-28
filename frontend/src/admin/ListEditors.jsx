import React, { useState } from 'react';
import SortableList from './SortableList.jsx';

// Add / edit / delete / reorder a list of short text items (features,
// learning outcomes, "who should join"...). `suggestions` shows one-click
// chips for common entries not already in the list.
export function StringListEditor({ items = [], onChange, placeholder = 'Type and press Enter', addLabel = 'Add', suggestions = [] }) {
  const [draft, setDraft] = useState('');

  function add(value) {
    const v = value.trim();
    if (!v) return;
    onChange([...items, v]);
    setDraft('');
  }

  const unused = suggestions.filter((s) => !items.some((i) => i.toLowerCase() === s.toLowerCase()));

  return (
    <div className="list-editor">
      <SortableList
        items={items}
        onChange={onChange}
        emptyText="Nothing added yet."
        renderItem={(item, i, { update, remove }) => (
          <div className="list-editor-row">
            <input className="form-control" value={item} onChange={(e) => update(e.target.value)} aria-label={`Item ${i + 1}`} />
            <button type="button" className="icon-btn danger" onClick={remove} aria-label="Delete">
              <i className="fas fa-trash" />
            </button>
          </div>
        )}
      />
      <div className="list-editor-add">
        <input
          className="form-control"
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add(draft);
            }
          }}
        />
        <button type="button" className="btn btn-sm" onClick={() => add(draft)}>
          <i className="fas fa-plus" /> {addLabel}
        </button>
      </div>
      {unused.length > 0 && (
        <div className="suggestion-chips">
          <span className="muted">Quick add:</span>
          {unused.map((s) => (
            <button type="button" key={s} className="suggestion-chip" onClick={() => onChange([...items, s])}>
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Visual curriculum manager: modules, each with its own topic list. Both
// levels can be added, renamed, deleted and dragged into a new order.
export function CurriculumManager({ modules = [], onChange }) {
  const [collapsed, setCollapsed] = useState({});

  return (
    <div className="curriculum-editor">
      <SortableList
        items={modules}
        onChange={onChange}
        emptyText="No modules yet - add the first one below."
        renderItem={(m, i, { update, remove }) => (
          <div className="module-editor">
            <div className="module-editor-head">
              <span className="module-editor-num">Module {i + 1}</span>
              <input
                className="form-control"
                value={m.module}
                placeholder="Module title, e.g. Introduction to IELTS"
                onChange={(e) => update({ ...m, module: e.target.value })}
                aria-label={`Module ${i + 1} title`}
              />
              <button
                type="button"
                className="icon-btn"
                onClick={() => setCollapsed((c) => ({ ...c, [i]: !c[i] }))}
                aria-label={collapsed[i] ? 'Expand module' : 'Collapse module'}
              >
                <i className={`fas fa-chevron-${collapsed[i] ? 'down' : 'up'}`} />
              </button>
              <button
                type="button"
                className="icon-btn danger"
                onClick={() => (m.points?.length ? window.confirm(`Delete "${m.module || `Module ${i + 1}`}" and its ${m.points.length} topics?`) : true) && remove()}
                aria-label="Delete module"
              >
                <i className="fas fa-trash" />
              </button>
            </div>
            {!collapsed[i] && (
              <div className="module-editor-topics">
                <SortableList
                  items={m.points || []}
                  onChange={(points) => update({ ...m, points })}
                  className="sortable-compact"
                  emptyText="No topics yet."
                  renderItem={(t, j, topic) => (
                    <div className="list-editor-row">
                      <input
                        className="form-control"
                        value={t}
                        placeholder="Topic"
                        onChange={(e) => topic.update(e.target.value)}
                        aria-label={`Module ${i + 1} topic ${j + 1}`}
                      />
                      <button type="button" className="icon-btn danger" onClick={topic.remove} aria-label="Delete topic">
                        <i className="fas fa-times" />
                      </button>
                    </div>
                  )}
                />
                <button type="button" className="btn-link" onClick={() => update({ ...m, points: [...(m.points || []), ''] })}>
                  <i className="fas fa-plus" /> Add Topic
                </button>
              </div>
            )}
          </div>
        )}
      />
      <button type="button" className="btn btn-sm mt-12" onClick={() => onChange([...modules, { module: '', points: [''] }])}>
        <i className="fas fa-plus" /> Add Module
      </button>
    </div>
  );
}

export function FaqEditor({ faqs = [], onChange }) {
  return (
    <div>
      <SortableList
        items={faqs}
        onChange={onChange}
        emptyText="No FAQs yet. FAQs appear on the course page and in Google results (FAQ schema)."
        renderItem={(f, i, { update, remove }) => (
          <div className="faq-editor">
            <div className="list-editor-row">
              <input className="form-control" value={f.q} placeholder="Question" onChange={(e) => update({ ...f, q: e.target.value })} aria-label={`Question ${i + 1}`} />
              <button type="button" className="icon-btn danger" onClick={remove} aria-label="Delete FAQ">
                <i className="fas fa-trash" />
              </button>
            </div>
            <textarea className="form-control" rows={2} value={f.a} placeholder="Answer" onChange={(e) => update({ ...f, a: e.target.value })} aria-label={`Answer ${i + 1}`} />
          </div>
        )}
      />
      <button type="button" className="btn btn-sm mt-12" onClick={() => onChange([...faqs, { q: '', a: '' }])}>
        <i className="fas fa-plus" /> Add FAQ
      </button>
    </div>
  );
}
