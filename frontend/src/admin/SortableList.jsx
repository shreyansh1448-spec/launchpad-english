import React, { useState } from 'react';

// Generic reorderable list: drag the grip handle (desktop) or use the ↑/↓
// buttons (touch screens). renderItem(item, index, { update, remove }) draws
// the item's own fields. Nested SortableLists (topics inside modules) work
// because each list only reacts to drags it started itself.
export default function SortableList({ items, onChange, renderItem, className = '', emptyText }) {
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  function move(from, to) {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  function reset() {
    setDragIndex(null);
    setOverIndex(null);
  }

  if (!items.length && emptyText) return <p className="sortable-empty">{emptyText}</p>;

  return (
    <div className={`sortable ${className}`}>
      {items.map((item, i) => (
        <div
          key={i}
          className={`sortable-item ${dragIndex === i ? 'dragging' : ''} ${overIndex === i && dragIndex !== i ? 'drag-over' : ''}`}
          onDragOver={(e) => {
            if (dragIndex === null) return;
            e.preventDefault();
            e.stopPropagation();
            if (overIndex !== i) setOverIndex(i);
          }}
          onDrop={(e) => {
            if (dragIndex === null) return;
            e.preventDefault();
            e.stopPropagation();
            move(dragIndex, i);
            reset();
          }}
        >
          <div className="sortable-controls">
            <span
              className="drag-handle"
              draggable
              title="Drag to reorder"
              onDragStart={(e) => {
                e.stopPropagation();
                setDragIndex(i);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', String(i));
                const row = e.currentTarget.closest('.sortable-item');
                if (row) e.dataTransfer.setDragImage(row, 24, 20);
              }}
              onDragEnd={reset}
            >
              <i className="fas fa-grip-vertical" />
            </span>
            <button type="button" className="icon-btn" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move up">
              <i className="fas fa-arrow-up" />
            </button>
            <button type="button" className="icon-btn" onClick={() => move(i, i + 1)} disabled={i === items.length - 1} aria-label="Move down">
              <i className="fas fa-arrow-down" />
            </button>
          </div>
          <div className="sortable-body">
            {renderItem(item, i, {
              update: (value) => onChange(items.map((x, j) => (j === i ? value : x))),
              remove: () => onChange(items.filter((_, j) => j !== i)),
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
