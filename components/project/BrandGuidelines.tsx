'use client';

import { useState } from 'react';
import Link from 'next/link';
import { StudioNav } from '@/components/StudioNav';
import { Button } from '@/components/Button';
import { FontPicker } from '@/components/FontPicker';
import { GoogleFontLoader } from '@/components/GoogleFontLoader';
import { InlineText, InlineTagList, InlineColorPalette, RegenerateButton } from '@/components/project/IdentityFieldControls';
import { exportBrandKitPDF } from '@/lib/pdf-export';
import { generateImageAction, regenerateFieldAction } from '@/lib/ai-client';
import { updateIdentity } from '@/lib/project-client';
import { fontStackFor } from '@/lib/fonts';
import type { BrandIdentity, GeneratedImage } from '@/types';
import type { RegenerableField } from '@/lib/providers/brand-prompt';

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(clean)) return '';
  const n = parseInt(clean, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

const LOGO_ITERATIONS: { id: string; label: string; suffix: string }[] = [
  { id: 'bolder', label: 'Bolder', suffix: 'bolder, thicker strokes, higher contrast, more confident weight' },
  { id: 'rounder', label: 'Rounder', suffix: 'softer, with rounded corners and curves instead of sharp angles' },
  { id: 'minimal', label: 'More minimal', suffix: 'simplified further, fewer details, more negative space, reductionist' },
  { id: 'color', label: 'Different color', suffix: 'reimagined using a different color combination from the same brand palette' },
  { id: 'detail', label: 'More detail', suffix: 'more intricate detail and texture while keeping the same core concept' },
];

function Section({ index, title, children, action }: { index: string; title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="py-12 border-t border-stone-200">
      <div className="flex items-baseline justify-between gap-4 mb-8">
        <div className="flex items-baseline gap-4">
          <span className="font-serif text-stone-300 text-lg">{index}</span>
          <h2 className="text-2xl font-serif font-bold text-stone-900">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function BrandGuidelines({
  projectId,
  name,
  identity: initialIdentity,
  assets: initialAssets,
  selectedLogoAssetId,
}: {
  projectId: string;
  name: string;
  identity: BrandIdentity;
  assets: GeneratedImage[];
  selectedLogoAssetId: string | null;
}) {
  const [identity, setIdentity] = useState<BrandIdentity>(initialIdentity);
  const [assets, setAssets] = useState<GeneratedImage[]>(initialAssets);
  const [regenerating, setRegenerating] = useState<RegenerableField | null>(null);
  const [iterating, setIterating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const primaryLogo = assets.find((a) => a.id === selectedLogoAssetId) ?? assets.find((a) => a.type === 'logo');
  const logoVariants = assets.filter((a) => a.type === 'logo' && a.id !== primaryLogo?.id);
  const applications = assets.filter((a) => a.type !== 'logo');
  const palette = identity.colorPalette ?? [];

  const saveField = async (patch: Partial<BrandIdentity>) => {
    setIdentity((prev) => ({ ...prev, ...patch }));
    try {
      await updateIdentity(projectId, patch);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const regenerate = async (field: RegenerableField) => {
    setRegenerating(field);
    setError(null);
    try {
      const result = await regenerateFieldAction(projectId, field);
      setIdentity(result.brandIdentity);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to regenerate ${field}`);
    } finally {
      setRegenerating(null);
    }
  };

  const iterateLogo = async (iterationId: string, suffix: string) => {
    if (!primaryLogo) return;
    setIterating(iterationId);
    setError(null);
    try {
      const result = await generateImageAction(
        projectId,
        `${identity.businessName || name} logo, ${suffix}. Keep the same core concept. Isolated on a white background, no photorealism, professional vector art style, centered composition.`,
        { referenceImageUrl: primaryLogo.url, aspectRatio: '1:1', type: 'logo', promptLabel: `Logo Variant (${iterationId})` },
      );
      setAssets((prev) => [...prev, { id: result.asset.id, url: result.url, prompt: result.asset.prompt, type: result.asset.type as GeneratedImage['type'] }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate variant');
    } finally {
      setIterating(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <GoogleFontLoader families={[identity.typography?.heading, identity.typography?.body]} />
      <StudioNav />
      <main className="max-w-4xl mx-auto px-6 pb-24">
        <div className="flex items-center justify-between py-8">
          <Link href={`/studio/${projectId}`} className="text-sm font-medium text-stone-400 hover:text-stone-900">
            ← Back to project
          </Link>
          <div className="flex gap-3">
            <a href={`/api/projects/${projectId}/export-zip`} download>
              <Button size="sm" variant="outline">
                Download Full Kit
              </Button>
            </a>
            <Button size="sm" variant="outline" onClick={() => exportBrandKitPDF(identity, assets)}>
              Export as PDF
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-center justify-between">
            {error}
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Cover */}
        <div className="py-16">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-stone-400 mb-6">Brand Guidelines</p>
          <h1 className="text-6xl md:text-7xl font-serif font-medium text-stone-900 leading-tight mb-8" style={{ fontFamily: fontStackFor(identity.typography?.heading) }}>
            {name}
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-serif italic text-stone-500">&quot;</span>
            <InlineText
              value={identity.tagline || ''}
              onSave={(v) => saveField({ tagline: v })}
              className="flex-1 text-2xl font-serif italic text-stone-500"
            />
            <span className="text-2xl font-serif italic text-stone-500">&quot;</span>
            <RegenerateButton busy={regenerating === 'tagline'} onClick={() => regenerate('tagline')} />
          </div>
        </div>

        {/* 01 — Foundation */}
        <Section index="01" title="Foundation">
          <div className="space-y-8">
            <div className="bg-stone-900 text-white rounded-3xl p-10">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Mission</p>
                <RegenerateButton busy={regenerating === 'mission'} onClick={() => regenerate('mission')} />
              </div>
              <InlineText
                value={identity.mission || ''}
                onSave={(v) => saveField({ mission: v })}
                multiline
                className="text-2xl font-serif leading-snug text-white"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-stone-200 p-8">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Positioning</p>
                  <RegenerateButton busy={regenerating === 'description'} onClick={() => regenerate('description')} />
                </div>
                <InlineText value={identity.description || ''} onSave={(v) => saveField({ description: v })} multiline className="text-stone-700 leading-relaxed" />
              </div>
              <div className="bg-white rounded-2xl border border-stone-200 p-8">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Target audience</p>
                  <RegenerateButton busy={regenerating === 'targetAudience'} onClick={() => regenerate('targetAudience')} />
                </div>
                <InlineText value={identity.targetAudience || ''} onSave={(v) => saveField({ targetAudience: v })} multiline className="text-stone-700 leading-relaxed" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-stone-200 p-8">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Core values</p>
                  <RegenerateButton busy={regenerating === 'values'} onClick={() => regenerate('values')} />
                </div>
                <InlineTagList
                  values={identity.values ?? []}
                  onSave={(v) => saveField({ values: v })}
                  chipClassName="px-4 py-2 bg-stone-100 rounded-full text-sm font-medium text-stone-700"
                  placeholder="Add a value…"
                />
              </div>
              <div className="bg-white rounded-2xl border border-stone-200 p-8">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Personality</p>
                  <RegenerateButton busy={regenerating === 'personality'} onClick={() => regenerate('personality')} />
                </div>
                <InlineTagList
                  values={identity.personality ?? []}
                  onSave={(v) => saveField({ personality: v })}
                  chipClassName="px-4 py-2 border border-stone-200 rounded-full text-sm font-medium text-stone-600 italic font-serif"
                  placeholder="Add a trait…"
                />
              </div>
            </div>
          </div>
        </Section>

        {/* 02 — Logo */}
        <Section index="02" title="Logo">
          {primaryLogo ? (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-stone-200 p-12 flex flex-col items-center justify-center min-h-[280px] gap-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={primaryLogo.url} alt="Primary logo" className="max-h-52 max-w-full object-contain" />
                  <div className="flex flex-wrap justify-center gap-2">
                    {LOGO_ITERATIONS.map((it) => (
                      <button
                        key={it.id}
                        onClick={() => iterateLogo(it.id, it.suffix)}
                        disabled={iterating !== null}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-full text-[11px] font-bold text-stone-600 disabled:opacity-40"
                      >
                        {iterating === it.id ? 'Generating…' : it.label}
                      </button>
                    ))}
                  </div>
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
        <Section index="03" title="Color" action={<RegenerateButton busy={regenerating === 'colorPalette'} onClick={() => regenerate('colorPalette')} />}>
          <InlineColorPalette colors={palette} onSave={(v) => saveField({ colorPalette: v })} />
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {palette.map((color, i) => (
              <p key={`${color}-${i}`} className="text-xs text-stone-400 text-center">
                {hexToRgb(color) ? `RGB ${hexToRgb(color)}` : ''}
              </p>
            ))}
          </div>
          {palette.length > 1 && (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 mt-6">
              <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">Usage weight</p>
              <div className="flex h-8 rounded-lg overflow-hidden">
                {palette.map((c, i) => (
                  <div key={`${c}-${i}`} style={{ flex: i === 0 ? 4 : i === 1 ? 2 : 1, backgroundColor: c }} />
                ))}
              </div>
              <p className="text-xs text-stone-400 mt-3">
                Lead with the primary color; use secondary and accent tones for emphasis and calls to action. The badge on
                each swatch shows the WCAG contrast level of the best-fitting text color on that background.
              </p>
            </div>
          )}
        </Section>

        {/* 04 — Typography */}
        <Section index="04" title="Typography" action={<RegenerateButton busy={regenerating === 'typography'} onClick={() => regenerate('typography')} />}>
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-stone-200 p-10">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Headings</p>
                <div className="w-56">
                  <FontPicker value={identity.typography?.heading || ''} onSelect={(f) => saveField({ typography: { ...identity.typography, heading: f } })} />
                </div>
              </div>
              <p className="text-5xl text-stone-900 leading-tight" style={{ fontFamily: fontStackFor(identity.typography?.heading) }}>
                The quick brown fox jumps over
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-10">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Body</p>
                <div className="w-56">
                  <FontPicker value={identity.typography?.body || ''} onSelect={(f) => saveField({ typography: { ...identity.typography, body: f } })} />
                </div>
              </div>
              <p className="text-lg text-stone-600 leading-relaxed max-w-xl" style={{ fontFamily: fontStackFor(identity.typography?.body) }}>
                The quick brown fox jumps over the lazy dog. Use for paragraphs, interfaces, and captions — set with
                generous line height and never below 14px.
              </p>
            </div>
          </div>
        </Section>

        {/* 05 — Voice */}
        <Section index="05" title="Voice & Tone" action={<RegenerateButton busy={regenerating === 'brandVoice'} onClick={() => regenerate('brandVoice')} />}>
          <div className="bg-white rounded-2xl border border-stone-200 p-10">
            <InlineText value={identity.brandVoice || ''} onSave={(v) => saveField({ brandVoice: v })} multiline className="text-xl font-serif text-stone-800 leading-relaxed" />
          </div>
        </Section>

        {/* 06 — Voice in practice */}
        <Section index="06" title="Voice in Practice">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-8">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Elevator pitch</p>
                <RegenerateButton busy={regenerating === 'elevatorPitch'} onClick={() => regenerate('elevatorPitch')} />
              </div>
              <InlineText value={identity.elevatorPitch || ''} onSave={(v) => saveField({ elevatorPitch: v })} multiline className="text-stone-700 leading-relaxed" />
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-8">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Social bios</p>
                <RegenerateButton busy={regenerating === 'socialBios'} onClick={() => regenerate('socialBios')} />
              </div>
              <div className="space-y-4">
                {(['instagram', 'twitter', 'linkedin'] as const).map((platform) => (
                  <div key={platform}>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400 mb-1">{platform}</p>
                    <InlineText
                      value={identity.socialBios?.[platform] || ''}
                      onSave={(v) => saveField({ socialBios: { ...identity.socialBios, [platform]: v } })}
                      multiline
                      className="text-sm text-stone-700 leading-relaxed bg-stone-50 rounded-lg p-3"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-8">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Sample captions</p>
                <RegenerateButton busy={regenerating === 'sampleCaptions'} onClick={() => regenerate('sampleCaptions')} />
              </div>
              <InlineTagList
                values={identity.sampleCaptions ?? []}
                onSave={(v) => saveField({ sampleCaptions: v })}
                chipClassName="px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-700 max-w-full"
                placeholder="Add a sample caption…"
              />
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-8">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Imagery direction</p>
                <RegenerateButton busy={regenerating === 'imageryStyle'} onClick={() => regenerate('imageryStyle')} />
              </div>
              <InlineText value={identity.imageryStyle || ''} onSave={(v) => saveField({ imageryStyle: v })} multiline className="text-stone-700 leading-relaxed" />
            </div>
          </div>
        </Section>

        {/* 07 — Applications */}
        {applications.length > 0 && (
          <Section index="07" title="Applications">
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
