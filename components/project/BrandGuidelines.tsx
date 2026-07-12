'use client';

import Link from 'next/link';
import { StudioNav } from '@/components/StudioNav';
import { Button } from '@/components/Button';
import { exportBrandKitPDF } from '@/lib/pdf-export';
import type { BrandIdentity, GeneratedImage } from '@/types';

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(clean)) return '';
  const n = parseInt(clean, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

const COLOR_ROLES = ['Primary', 'Secondary', 'Accent', 'Accent', 'Accent'];

function Section({ index, title, children }: { index: string; title: string; children: React.ReactNode }) {
  return (
    <section className="py-12 border-t border-stone-200">
      <div className="flex items-baseline gap-4 mb-8">
        <span className="font-serif text-stone-300 text-lg">{index}</span>
        <h2 className="text-2xl font-serif font-bold text-stone-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function BrandGuidelines({
  projectId,
  name,
  identity,
  assets,
  selectedLogoAssetId,
}: {
  projectId: string;
  name: string;
  identity: BrandIdentity;
  assets: GeneratedImage[];
  selectedLogoAssetId: string | null;
}) {
  const primaryLogo = assets.find((a) => a.id === selectedLogoAssetId) ?? assets.find((a) => a.type === 'logo');
  const logoVariants = assets.filter((a) => a.type === 'logo' && a.id !== primaryLogo?.id);
  const applications = assets.filter((a) => a.type !== 'logo');
  const palette = identity.colorPalette ?? [];

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <StudioNav />
      <main className="max-w-4xl mx-auto px-6 pb-24">
        <div className="flex items-center justify-between py-8">
          <Link href={`/studio/${projectId}`} className="text-sm font-medium text-stone-400 hover:text-stone-900">
            ← Back to project
          </Link>
          <Button size="sm" variant="outline" onClick={() => exportBrandKitPDF(identity, assets)}>
            Export as PDF
          </Button>
        </div>

        {/* Cover */}
        <div className="py-16">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-stone-400 mb-6">Brand Guidelines</p>
          <h1 className="text-6xl md:text-7xl font-serif font-medium text-stone-900 leading-tight mb-8">{name}</h1>
          {identity.tagline && (
            <p className="text-2xl font-serif italic text-stone-500">&quot;{identity.tagline}&quot;</p>
          )}
        </div>

        {/* 01 — Foundation */}
        <Section index="01" title="Foundation">
          <div className="space-y-8">
            {identity.mission && (
              <div className="bg-stone-900 text-white rounded-3xl p-10">
                <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">Mission</p>
                <p className="text-2xl font-serif leading-snug">{identity.mission}</p>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-stone-200 p-8">
                <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Positioning</p>
                <p className="text-stone-700 leading-relaxed">{identity.description}</p>
              </div>
              <div className="bg-white rounded-2xl border border-stone-200 p-8">
                <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Target audience</p>
                <p className="text-stone-700 leading-relaxed">{identity.targetAudience}</p>
              </div>
            </div>
            {(identity.values?.length || identity.personality?.length) && (
              <div className="grid md:grid-cols-2 gap-6">
                {identity.values && identity.values.length > 0 && (
                  <div className="bg-white rounded-2xl border border-stone-200 p-8">
                    <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">Core values</p>
                    <div className="flex flex-wrap gap-2">
                      {identity.values.map((v) => (
                        <span key={v} className="px-4 py-2 bg-stone-100 rounded-full text-sm font-medium text-stone-700">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {identity.personality && identity.personality.length > 0 && (
                  <div className="bg-white rounded-2xl border border-stone-200 p-8">
                    <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">Personality</p>
                    <div className="flex flex-wrap gap-2">
                      {identity.personality.map((p) => (
                        <span key={p} className="px-4 py-2 border border-stone-200 rounded-full text-sm font-medium text-stone-600 italic font-serif">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Section>

        {/* 02 — Logo */}
        <Section index="02" title="Logo">
          {primaryLogo ? (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-stone-200 p-12 flex items-center justify-center min-h-[280px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={primaryLogo.url} alt="Primary logo" className="max-h-52 max-w-full object-contain" />
                </div>
                <div className="bg-white rounded-2xl border border-stone-200 p-8 space-y-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">Clear space</p>
                    <p className="text-sm text-stone-600 leading-relaxed">
                      Keep clear space around the logo at least equal to the height of its mark on every side. No text,
                      imagery, or page edges should intrude.
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">Minimum size</p>
                    <p className="text-sm text-stone-600 leading-relaxed">
                      Never render the logo below 24px tall on screen or 12mm in print — fine detail breaks down past
                      that point.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-2xl border-l-4 border border-stone-200 border-l-green-600 bg-white p-8">
                  <p className="text-xs font-bold uppercase tracking-widest text-green-700 mb-4">Do</p>
                  <ul className="space-y-2.5 text-sm text-stone-600">
                    <li>Use the approved files at full resolution</li>
                    <li>Maintain the required clear space</li>
                    <li>Place on backgrounds with strong contrast</li>
                  </ul>
                </div>
                <div className="rounded-2xl border-l-4 border border-stone-200 border-l-red-500 bg-white p-8">
                  <p className="text-xs font-bold uppercase tracking-widest text-red-600 mb-4">Don&apos;t</p>
                  <ul className="space-y-2.5 text-sm text-stone-600">
                    <li>Stretch, distort, or rotate the logo</li>
                    <li>Recolor it outside the brand palette</li>
                    <li>Add shadows, outlines, or effects</li>
                    <li>Place it on busy or low-contrast imagery</li>
                  </ul>
                </div>
              </div>

              {logoVariants.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">Variants</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {logoVariants.map((v) => (
                      <div key={v.id} className="bg-white rounded-xl border border-stone-200 p-6 flex items-center justify-center aspect-square">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={v.url} alt={v.prompt} className="max-w-full max-h-full object-contain" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-stone-500">No logo selected yet — pick one in the setup wizard.</p>
          )}
        </Section>

        {/* 03 — Color */}
        <Section index="03" title="Color">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {palette.map((color, i) => (
              <div key={`${color}-${i}`} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                <div className="h-32" style={{ backgroundColor: color }} />
                <div className="p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                    {COLOR_ROLES[i] ?? 'Accent'}
                  </p>
                  <p className="text-sm font-bold text-stone-800 mt-1">{color.toUpperCase()}</p>
                  {hexToRgb(color) && <p className="text-xs text-stone-400 mt-0.5">RGB {hexToRgb(color)}</p>}
                </div>
              </div>
            ))}
          </div>
          {palette.length > 1 && (
            <div className="bg-white rounded-2xl border border-stone-200 p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">Usage weight</p>
              <div className="flex h-8 rounded-lg overflow-hidden">
                {palette.map((c, i) => (
                  <div key={`${c}-${i}`} style={{ flex: i === 0 ? 4 : i === 1 ? 2 : 1, backgroundColor: c }} />
                ))}
              </div>
              <p className="text-xs text-stone-400 mt-3">
                Lead with the primary color; use secondary and accent tones for emphasis and calls to action.
              </p>
            </div>
          )}
        </Section>

        {/* 04 — Typography */}
        <Section index="04" title="Typography">
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-stone-200 p-10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4">
                Headings — {identity.typography?.heading}
              </p>
              <p className="font-serif text-5xl text-stone-900 leading-tight">The quick brown fox jumps over</p>
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4">
                Body — {identity.typography?.body}
              </p>
              <p className="text-lg text-stone-600 leading-relaxed max-w-xl">
                The quick brown fox jumps over the lazy dog. Use for paragraphs, interfaces, and captions — set with
                generous line height and never below 14px.
              </p>
            </div>
          </div>
        </Section>

        {/* 05 — Voice */}
        <Section index="05" title="Voice & Tone">
          <div className="bg-white rounded-2xl border border-stone-200 p-10">
            <p className="text-xl font-serif text-stone-800 leading-relaxed">{identity.brandVoice}</p>
          </div>
        </Section>

        {/* 06 — Applications */}
        {applications.length > 0 && (
          <Section index="06" title="Applications">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {applications.map((a) => (
                <div key={a.id} className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                  <div className="aspect-square bg-stone-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.url} alt={a.prompt} className="w-full h-full object-cover" />
                  </div>
                  <p className="p-3 text-xs font-medium text-stone-600 truncate">{a.prompt}</p>
                </div>
              ))}
            </div>
          </Section>
        )}
      </main>
    </div>
  );
}
