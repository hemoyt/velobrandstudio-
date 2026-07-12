// WCAG 2.x contrast math — pure functions, no dependencies.
// Reference: https://www.w3.org/TR/WCAG21/#contrast-minimum

function hexToRgbChannels(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '').trim();
  if (!/^[0-9a-f]{6}$/i.test(clean)) return null;
  const n = parseInt(clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** Contrast ratio between two hex colors, from 1 (no contrast) to 21 (max). Returns null for invalid hex. */
export function contrastRatio(hexA: string, hexB: string): number | null {
  const a = hexToRgbChannels(hexA);
  const b = hexToRgbChannels(hexB);
  if (!a || !b) return null;
  const lumA = relativeLuminance(a);
  const lumB = relativeLuminance(b);
  const [lighter, darker] = lumA > lumB ? [lumA, lumB] : [lumB, lumA];
  return (lighter + 0.05) / (darker + 0.05);
}

/** Whether black or white text reads better on this background. */
export function bestTextColor(bgHex: string): '#000000' | '#FFFFFF' {
  const blackRatio = contrastRatio(bgHex, '#000000') ?? 0;
  const whiteRatio = contrastRatio(bgHex, '#FFFFFF') ?? 0;
  return whiteRatio >= blackRatio ? '#FFFFFF' : '#000000';
}

export type WcagLevel = 'AAA' | 'AA' | 'AA Large' | 'Fail';

/** WCAG pass level for normal text (4.5:1 AA / 7:1 AAA) and large text (3:1 AA). */
export function wcagLevel(ratio: number | null): WcagLevel {
  if (ratio === null) return 'Fail';
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA Large';
  return 'Fail';
}
