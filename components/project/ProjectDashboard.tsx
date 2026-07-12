'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StudioNav } from '@/components/StudioNav';
import { Button } from '@/components/Button';
import { ImageEditor } from '@/components/ImageEditor';
import { exportBrandKitPDF } from '@/lib/pdf-export';
import { generateImageAction, uploadAssetAction } from '@/lib/ai-client';
import { duplicateProject } from '@/lib/project-client';
import type { BrandIdentity, GeneratedImage } from '@/types';

export function ProjectDashboard({
  projectId,
  name,
  status,
  brandIdentity,
  initialAssets,
  selectedLogoAssetId,
  videoCount,
  folderPath,
}: {
  projectId: string;
  name: string;
  status: string;
  brandIdentity: BrandIdentity | null;
  initialAssets: GeneratedImage[];
  selectedLogoAssetId: string | null;
  videoCount: number;
  folderPath: string;
}) {
  const router = useRouter();
  const [assets, setAssets] = useState(initialAssets);
  const [editingAsset, setEditingAsset] = useState<GeneratedImage | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logoUrl = assets.find((a) => a.id === selectedLogoAssetId)?.url;

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      const { project } = await duplicateProject(projectId);
      router.push(`/studio/${project.id}/setup`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate project');
      setIsDuplicating(false);
    }
  };

  const handleExportPDF = () => {
    if (brandIdentity) exportBrandKitPDF(brandIdentity, assets);
  };

  const handleCustomGenerate = async () => {
    if (!customPrompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateImageAction(projectId, customPrompt, {
        referenceImageUrl: logoUrl,
        aspectRatio: '1:1',
        type: 'mockup',
        promptLabel: customPrompt,
      });
      setAssets((prev) => [
        ...prev,
        { id: result.asset.id, url: result.url, prompt: result.asset.prompt, type: result.asset.type as GeneratedImage['type'] },
      ]);
      setCustomPrompt('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate asset');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveEdit = async (newImageDataUrl: string) => {
    if (!editingAsset) return;
    try {
      const result = await uploadAssetAction(projectId, newImageDataUrl, {
        type: editingAsset.type,
        label: `${editingAsset.prompt} (edited)`,
      });
      setAssets((prev) => [
        ...prev,
        { id: result.asset.id, url: result.url, prompt: result.asset.prompt, type: result.asset.type as GeneratedImage['type'] },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setEditingAsset(null);
    }
  };

  if (editingAsset) {
    return (
      <ImageEditor
        projectId={projectId}
        initialImage={editingAsset.url}
        assetType={editingAsset.type}
        overlayImage={logoUrl}
        onClose={() => setEditingAsset(null)}
        onSave={handleSaveEdit}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <StudioNav />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <header className="flex flex-wrap justify-between items-center gap-4 mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-serif font-bold text-stone-900">{name}</h1>
            <span className="px-3 py-1 bg-stone-100 text-stone-500 rounded-full text-xs font-bold border border-stone-200">
              {status.replace('_', ' ')}
            </span>
          </div>
          <div className="flex gap-3">
            <Link href={`/studio/${projectId}/guidelines`}>
              <Button size="sm">Brand Guidelines</Button>
            </Link>
            <Link href={`/studio/${projectId}/video`}>
              <Button variant="outline" size="sm">
                Video Studio {videoCount > 0 ? `(${videoCount})` : ''}
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={!brandIdentity}>
              Export PDF
            </Button>
            <a href={`/api/projects/${projectId}/export-zip`} download>
              <Button variant="outline" size="sm">
                Download Full Kit
              </Button>
            </a>
            <Button variant="outline" size="sm" onClick={handleDuplicate} isLoading={isDuplicating} title="Use this brief and identity as a starting point for a new brand">
              Duplicate
            </Button>
          </div>
        </header>

        <p className="text-xs text-stone-400 mb-10">
          All files saved to <code className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-500">{folderPath}</code>
        </p>

        {brandIdentity && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm col-span-2">
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-6">Brand Strategy</h3>
              <div className="space-y-8">
                <div>
                  <p className="text-sm font-bold text-stone-400 uppercase mb-2">Tagline</p>
                  <p className="text-2xl font-serif italic text-stone-800 leading-snug">&quot;{brandIdentity.tagline}&quot;</p>
                </div>
                {brandIdentity.mission && (
                  <div>
                    <p className="text-sm font-bold text-stone-400 uppercase mb-2">Mission</p>
                    <p className="text-sm text-stone-700 font-medium leading-relaxed">{brandIdentity.mission}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-sm font-bold text-stone-400 uppercase mb-2">Brand Voice</p>
                    <p className="text-sm text-stone-700 font-medium leading-relaxed">{brandIdentity.brandVoice}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-stone-400 uppercase mb-2">Target Audience</p>
                    <p className="text-sm text-stone-700 font-medium leading-relaxed">{brandIdentity.targetAudience}</p>
                  </div>
                </div>
                {brandIdentity.values && brandIdentity.values.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {brandIdentity.values.map((v) => (
                      <span key={v} className="px-3 py-1.5 bg-stone-100 rounded-full text-xs font-medium text-stone-600">
                        {v}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm">
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-6">Visual Identity</h3>
              <p className="text-sm font-bold text-stone-400 uppercase mb-3">Palette</p>
              <div className="flex flex-wrap gap-3 mb-6">
                {brandIdentity.colorPalette.map((color, i) => (
                  <div key={i} className="w-10 h-10 rounded-full border border-stone-100 shadow-sm" style={{ backgroundColor: color }} title={color} />
                ))}
              </div>
              <p className="text-sm font-bold text-stone-400 uppercase mb-3">Typography</p>
              <div className="space-y-2">
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                  <p className="text-xs text-stone-400 mb-1">Headings</p>
                  <p className="text-sm font-bold text-stone-800">{brandIdentity.typography.heading}</p>
                </div>
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                  <p className="text-xs text-stone-400 mb-1">Body</p>
                  <p className="text-sm font-medium text-stone-800">{brandIdentity.typography.body}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mb-6">
          <input
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCustomGenerate()}
            placeholder="Generate another asset, e.g. 'A branded delivery truck'..."
            className="flex-1 px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-stone-900"
          />
          <Button onClick={handleCustomGenerate} isLoading={isGenerating} size="sm">
            Generate
          </Button>
        </div>
        {error && <p className="text-sm text-red-600 mb-6">{error}</p>}

        <h3 className="text-xl font-serif font-bold mb-6 text-stone-900">Visual Assets</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {assets.map((asset) => (
            <div key={asset.id} className="group bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="aspect-square relative overflow-hidden bg-stone-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset.url} alt={asset.prompt} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/40 transition-opacity opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-3">
                  <Button size="sm" className="bg-white text-stone-900 hover:bg-stone-100 border-none" onClick={() => setEditingAsset(asset)}>
                    Open Editor
                  </Button>
                  <a href={asset.url} download={`asset-${asset.id}.png`} className="text-white text-xs font-medium hover:underline">
                    Download PNG
                  </a>
                </div>
              </div>
              <div className="p-4">
                <p className="font-bold text-sm truncate text-stone-800">{asset.prompt}</p>
                <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mt-1 block">{asset.type.replace('_', ' ')}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
