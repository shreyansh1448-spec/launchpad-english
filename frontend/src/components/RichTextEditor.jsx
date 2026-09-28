import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { prepareImage } from '../lib/image.js';
import { videoEmbed } from '../lib/video.js';

// WYSIWYG editor for course descriptions and blog posts - admins click
// Bold / Heading / Table / Image instead of typing HTML. Emits an HTML
// string; the "HTML" toggle allows direct source edits when needed.
const TOOLBAR = [
  { cmd: 'bold', icon: 'fa-bold', title: 'Bold' },
  { cmd: 'italic', icon: 'fa-italic', title: 'Italic' },
  { cmd: 'underline', icon: 'fa-underline', title: 'Underline' },
  'sep',
  { cmd: 'formatBlock', arg: 'H2', label: 'H2', title: 'Heading' },
  { cmd: 'formatBlock', arg: 'H3', label: 'H3', title: 'Subheading' },
  { cmd: 'formatBlock', arg: 'H4', label: 'H4', title: 'Small heading' },
  { cmd: 'formatBlock', arg: 'P', label: '¶', title: 'Paragraph' },
  'sep',
  { cmd: 'insertUnorderedList', icon: 'fa-list-ul', title: 'Bullet list' },
  { cmd: 'insertOrderedList', icon: 'fa-list-ol', title: 'Numbered list' },
  { cmd: 'formatBlock', arg: 'BLOCKQUOTE', icon: 'fa-quote-right', title: 'Quote' },
  'sep',
  { cmd: 'link', icon: 'fa-link', title: 'Insert link' },
  { cmd: 'image', icon: 'fa-image', title: 'Insert image' },
  { cmd: 'video', icon: 'fa-video', title: 'Embed video (YouTube / Vimeo / mp4)' },
  { cmd: 'table', icon: 'fa-table', title: 'Insert table' },
  'sep',
  { cmd: 'undo', icon: 'fa-rotate-left', title: 'Undo' },
  { cmd: 'redo', icon: 'fa-rotate-right', title: 'Redo' },
  { cmd: 'removeFormat', icon: 'fa-eraser', title: 'Clear formatting' },
];

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export default function RichTextEditor({ value, onChange, minHeight = 260 }) {
  const ref = useRef(null);
  const lastValue = useRef();
  const savedRange = useRef(null);
  const fileRef = useRef(null);
  const [source, setSource] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!source && ref.current && value !== lastValue.current) {
      ref.current.innerHTML = value || '';
      lastValue.current = value;
    }
  }, [value, source]);

  function emitChange() {
    const html = ref.current.innerHTML;
    lastValue.current = html;
    onChange(html);
  }

  function saveSelection() {
    const sel = window.getSelection();
    if (sel.rangeCount && ref.current?.contains(sel.anchorNode)) savedRange.current = sel.getRangeAt(0);
  }

  function restoreSelection() {
    ref.current.focus();
    if (savedRange.current) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  }

  function insertHtml(html) {
    restoreSelection();
    document.execCommand('insertHTML', false, html);
    emitChange();
  }

  async function handleImageFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const { url } = await api.admin.uploadMedia(await prepareImage(file, 1400), file.name);
      const alt = window.prompt('Describe the image (alt text, helps SEO):', '') || '';
      insertHtml(`<img src="${escapeAttr(url)}" alt="${escapeAttr(alt)}" />`);
    } catch (err) {
      window.alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  function runCommand(btn) {
    saveSelection();
    if (btn.cmd === 'link') {
      const url = window.prompt('Link URL (leave blank to remove link):', 'https://');
      if (url === null) return;
      restoreSelection();
      document.execCommand(url && url !== 'https://' ? 'createLink' : 'unlink', false, url || undefined);
    } else if (btn.cmd === 'image') {
      const choice = window.confirm('Upload an image from your computer?\n\nOK = Upload file, Cancel = Paste an image URL');
      if (choice) {
        fileRef.current?.click();
        return;
      }
      const url = window.prompt('Image URL:');
      if (!url) return;
      const alt = window.prompt('Describe the image (alt text):', '') || '';
      insertHtml(`<img src="${escapeAttr(url)}" alt="${escapeAttr(alt)}" />`);
      return;
    } else if (btn.cmd === 'video') {
      const url = window.prompt('Paste a YouTube, Vimeo or .mp4 link:');
      if (!url) return;
      const embed = videoEmbed(url);
      if (!embed) return window.alert("That link isn't a supported video (YouTube, Vimeo or .mp4).");
      insertHtml(
        embed.type === 'iframe'
          ? `<div class="video-embed"><iframe src="${escapeAttr(embed.src)}" allowfullscreen loading="lazy" title="Video"></iframe></div><p></p>`
          : `<video src="${escapeAttr(embed.src)}" controls preload="metadata"></video><p></p>`
      );
      return;
    } else if (btn.cmd === 'table') {
      const spec = window.prompt('Table size - columns x rows:', '3 x 3');
      if (!spec) return;
      const [cols, rows] = spec.split(/[x×, ]+/).map((n) => Math.min(10, Math.max(1, parseInt(n, 10) || 3)));
      const head = `<tr>${Array.from({ length: cols }, (_, i) => `<th>Heading ${i + 1}</th>`).join('')}</tr>`;
      const body = Array.from({ length: rows }, () => `<tr>${'<td>&nbsp;</td>'.repeat(cols)}</tr>`).join('');
      insertHtml(`<table><thead>${head}</thead><tbody>${body}</tbody></table><p></p>`);
      return;
    } else {
      restoreSelection();
      document.execCommand(btn.cmd, false, btn.arg);
    }
    emitChange();
  }

  return (
    <div className="rte">
      <div className="rte-toolbar">
        {TOOLBAR.map((btn, i) =>
          btn === 'sep' ? (
            <span className="rte-sep" key={`sep-${i}`} />
          ) : (
            <button
              key={btn.title}
              type="button"
              title={btn.title}
              aria-label={btn.title}
              disabled={source || busy}
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
              }}
              onClick={() => runCommand(btn)}
            >
              {btn.icon ? <i className={`fas ${btn.icon}`} /> : btn.label}
            </button>
          )
        )}
        <button type="button" className={`rte-source-toggle ${source ? 'active' : ''}`} onClick={() => {
            // The visual editor remounts on the way back - force it to reload the HTML.
            lastValue.current = undefined;
            setSource((s) => !s);
          }}
          title="Edit HTML source"
        >
          <i className="fas fa-code" /> HTML
        </button>
        {busy && <span className="spinner" />}
      </div>
      {source ? (
        <textarea
          className="rte-source"
          style={{ minHeight }}
          value={value || ''}
          onChange={(e) => {
            lastValue.current = undefined;
            onChange(e.target.value);
          }}
        />
      ) : (
        <div
          ref={ref}
          className="rte-editor rich-content"
          style={{ minHeight }}
          contentEditable
          onInput={emitChange}
          onBlur={saveSelection}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}
          suppressContentEditableWarning
        />
      )}
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImageFile} />
    </div>
  );
}
