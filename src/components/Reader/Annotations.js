'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Check, FileDown, StickyNote, Trash2, X } from 'lucide-react';
import { COLORS, byPosition } from '@/lib/annotations';
const label = { yellow: 'Yellow', green: 'Green', blue: 'Blue', pink: 'Pink' };
function Swatches({ value, onPick }) {
  return (
    <div className="mark-swatches" role="group" aria-label="Highlight colour">
      {COLORS.map((color) => (
        <button
          key={color}
          className={`swatch swatch-${color}`}
          aria-label={`${label[color]} highlight`}
          aria-pressed={value === color}
          onClick={() => onPick(color)}
        >
          {value === color && <Check size={13} aria-hidden="true" />}
        </button>
      ))}
    </div>
  );
}
// Floats beside a fresh selection or a tapped highlight: colour, note, delete.
export function AnnotationPopover({
  popover,
  annotation,
  onCreate,
  onUpdate,
  onDelete,
  onClose,
}) {
  const box = useRef(null);
  const [writing, setWriting] = useState(!!popover.writing);
  const [note, setNote] = useState(annotation?.note || '');
  const [place, setPlace] = useState({ left: popover.x, top: popover.y });
  useLayoutEffect(() => {
    const rect = box.current.getBoundingClientRect();
    const left = Math.max(
      8,
      Math.min(innerWidth - rect.width - 8, popover.x - rect.width / 2),
    );
    const below = popover.y + 10;
    const top =
      below + rect.height > innerHeight - 8
        ? Math.max(8, popover.top - rect.height - 10)
        : below;
    setPlace({ left, top });
  }, [popover, writing]);
  const saveNote = () => {
    if (annotation && note !== (annotation.note || ''))
      onUpdate(annotation.id, { note });
  };
  return (
    <div
      ref={box}
      className="mark-popover"
      role="dialog"
      aria-label={annotation ? 'Edit highlight' : 'Highlight selection'}
      style={place}
      // Pressing a colour must not clear the selection it is about to save.
      onMouseDown={(event) => {
        if (!annotation) event.preventDefault();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          saveNote();
          onClose();
        }
      }}
    >
      {annotation?.kind !== 'note' && (
        <div className="mark-popover-row">
          <Swatches
            value={annotation?.color}
            onPick={(color) =>
              annotation ? onUpdate(annotation.id, { color }) : onCreate(color)
            }
          />
          {!writing && (
            <button
              className="mark-note-button"
              onClick={() =>
                annotation ? setWriting(true) : onCreate('yellow', true)
              }
            >
              <StickyNote size={15} aria-hidden="true" />
              {annotation?.note ? 'Edit note' : 'Add note'}
            </button>
          )}
          {annotation && (
            <button
              className="mark-icon"
              aria-label="Delete highlight"
              onClick={() => onDelete(annotation.id)}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      )}
      {annotation && (writing || annotation.kind === 'note') && (
        <div className="mark-note">
          <textarea
            aria-label="Note"
            value={note}
            autoFocus
            maxLength={10000}
            placeholder="What does this make you think?"
            onChange={(event) => setNote(event.target.value)}
          />
          <div className="mark-popover-row">
            {annotation.kind === 'note' && (
              <button
                className="mark-icon"
                aria-label="Delete note"
                onClick={() => onDelete(annotation.id)}
              >
                <Trash2 size={15} />
              </button>
            )}
            <button
              className="mark-done"
              onClick={() => {
                saveNote();
                onClose();
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
function NoteItem({ annotation, go, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(annotation.note || '');
  return (
    <li className={`note-item note-${annotation.color || 'page'}`}>
      <button className="note-jump" onClick={() => go(annotation.page)}>
        <span className="note-page">Page {annotation.page + 1}</span>
        {annotation.text && <q>{annotation.text}</q>}
        {!editing && annotation.note && <p>{annotation.note}</p>}
      </button>
      {editing ? (
        <div className="mark-note">
          <textarea
            aria-label={`Note for page ${annotation.page + 1}`}
            value={note}
            autoFocus
            maxLength={10000}
            onChange={(event) => setNote(event.target.value)}
          />
          <button
            className="mark-done"
            onClick={() => {
              onUpdate(annotation.id, { note });
              setEditing(false);
            }}
          >
            Save
          </button>
        </div>
      ) : (
        <div className="note-actions">
          <button onClick={() => setEditing(true)}>
            {annotation.note ? 'Edit note' : 'Add note'}
          </button>
          <button
            aria-label={`Delete ${annotation.kind === 'note' ? 'note' : 'highlight'} on page ${annotation.page + 1}`}
            onClick={() => onDelete(annotation.id)}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </li>
  );
}
// Every highlight and note in the book, in reading order.
export function NotesPanel({
  annotations,
  page,
  go,
  onAddNote,
  onUpdate,
  onDelete,
  onExport,
  onClose,
}) {
  const [draft, setDraft] = useState('');
  const panel = useRef(null);
  useEffect(() => {
    panel.current?.querySelector('textarea')?.focus();
  }, []);
  const sorted = [...annotations].sort(byPosition);
  return (
    <aside
      ref={panel}
      className="notes-panel"
      aria-label="Highlights and notes"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="settings-panel-title">
        <h2>Highlights & notes</h2>
        <button aria-label="Close highlights and notes" onClick={onClose}>
          <X size={16} />
        </button>
      </div>
      <form
        className="page-note-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!draft.trim()) return;
          onAddNote(draft.trim());
          setDraft('');
        }}
      >
        <textarea
          aria-label={`Note on page ${page + 1}`}
          placeholder={`A note on page ${page + 1}...`}
          value={draft}
          maxLength={10000}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button className="mark-done" disabled={!draft.trim()}>
          Add note
        </button>
      </form>
      {sorted.length ? (
        <ol className="note-list">
          {sorted.map((annotation) => (
            <NoteItem
              key={annotation.id}
              annotation={annotation}
              go={go}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </ol>
      ) : (
        <p className="notes-empty">
          Turn on the highlighter (H), select a few words, and pick a colour.
          Your highlights and notes gather here.
        </p>
      )}
      {sorted.length > 0 && (
        <button className="download-action" onClick={onExport}>
          <FileDown size={16} /> Export as Markdown
        </button>
      )}
    </aside>
  );
}
