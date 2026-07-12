export interface FontOption {
  name: string;
  category: 'serif' | 'sans-serif' | 'display' | 'monospace' | 'handwriting';
}

// A curated set spanning the pairings a brand identity actually needs —
// not the full Google Fonts catalog, which is too large to browse usefully.
export const GOOGLE_FONTS: FontOption[] = [
  { name: 'Playfair Display', category: 'serif' },
  { name: 'Merriweather', category: 'serif' },
  { name: 'Lora', category: 'serif' },
  { name: 'Cormorant Garamond', category: 'serif' },
  { name: 'Libre Baskerville', category: 'serif' },
  { name: 'PT Serif', category: 'serif' },
  { name: 'Crimson Text', category: 'serif' },
  { name: 'Bitter', category: 'serif' },
  { name: 'Fraunces', category: 'serif' },

  { name: 'Inter', category: 'sans-serif' },
  { name: 'Poppins', category: 'sans-serif' },
  { name: 'Montserrat', category: 'sans-serif' },
  { name: 'Work Sans', category: 'sans-serif' },
  { name: 'Nunito Sans', category: 'sans-serif' },
  { name: 'Source Sans 3', category: 'sans-serif' },
  { name: 'Manrope', category: 'sans-serif' },
  { name: 'DM Sans', category: 'sans-serif' },
  { name: 'Karla', category: 'sans-serif' },
  { name: 'Rubik', category: 'sans-serif' },
  { name: 'Outfit', category: 'sans-serif' },
  { name: 'Space Grotesk', category: 'sans-serif' },

  { name: 'Bebas Neue', category: 'display' },
  { name: 'Abril Fatface', category: 'display' },
  { name: 'Archivo Black', category: 'display' },
  { name: 'Anton', category: 'display' },
  { name: 'Righteous', category: 'display' },
  { name: 'Unbounded', category: 'display' },

  { name: 'JetBrains Mono', category: 'monospace' },
  { name: 'IBM Plex Mono', category: 'monospace' },
  { name: 'Space Mono', category: 'monospace' },
  { name: 'Roboto Mono', category: 'monospace' },

  { name: 'Caveat', category: 'handwriting' },
  { name: 'Dancing Script', category: 'handwriting' },
  { name: 'Pacifico', category: 'handwriting' },
];

export function fontStackFor(name: string | undefined | null): string {
  if (!name) return 'inherit';
  const isSerif = GOOGLE_FONTS.find((f) => f.name === name)?.category === 'serif';
  return `'${name}', ${isSerif ? 'serif' : 'sans-serif'}`;
}
