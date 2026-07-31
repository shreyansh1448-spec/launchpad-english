import React, { useEffect, useRef } from 'react';

// Minimal WYSIWYG editor for the admin Blog content field - a normal person
// clicks Bold/Headings/Lists instead of typing HTML tags. Stores/emits the
// same HTML string the backend already expects, so nothing else changes.
const TOOLBAR = [
  { cmd: 'bold', label: 'B', title: 'Bold', style: { fontWeight: 700 } },
  { cmd: 'italic', label: 'I', title: 'Italic', style: { fontStyle: 'italic' } },
  { cmd: 'underline', label: 'U', title: 'Underline', style: { textDecoration: 'underline' } },
  { cmd: 'formatBlock', arg: 'H2', label: 'H2', title: 'Heading' },
  { cmd: 'formatBlock', arg: 'H3', label: 'H3', title: 'Subheading' },
  { cmd: 'formatBlock', arg: 'P', label: 'Text', title: 'Paragraph' },
  { cmd: 'insertUnorderedList', label: '• List', title: 'Bullet List' },
  { cmd: 'insertOrderedList', label: '1. List', title: 'Numbered List' },
  { cmd: 'link', label: '🔗 Link', title: 'Insert Link' },
  { cmd: 'removeFormat', label: 'Clear', title: 'Clear Formatting' },
];

export default function RichTextEditor({ value, onChange }) {
  const ref = useRef(null);
  const lastValue = useRef();

  useEffect(() => {
    if (ref.current && value !== lastValue.current) {
      ref.current.innerHTML = value || '';
      lastValue.current = value;
    }
  }, [value]);

  function emitChange() {
    const html = ref.current.innerHTML;
    lastValue.current = html;
    onChange(html);
  }

  function runCommand(btn) {
    ref.current.focus();
    if (btn.cmd === 'link') {
      const url = window.prompt('Link URL (leave blank to remove link):');
      if (url === null) return;
      document.execCommand(url ? 'createLink' : 'unlink', false, url || undefined);
    } else {
      document.execCommand(btn.cmd, false, btn.arg);
    }
    emitChange();
  }

  return (
    <div className="rte">
      <div className="rte-toolbar">
        {TOOLBAR.map((btn) => (
          <button
            key={btn.title}
            type="button"
            title={btn.title}
            style={btn.style}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runCommand(btn)}
          >
            {btn.label}
          </button>
        ))}
      </div>
      <div ref={ref} className="rte-editor" contentEditable onInput={emitChange} suppressContentEditableWarning />
    </div>
  );
}
