'use client';

import { useEffect, useRef, useState } from 'react';
import { GOOGLE_FONTS, fontStackFor } from '@/lib/fonts';
import { GoogleFontLoader } from './GoogleFontLoader';

export function FontPicker({ value, onSelect }: { value: string; onSelect: (font: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <GoogleFontLoader families={[value]} />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm hover:border-stone-400 transition-colors"
      >
        <span style={{ fontFamily: fontStackFor(value) }}>{value || 'Choose a font'}</span>
        <span className="text-stone-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-2 w-72 max-h-80 overflow-y-auto bg-white border border-stone-200 rounded-xl shadow-xl p-2">
          <GoogleFontLoader families={GOOGLE_FONTS.map((f) => f.name)} />
          {GOOGLE_FONTS.map((f) => (
            <button
              key={f.name}
              type="button"
              onClick={() => {
                onSelect(f.name);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg hover:bg-stone-50 text-base ${f.name === value ? 'bg-stone-100' : ''}`}
              style={{ fontFamily: fontStackFor(f.name) }}
            >
              {f.name}
              <span className="ml-2 text-[10px] text-stone-400 uppercase tracking-wide font-sans">{f.category}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
