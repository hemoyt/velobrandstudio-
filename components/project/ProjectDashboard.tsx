'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { ImageEditor } from '@/components/ImageEditor';
import { exportBrandKitPDF } from '@/lib/pdf-export';
import { generateImageAction, uploadAssetAction } from '@/lib/ai-client';
import { enableShareLink, disableShareLink } from '@/lib/project-client';
import type { BrandIdentity, GeneratedImage } from '@/types';

interface DashboardAsset extends GeneratedImage {
  storagePath: string;
}

export function ProjectDashboard({
  teamId,
  projectId,
  clientName,
  status,
  shareToken,
  brandIdentity,
  initialAssets,
  selectedLogoAssetId,
  videoCount,
  canEdit,
}: {
  teamId: string;
  projectId: string;
  clientName: string;
  status: string;
  shareToken: string | null;
  brandIdentity: BrandIdentity | null;
  initialAssets: DashboardAsset[];
  selectedLogoAssetId: string | null;
  videoCount: number;
  canEdit: boolean;
}) {
  const [assets, setAssets] = useState(initialAssets);
  const [editingAsset, setEditingAsset] = useState<DashboardAsset | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(
    shareToken ? `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${shareToken}` : null,
  );
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logoUrl = assets.find((a) => a.id === selectedLogoAssetId)?.url;

  const handleExportPDF = () => {
    if (brandIdentity) exportBrandKitPDF(brandIdentity, assets);
  };

  const handleShare = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl).catch(() => {});
      return;
    }
    const { shareUrl: url } = await enableShareLink(projectId);
    setShareUrl(url);
    await navigator.clipboard.writeText(url).catch(() => {});
  };

  const handleRevokeShare = async () => {
    await disableShareLink(projectId);
    setShareUrl(null);
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
        { id: result.asset.id, url: result.url, prompt: result.asset.prompt, type: result.asset.type as GeneratedImage['type'], storagePath: '' },
      ]);
      setCustomPrompt('');
    } catch (err: any) {
      setError(err.message || 'Failed to generate asset');
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
        { id: result.asset.id, url: result.url, prompt: result.asset.prompt, type: result.asset.type as GeneratedImage['type'], storagePath: '' },
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
    <div className="p-8 lg:p-12">
      <header className="flex flex-wrap justify-between items-center gap-4 mb-10">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-serif font-bold text-stone-900">{clientName}</h1>
          <span className="px-3 py-1 bg-stone-100 text-stone-500 rounded-full text-xs font-bold border border-stone-200">
            {status.replace('_', ' ')}
          </span>
        </div>
        <div className="flex gap-3">
          <Link href={`/teams/${teamId}/projects/${projectId}/video`}>
            <Button variant="outline" size="sm">
              Video Studio {videoCount > 0 ? `(${videoCount})` : ''}
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={!brandIdentity}>
            Export PDF
          </Button>
          <Button size="sm" onClick={handleShare}>
            {shareUrl ? 'Copy Share Link' : 'Create Share Link'}
          </Button>
          {shareUrl && (
            <button onClick={handleRevokeShare} className="text-xs text-red-500 hover:text-red-700 font-semibold self-center">
              Revoke
            </button>
          )}
        </div>
      </header>

      {brandIdentity && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm col-span-2">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-6">Brand Strategy</h3>
            <div className="space-y-8">
              <div>
                <p className="text-sm font-bold text-stone-400 uppercase mb-2">Tagline</p>
                <p className="text-2xl font-serif italic text-stone-800 leading-snug">&quot;{brandIdentity.tagline}&quot;</p>
              </div>
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

      {canEdit && (
        <div className="flex items-center gap-3 mb-6">
          <input
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Generate another asset, e.g. 'A branded delivery truck'..."
            className="flex-1 px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-stone-900"
          />
          <Button onClick={handleCustomGenerate} isLoading={isGenerating} size="sm">
            Generate
          </Button>
        </div>
      )}
      {error && <p className="text-sm text-red-600 mb-6">{error}</p>}

      <h3 className="text-xl font-serif font-bold mb-6 text-stone-900">Visual Assets</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {assets.map((asset) => (
          <div key={asset.id} className="group bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
            <div className="aspect-square relative overflow-hidden bg-stone-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset.url} alt={asset.prompt} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/40 transition-opacity opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-3">
                {canEdit && (
                  <Button size="sm" className="bg-white text-stone-900 hover:bg-stone-100 border-none" onClick={() => setEditingAsset(asset)}>
                    Open Editor
                  </Button>
                )}
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
    </div>
  );
}
