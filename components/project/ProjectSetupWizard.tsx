'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { LogoStyle, IndustryType } from '@/types';
import { STYLE_DEFINITIONS, MOCKUP_PRESETS, ESSENTIALS_PRESETS, fileToBase64, runConcurrent } from '@/lib/presets';
import {
  generateImageAction,
  generateBrandTextAction,
  optimizePromptAction,
  enhanceDescriptionAction,
  importWebsiteAction,
  uploadAssetAction,
  type GeneratedAssetResult,
} from '@/lib/ai-client';
import { updateProject } from '@/lib/project-client';
import { SocialPlatform } from '@/types';

type Step = 'brief' | 'logos' | 'package' | 'generating';

const LOGO_ANGLES = [
  'a clear, literal interpretation',
  'a creative, abstract symbolic interpretation. Unique geometry',
  'a Monogram or Typography-integrated symbol. Balanced composition',
  'a self-contained Emblem or Badge layout. Unified structure',
];

export function ProjectSetupWizard({
  projectId,
  industry,
  initialBrief,
}: {
  projectId: string;
  industry: IndustryType;
  initialBrief: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('brief');
  const [businessDesc, setBusinessDesc] = useState(initialBrief);
  const [logoStyle, setLogoStyle] = useState<LogoStyle>(LogoStyle.MINIMALIST);
  const [uploadedLogo, setUploadedLogo] = useState<GeneratedAssetResult | null>(null);
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [logoCandidates, setLogoCandidates] = useState<GeneratedAssetResult[]>([]);
  const [selectedLogo, setSelectedLogo] = useState<GeneratedAssetResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  // Brief source: write it, or import it from an existing website
  const [briefSource, setBriefSource] = useState<'write' | 'website'>('write');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Package step config
  const [selectedMockupIds, setSelectedMockupIds] = useState<string[]>(
    MOCKUP_PRESETS[industry].slice(0, 3).map((m) => m.id),
  );
  const [includeBusinessCards, setIncludeBusinessCards] = useState(true);
  const [includeSocialTemplates, setIncludeSocialTemplates] = useState(true);
  const [selectedEssentialIds, setSelectedEssentialIds] = useState<string[]>(ESSENTIALS_PRESETS.map((e) => e.id));
  const [socialPlatform, setSocialPlatform] = useState<SocialPlatform>(SocialPlatform.INSTAGRAM);
  const [apparelColor, setApparelColor] = useState('#FFFFFF');
  const [showCustomMockupInput, setShowCustomMockupInput] = useState(false);
  const [customMockupPrompt, setCustomMockupPrompt] = useState('');

  const toggleMockup = (id: string) =>
    setSelectedMockupIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleEssential = (id: string) =>
    setSelectedEssentialIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleEnhance = async () => {
    if (!businessDesc) return;
    setIsEnhancing(true);
    try {
      setBusinessDesc(await enhanceDescriptionAction(projectId, businessDesc));
    } catch (err) {
      console.error(err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleImportWebsite = async () => {
    if (!websiteUrl.trim()) return;
    setIsImporting(true);
    setImportError(null);
    try {
      setBusinessDesc(await importWebsiteAction(projectId, websiteUrl.trim()));
      setBriefSource('write');
    } catch (err: any) {
      setImportError(err.message || 'Failed to import that website');
    } finally {
      setIsImporting(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      const result = await uploadAssetAction(projectId, base64, { type: 'logo', label: 'Uploaded logo' });
      setUploadedLogo(result);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    }
  };

  const handleUseUpload = async () => {
    if (!uploadedLogo || !businessDesc) return;
    setIsLoading(true);
    setError(null);
    try {
      await updateProject(projectId, { brief: businessDesc });
      await generateBrandTextAction(projectId, businessDesc);
      setSelectedLogo(uploadedLogo);
      setStep('package');
    } catch (err: any) {
      setError(err.message || 'Failed to generate brand identity');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateLogos = async () => {
    if (!businessDesc) return;
    setIsLoading(true);
    setError(null);
    setLogoCandidates([]);
    setStep('logos');
    try {
      await updateProject(projectId, { brief: businessDesc });
      const optPrompt = await optimizePromptAction(projectId, businessDesc, logoStyle);
      setOptimizedPrompt(optPrompt);
      generateBrandTextAction(projectId, businessDesc).catch((err) => console.error('Brand text generation failed', err));

      const styleKeywords = STYLE_DEFINITIONS[logoStyle];
      const constraints = `isolated on a white background, no photorealism, no text clutter, high quality, professional vector art style, centered composition, ${styleKeywords}.`;

      const tasks = LOGO_ANGLES.map(
        (angle) => () =>
          generateImageAction(projectId, `Logo Design: ${optPrompt}. Focus on ${angle}. ${constraints}`, {
            type: 'logo',
            promptLabel: 'Logo Concept',
            aspectRatio: '1:1',
          }),
      );

      await runConcurrent(tasks, 3, (result) => setLogoCandidates((prev) => [...prev, result]));
    } catch (err: any) {
      setError(err.message || 'Failed to generate logos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLogo = async (logo: GeneratedAssetResult) => {
    setSelectedLogo(logo);
    await updateProject(projectId, { selectedLogoAssetId: logo.asset.id });
    setStep('package');
  };

  const handleGenerateFinalAssets = async () => {
    if (!selectedLogo) return;
    setIsLoading(true);
    setError(null);
    setStep('generating');

    try {
      const referenceUrl = selectedLogo.url;
      const baseMockupPrompt = `A professional product photography shot of a mockup for brand: "${optimizedPrompt || businessDesc}". Brand vibe: professional. The design should be elegant and incorporate the visual style of the logo.`;
      const activeMockups = MOCKUP_PRESETS[industry].filter((m) => selectedMockupIds.includes(m.id));

      const tasks: (() => Promise<GeneratedAssetResult>)[] = [];

      if (showCustomMockupInput && customMockupPrompt) {
        tasks.push(() =>
          generateImageAction(projectId, `${baseMockupPrompt} ${customMockupPrompt}. Professional photography, high detail.`, {
            referenceImageUrl: referenceUrl,
            aspectRatio: '3:4',
            type: 'mockup',
            promptLabel: `Custom (${customMockupPrompt})`,
          }),
        );
      }

      activeMockups.forEach((mockup) => {
        let processedPrompt = mockup.prompt;
        if (industry === IndustryType.FASHION && processedPrompt.includes('[TARGET_AUDIENCE]')) {
          processedPrompt = processedPrompt.replace('[TARGET_AUDIENCE]', 'professional model');
        }
        const apparelIds = ['merch', 'hoodie', 'apron', 'tote', 'cap'];
        if (apparelIds.some((id) => mockup.id.includes(id))) {
          processedPrompt += ` The apparel item should be ${apparelColor} color.`;
        }
        tasks.push(() =>
          generateImageAction(projectId, `${baseMockupPrompt} ${processedPrompt} Style: Clean, minimalist, studio lighting.`, {
            referenceImageUrl: referenceUrl,
            aspectRatio: mockup.ratio,
            type: 'mockup',
            promptLabel: `${mockup.label} (Studio)`,
          }),
        );
      });

      const activeEssentials = ESSENTIALS_PRESETS.filter((e) => selectedEssentialIds.includes(e.id));
      activeEssentials.forEach((essential) => {
        tasks.push(() =>
          generateImageAction(projectId, `${baseMockupPrompt} ${essential.prompt} Style: Clean, minimalist, studio lighting.`, {
            referenceImageUrl: referenceUrl,
            aspectRatio: essential.ratio,
            type: 'mockup',
            promptLabel: essential.label,
          }),
        );
      });

      if (includeBusinessCards) {
        [
          { label: 'Business Card (Flat Lay)', prompt: 'Minimalist business card design arranged on a clean, textured surface. Top down view. Clear logo placement.', ratio: '3:4' },
          { label: 'Business Card (Stack)', prompt: 'Artistic stack of premium business cards showing the side edges and brand color. Depth of field.', ratio: '1:1' },
          { label: 'Business Card (Hand)', prompt: 'A hand holding the business card against a blurred modern office background. Realistic context.', ratio: '3:4' },
        ].forEach((card) => {
          tasks.push(() =>
            generateImageAction(projectId, `${baseMockupPrompt} ${card.prompt}. Professional print design.`, {
              referenceImageUrl: referenceUrl,
              aspectRatio: card.ratio,
              type: 'business_card',
              promptLabel: card.label,
            }),
          );
        });
      }

      if (includeSocialTemplates) {
        [
          { label: 'Instagram Template', prompt: 'A clean, aesthetic Instagram post template background. Square format. Uses brand colors and logo watermark. Minimalist design for quotes or announcements.', ratio: '1:1' },
          { label: 'Twitter Header', prompt: 'A bold, professional Twitter X header banner design. Landscape 16:9. Tech-forward, geometric patterns using brand colors. Space for text.', ratio: '16:9' },
          { label: 'LinkedIn Post', prompt: 'A corporate, trustworthy LinkedIn post slide background. Professional presentation style. Subtle branding.', ratio: '3:4' },
        ].forEach((tmpl) => {
          tasks.push(() =>
            generateImageAction(projectId, `${baseMockupPrompt} ${tmpl.prompt}`, {
              referenceImageUrl: referenceUrl,
              aspectRatio: tmpl.ratio,
              type: 'social_template',
              promptLabel: tmpl.label,
            }),
          );
        });
      }

      let socialPrompt = '';
      let socialRatio = '1:1';
      switch (socialPlatform) {
        case SocialPlatform.INSTAGRAM:
          socialPrompt = `A photorealistic lifestyle photography shot for an Instagram post for the brand ${businessDesc}. Cinematic lighting, high resolution, no text overlay.`;
          socialRatio = '3:4';
          break;
        case SocialPlatform.TWITTER:
          socialPrompt = `A modern, punchy digital artwork or photography for a Twitter (X) post for ${businessDesc}. High impact, minimalist style.`;
          socialRatio = '16:9';
          break;
        case SocialPlatform.FACEBOOK:
          socialPrompt = `A warm, inviting, community-focused photograph for a Facebook post for ${businessDesc}. Authentic, relatable style with natural lighting.`;
          socialRatio = '16:9';
          break;
        case SocialPlatform.LINKEDIN:
          socialPrompt = `A professional, sleek corporate photography shot for a LinkedIn update for ${businessDesc}. Business-oriented, clean aesthetic.`;
          socialRatio = '16:9';
          break;
        case SocialPlatform.STORY:
          socialPrompt = `A vertical, dynamic, eye-catching photography shot for an Instagram Story for ${businessDesc}. Immersive, high energy, vibrant colors.`;
          socialRatio = '9:16';
          break;
      }
      tasks.push(() =>
        generateImageAction(projectId, socialPrompt, { aspectRatio: socialRatio, type: 'social_post', promptLabel: `${socialPlatform} Post (Campaign)` }),
      );
      tasks.push(() =>
        generateImageAction(
          projectId,
          `A digital design of a Social Media Profile Picture version of the logo for ${optimizedPrompt || businessDesc}. Center icon, solid background, high contrast vector style.`,
          { referenceImageUrl: referenceUrl, aspectRatio: '1:1', type: 'logo', promptLabel: 'Social Media Profile Logo' },
        ),
      );
      tasks.push(() =>
        generateImageAction(
          projectId,
          `A digital design of a Website Header version of the logo for ${optimizedPrompt || businessDesc}. Horizontal layout, clean typography, transparent background style.`,
          { referenceImageUrl: referenceUrl, aspectRatio: '16:9', type: 'logo', promptLabel: 'Website Header Logo' },
        ),
      );
      tasks.push(() =>
        generateImageAction(
          projectId,
          `A digital design of an App Icon version of the logo for ${optimizedPrompt || businessDesc}. Isolated symbol, high contrast, square format, app store style.`,
          { referenceImageUrl: referenceUrl, aspectRatio: '1:1', type: 'logo', promptLabel: 'App Icon' },
        ),
      );

      setProgress({ done: 0, total: tasks.length });
      await runConcurrent(tasks, 3, () => setProgress((p) => ({ ...p, done: p.done + 1 })));
      await updateProject(projectId, { status: 'IN_REVIEW' });

      router.push(`/studio/${projectId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to generate the brand kit');
      setStep('package');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'generating') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full border-4 border-stone-200 border-t-stone-900 animate-spin mb-6" />
        <h2 className="text-2xl font-serif font-bold text-stone-900 mb-2">Building your brand kit</h2>
        <p className="text-stone-500">
          {progress.total > 0 ? `${progress.done} / ${progress.total} assets generated` : 'Starting up...'}
        </p>
        {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
      </div>
    );
  }

  if (step === 'logos') {
    return (
      <div className="min-h-screen p-8 lg:p-12">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => setStep('brief')} className="text-stone-400 hover:text-stone-900 text-sm font-medium mb-4">
            ← Back to brief
          </button>
          <h2 className="text-3xl font-serif font-medium mb-2">Brand Direction</h2>
          <p className="text-stone-500 mb-10">
            We&apos;re generating 4 concepts based on your brief. Select the one that resonates most.
          </p>

          {error && <p className="text-sm text-red-600 mb-6">{error}</p>}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[0, 1, 2, 3].map((i) => {
              const candidate = logoCandidates[i];
              return (
                <div
                  key={i}
                  className={`group relative aspect-square bg-white border border-stone-200 rounded-2xl overflow-hidden ${candidate ? 'cursor-pointer hover:shadow-2xl hover:-translate-y-1' : 'opacity-70'} transition-all duration-300`}
                >
                  {candidate ? (
                    <div
                      onClick={() => handleSelectLogo(candidate)}
                      className="w-full h-full p-8 flex items-center justify-center animate-fade-in"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={candidate.url} alt={`Logo option ${i + 1}`} className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full border-2 border-stone-200 border-t-stone-400 animate-spin" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {logoCandidates.length === 4 && (
            <Button variant="outline" onClick={handleGenerateLogos} disabled={isLoading} size="sm" className="mt-8">
              Regenerate concepts
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (step === 'package') {
    return (
      <div className="min-h-screen p-8 lg:p-12">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl border border-stone-100 p-8 md:p-12">
            <h2 className="text-2xl font-serif font-medium mb-2">Configure Asset Package</h2>
            <p className="text-stone-500 text-sm mb-8">Select the deliverables you need for launch.</p>

            <div className="space-y-6">
              <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 space-y-3">
                <h3 className="font-bold text-sm uppercase tracking-wide text-stone-400 mb-1">Essentials</h3>
                <label className="flex items-start gap-3 p-3 bg-white rounded-xl border border-stone-200 cursor-pointer">
                  <input type="checkbox" checked={includeBusinessCards} onChange={(e) => setIncludeBusinessCards(e.target.checked)} className="mt-1 w-4 h-4 accent-stone-900" />
                  <div>
                    <p className="font-bold text-sm text-stone-800">Business Card Set</p>
                    <p className="text-xs text-stone-500 mt-0.5">3 variations: flat lay, stack, hand-held</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 bg-white rounded-xl border border-stone-200 cursor-pointer">
                  <input type="checkbox" checked={includeSocialTemplates} onChange={(e) => setIncludeSocialTemplates(e.target.checked)} className="mt-1 w-4 h-4 accent-stone-900" />
                  <div>
                    <p className="font-bold text-sm text-stone-800">Social Media Templates</p>
                    <p className="text-xs text-stone-500 mt-0.5">Instagram, Twitter header, LinkedIn post</p>
                  </div>
                </label>
              </div>

              <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 space-y-3">
                <h3 className="font-bold text-sm uppercase tracking-wide text-stone-400 mb-1">Brand Essentials</h3>
                {ESSENTIALS_PRESETS.map((essential) => (
                  <label key={essential.id} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-stone-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedEssentialIds.includes(essential.id)}
                      onChange={() => toggleEssential(essential.id)}
                      className="mt-1 w-4 h-4 accent-stone-900"
                    />
                    <div>
                      <p className="font-bold text-sm text-stone-800">{essential.label}</p>
                      <p className="text-xs text-stone-500 mt-0.5">{essential.prompt}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-sm uppercase tracking-wide text-stone-400">Mockups</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-400 uppercase">Apparel color</span>
                    <input type="color" value={apparelColor} onChange={(e) => setApparelColor(e.target.value)} className="w-6 h-6 rounded-full border border-stone-300 cursor-pointer" />
                  </div>
                </div>
                <div className="space-y-3">
                  {MOCKUP_PRESETS[industry].map((m) => (
                    <label key={m.id} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-stone-200 cursor-pointer">
                      <input type="checkbox" checked={selectedMockupIds.includes(m.id)} onChange={() => toggleMockup(m.id)} className="mt-1 w-4 h-4 accent-stone-900" />
                      <div>
                        <p className="font-bold text-sm text-stone-800">{m.label}</p>
                        <p className="text-xs text-stone-500 mt-0.5">{m.prompt}</p>
                      </div>
                    </label>
                  ))}
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer text-stone-600 pt-2">
                    <input type="checkbox" checked={showCustomMockupInput} onChange={(e) => setShowCustomMockupInput(e.target.checked)} className="w-4 h-4 accent-stone-900" />
                    Add custom mockup request
                  </label>
                  {showCustomMockupInput && (
                    <input
                      value={customMockupPrompt}
                      onChange={(e) => setCustomMockupPrompt(e.target.value)}
                      placeholder="E.g., A billboard in Times Square..."
                      className="w-full p-3 border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-stone-900 outline-none"
                    />
                  )}
                </div>
              </div>

              <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
                <h3 className="font-bold text-sm uppercase tracking-wide text-stone-400 mb-4">Social Media Focus</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.values(SocialPlatform).map((p) => (
                    <button
                      key={p}
                      onClick={() => setSocialPlatform(p)}
                      className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${socialPlatform === p ? 'bg-stone-900 text-white border-stone-900' : 'bg-white border-stone-200 text-stone-600'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {error && <div className="text-red-500 text-sm p-3 bg-red-50 rounded-lg border border-red-100">{error}</div>}

              <Button className="w-full" size="lg" onClick={handleGenerateFinalAssets} isLoading={isLoading}>
                Generate Full Brand Kit
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-stone-100 p-8 flex flex-col">
            <h3 className="font-serif text-lg font-medium mb-4">My Logo</h3>
            <div className="bg-stone-50 rounded-xl border border-stone-200 p-6 flex items-center justify-center flex-1 min-h-[200px]">
              {selectedLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedLogo.url} className="max-w-full max-h-64 object-contain" alt="Selected logo" />
              ) : (
                <div className="text-stone-400 text-sm">No logo selected</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // step === 'brief'
  return (
    <div className="min-h-screen p-4 flex items-center justify-center">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white rounded-3xl shadow-xl border border-stone-100 p-8 md:p-12">
          <h2 className="text-4xl font-serif font-medium mb-3 text-stone-900">Create Project Brief</h2>
          <p className="text-stone-500 font-light text-lg mb-8">Tell us about the brand you want to build.</p>

          <div className="space-y-10">
            <div>
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 block">Visual style</label>
              <div className="flex overflow-x-auto gap-3 pb-2">
                {Object.values(LogoStyle).map((s) => (
                  <button
                    key={s}
                    onClick={() => setLogoStyle(s)}
                    className={`px-4 py-3 rounded-xl border whitespace-nowrap text-sm font-medium transition-all ${logoStyle === s ? 'bg-stone-900 text-white border-stone-900' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-4">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Business description</label>
                <div className="flex rounded-full border border-stone-200 p-1 bg-stone-50">
                  <button
                    onClick={() => setBriefSource('write')}
                    className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${briefSource === 'write' ? 'bg-stone-900 text-white' : 'text-stone-500'}`}
                  >
                    Write it
                  </button>
                  <button
                    onClick={() => setBriefSource('website')}
                    className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${briefSource === 'website' ? 'bg-stone-900 text-white' : 'text-stone-500'}`}
                  >
                    Import from website
                  </button>
                </div>
              </div>

              {briefSource === 'website' ? (
                <div className="p-6 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
                  <p className="text-sm text-stone-500">Paste your website URL and we&apos;ll read it to draft the brief.</p>
                  <div className="flex gap-3">
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://your-business.com"
                      className="flex-1 px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                    <Button onClick={handleImportWebsite} isLoading={isImporting} disabled={!websiteUrl.trim()}>
                      Analyze
                    </Button>
                  </div>
                  {importError && <p className="text-sm text-red-600">{importError}</p>}
                  {businessDesc && (
                    <p className="text-sm text-stone-700 bg-white p-4 rounded-xl border border-stone-200 leading-relaxed">{businessDesc}</p>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={handleEnhance}
                      disabled={!businessDesc || isEnhancing}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-full border border-indigo-100"
                    >
                      {isEnhancing ? 'Refining...' : 'AI Enhance'}
                    </button>
                  </div>
                  <textarea
                    className="w-full p-6 bg-stone-50 border border-stone-200 rounded-2xl h-48 focus:ring-2 focus:ring-stone-900 focus:outline-none resize-none text-stone-800 placeholder-stone-400 text-lg leading-relaxed font-light"
                    placeholder="e.g. A sustainable coffee roastery in Portland called 'Moss & Mist' that focuses on fair trade beans and a cozy, rainy-day atmosphere..."
                    value={businessDesc}
                    onChange={(e) => setBusinessDesc(e.target.value)}
                  />
                </>
              )}
            </div>

            {error && <div className="text-red-500 text-sm p-4 bg-red-50 rounded-xl border border-red-100">{error}</div>}

            <div className="flex justify-end pt-4">
              <Button className="w-full md:w-auto px-12" size="lg" disabled={!businessDesc || isLoading} onClick={handleGenerateLogos} isLoading={isLoading}>
                Generate Concepts →
              </Button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl shadow-xl border border-stone-100 p-8 flex flex-col h-full">
            <h3 className="font-serif text-xl font-medium mb-4">Existing Assets</h3>
            <p className="text-sm text-stone-500 mb-6">Skip logo generation? Upload your own mark.</p>

            {!uploadedLogo ? (
              <div className="border-2 border-dashed border-stone-200 rounded-xl p-8 text-center hover:bg-stone-50 transition-colors cursor-pointer relative flex flex-col items-center justify-center flex-1 min-h-[150px]">
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleUpload} />
                <p className="text-sm font-bold text-stone-600">Upload Logo</p>
                <p className="text-[10px] text-stone-400 mt-1 uppercase tracking-wide">PNG or JPG</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="relative rounded-xl border border-stone-200 p-4 bg-stone-50 flex items-center justify-center mb-4 flex-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={uploadedLogo.url} className="max-w-full max-h-48 object-contain" alt="Uploaded logo" />
                  <button onClick={() => setUploadedLogo(null)} className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm text-stone-400 hover:text-red-500">
                    ✕
                  </button>
                </div>
                <Button variant="secondary" onClick={handleUseUpload} disabled={!businessDesc || isLoading} isLoading={isLoading}>
                  Use This Logo →
                </Button>
                {!businessDesc && <p className="text-xs text-red-400 mt-2 text-center">Enter a business description first.</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
