'use client';

import { useEffect, useState } from 'react';
import { bestTextColor, contrastRatio, wcagLevel } from '@/lib/color-contrast';

function Spinner() {
  return <div className="w-3 h-3 rounded-full border-2 border-stone-300 border-t-indigo-500 animate-spin" />;
}

export function RegenerateButton({ onClick, busy, label = 'Regenerate with AI' }: { onClick: () => void; busy: boolean; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      title={label}
      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-500 hover:text-indigo-700 disabled:opacity-40 uppercase tracking-wide"
    >
      {busy ? <Spinner /> : <span>✨</span>}
      {busy ? 'Working…' : 'Regenerate'}
    </button>
  );
}

/** Click-to-edit text that saves on blur (only if changed). Renders as plain text-like input. */
export function InlineText({
  value,
  onSave,
  className = '',
  placeholder,
  multiline,
}: {
  value: string;
  onSave: (v: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  const commit = () => {
    if (draft.trim() !== value) onSave(draft.trim());
  };

  const shared =
    'w-full bg-transparent border border-transparent hover:border-stone-200 focus:border-stone-300 focus:bg-white rounded-lg px-2 -mx-2 py-1 outline-none transition-colors resize-none';

  if (multiline) {
    return (
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        placeholder={placeholder}
        rows={3}
        className={`${shared} ${className}`}
      />
    );
  }

  return (
    <input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      placeholder={placeholder}
      className={`${shared} ${className}`}
    />
  );
}

/** Chip list editor for string[] fields (values, personality, sample captions). */
export function InlineTagList({
  values,
  onSave,
  placeholder = 'Add and press Enter',
  chipClassName = 'px-3 py-1.5 bg-stone-100 rounded-full text-xs font-medium text-stone-600',
}: {
  values: string[];
  onSave: (v: string[]) => void;
  placeholder?: string;
  chipClassName?: string;
}) {
  const [draft, setDraft] = useState('');

  const add = () => {
    if (!draft.trim()) return;
    onSave([...values, draft.trim()]);
    setDraft('');
  };
  const remove = (i: number) => onSave(values.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {values.map((v, i) => (
          <span key={`${v}-${i}`} className={`inline-flex items-center gap-1.5 ${chipClassName}`}>
            {v}
            <button type="button" onClick={() => remove(i)} className="text-stone-400 hover:text-red-500 font-bold">
              ✕
            </button>
          </span>
        ))}
        {values.length === 0 && <p className="text-sm text-stone-400 italic">Nothing yet.</p>}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="flex-1 px-3 py-1.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-stone-900"
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs font-bold text-stone-600 disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  );
}

const COLOR_ROLES = ['Primary', 'Secondary', 'Accent', 'Accent', 'Accent', 'Accent'];

/** Editable color palette with a native color picker per swatch and a live WCAG contrast badge. */
export function InlineColorPalette({ colors, onSave }: { colors: string[]; onSave: (v: string[]) => void }) {
  const update = (i: number, hex: string) => {
    const next = colors.slice();
    next[i] = hex;
    onSave(next);
  };
  const remove = (i: number) => onSave(colors.filter((_, idx) => idx !== i));
  const add = () => onSave([...colors, '#8B7E74']);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {colors.map((color, i) => {
        const safeColor = /^#[0-9a-f]{6}$/i.test(color) ? color : '#888888';
        const textColor = bestTextColor(safeColor);
        const ratio = contrastRatio(safeColor, textColor);
        return (
          <div key={`${color}-${i}`} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <label className="h-28 flex items-start justify-end p-2 cursor-pointer relative block" style={{ backgroundColor: safeColor }}>
              <input
                type="color"
                value={safeColor}
                onChange={(e) => update(i, e.target.value)}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                aria-label="Pick color"
              />
              <span
                className="text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wide pointer-events-none"
                style={{ color: textColor, backgroundColor: textColor === '#FFFFFF' ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.55)' }}
              >
                {wcagLevel(ratio)} text
              </span>
            </label>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{COLOR_ROLES[i] ?? 'Accent'}</p>
                {colors.length > 2 && (
                  <button type="button" onClick={() => remove(i)} className="text-[10px] text-stone-300 hover:text-red-500 font-bold">
                    Remove
                  </button>
                )}
              </div>
              <p className="text-sm font-bold text-stone-800 mt-1">{color.toUpperCase()}</p>
            </div>
          </div>
        );
      })}
      <button
        type="button"
        onClick={add}
        className="border-2 border-dashed border-stone-200 rounded-2xl min-h-[176px] flex items-center justify-center text-stone-400 hover:border-stone-400 hover:text-stone-600 text-sm font-medium transition-colors"
      >
        + Add color
      </button>
    </div>
  );
}
