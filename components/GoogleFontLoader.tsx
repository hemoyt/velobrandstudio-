'use client';

import { useEffect } from 'react';

const loadedFamilies = new Set<string>();

function familyParam(name: string): string {
  return encodeURIComponent(name.trim()).replace(/%20/g, '+');
}

/** Injects a Google Fonts stylesheet link for the given family names, once each, app-wide. */
export function GoogleFontLoader({ families }: { families: (string | undefined | null)[] }) {
  const clean = Array.from(new Set(families.filter((f): f is string => !!f && f.trim().length > 0)));
  const key = clean.slice().sort().join('|');

  useEffect(() => {
    const toLoad = clean.filter((f) => !loadedFamilies.has(f));
    if (toLoad.length === 0) return;
    toLoad.forEach((f) => loadedFamilies.add(f));

    const href = `https://fonts.googleapis.com/css2?${toLoad
      .map((f) => `family=${familyParam(f)}:wght@400;500;600;700`)
      .join('&')}&display=swap`;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
    // Intentionally never removed: other components may still be rendering
    // text in this font, and re-fetching a cached stylesheet is cheap anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return null;
}
