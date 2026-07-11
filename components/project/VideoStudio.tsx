'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { generateVideoAction, optimizeVideoPromptAction } from '@/lib/ai-client';
import type { GeneratedVideo } from '@/types';

export function VideoStudio({
  teamId,
  projectId,
  logoUrl,
  initialVideos,
}: {
  teamId: string;
  projectId: string;
  logoUrl: string | null;
  initialVideos: GeneratedVideo[];
}) {
  const [videoPrompt, setVideoPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [withSound, setWithSound] = useState(false);
  const [useLogo, setUseLogo] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videos, setVideos] = useState(initialVideos);

  const handleEnhance = async () => {
    if (!videoPrompt) return;
    setIsEnhancing(true);
    try {
      setVideoPrompt(await optimizeVideoPromptAction(projectId, videoPrompt));
    } catch (err) {
      console.error(err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (!videoPrompt) return;
    setIsLoading(true);
    setError(null);
    try {
      const url = await generateVideoAction(projectId, videoPrompt, {
        imageBase64: useLogo ? logoUrl : null,
        aspectRatio,
        withSound,
        resolution,
      });
      setVideos((prev) => [{ id: `v-${Date.now()}`, url, prompt: videoPrompt, hasSound: withSound }, ...prev]);
    } catch (err: any) {
      setError(err.message || 'Failed to generate video');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-stone-950 text-stone-300 overflow-hidden font-sans">
      <div className="w-96 flex flex-col border-r border-stone-800 bg-stone-900/50 backdrop-blur-sm z-20">
        <div className="p-6 border-b border-stone-800">
          <Link href={`/teams/${teamId}/projects/${projectId}`} className="flex items-center gap-2 text-xs font-bold text-stone-500 hover:text-white transition-colors mb-6 uppercase tracking-widest">
            ← Exit Studio
          </Link>
          <h2 className="font-serif text-3xl font-bold text-white">Motion Lab</h2>
          <p className="text-stone-500 text-sm mt-1">Generate cinematic assets with Veo.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {logoUrl && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Input Asset</label>
                <button onClick={() => setUseLogo(!useLogo)} className="text-[10px] text-indigo-400 hover:text-indigo-300">
                  {useLogo ? 'Use text-to-video instead' : 'Use brand logo'}
                </button>
              </div>
              <div className="p-4 bg-stone-900 rounded-xl border border-stone-800 flex items-center gap-4">
                <div className="w-12 h-12 bg-black rounded-lg p-2 border border-stone-800 flex items-center justify-center">
                  {useLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} className="max-w-full max-h-full" alt="Reference" />
                  ) : (
                    <div className="w-2 h-2 bg-stone-700 rounded-full" />
                  )}
                </div>
                <p className="text-xs font-bold text-white">{useLogo ? 'Brand Logo' : 'No Asset'}</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Direction</label>
              <button onClick={handleEnhance} disabled={!videoPrompt || isEnhancing} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 disabled:opacity-50">
                {isEnhancing ? 'Optimizing...' : 'AI Enhance'}
              </button>
            </div>
            <textarea
              className="w-full p-4 bg-black/40 border border-stone-800 rounded-xl text-sm h-32 resize-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none text-stone-200 placeholder-stone-700"
              placeholder="Describe the scene motion, lighting, and camera movement..."
              value={videoPrompt}
              onChange={(e) => setVideoPrompt(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Video Settings</label>
            <div className="grid grid-cols-2 gap-3">
              {(['16:9', '9:16'] as const).map((ar) => (
                <button key={ar} onClick={() => setAspectRatio(ar)} className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${aspectRatio === ar ? 'bg-white text-stone-900 border-white' : 'bg-transparent text-stone-400 border-stone-800 hover:border-stone-600'}`}>
                  {ar}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(['720p', '1080p'] as const).map((res) => (
                <button key={res} onClick={() => setResolution(res)} className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${resolution === res ? 'bg-white text-stone-900 border-white' : 'bg-transparent text-stone-400 border-stone-800 hover:border-stone-600'}`}>
                  {res}
                </button>
              ))}
            </div>
            <button
              onClick={() => setWithSound(!withSound)}
              className={`w-full px-3 py-2 text-xs font-medium rounded-lg border transition-all flex items-center justify-between ${withSound ? 'bg-indigo-900/30 text-indigo-300 border-indigo-800' : 'bg-transparent text-stone-400 border-stone-800 hover:border-stone-600'}`}
            >
              <span>Generate Sound</span>
              <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${withSound ? 'bg-indigo-500' : 'bg-stone-700'}`}>
                <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${withSound ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </button>
          </div>
        </div>

        <div className="p-6 border-t border-stone-800 bg-stone-900">
          {error && <div className="text-red-400 text-xs p-3 bg-red-900/20 border border-red-900/50 rounded-lg mb-4">{error}</div>}
          <Button className="w-full bg-indigo-600 text-white hover:bg-indigo-500 border-none" size="lg" disabled={!videoPrompt || isLoading} onClick={handleGenerate} isLoading={isLoading}>
            Render Sequence
          </Button>
          <p className="text-[10px] text-stone-600 mt-3 text-center">
            Video generation can take a few minutes. On Vercel this needs a plan with an extended function duration —
            self-hosting with <code>next start</code> has no such limit.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-stone-950">
        {videos.length > 0 ? (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-8 flex items-center justify-center relative">
              <div className="w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-stone-800">
                <video src={videos[0].url} controls autoPlay loop className="w-full h-full object-contain" />
              </div>
            </div>
            <div className="h-48 border-t border-stone-800 bg-stone-900/30 p-6 overflow-x-auto flex items-center gap-6">
              {videos.map((vid, idx) => (
                <div
                  key={vid.id}
                  className="relative flex-shrink-0 w-64 aspect-video bg-black rounded-lg border border-stone-800 overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all"
                  onClick={() => setVideos([vid, ...videos.filter((v) => v.id !== vid.id)])}
                >
                  <video src={vid.url} className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity" />
                  <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-black/50 px-2 py-1 rounded">
                    V.{videos.length - idx}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-stone-600 p-12">
            <h3 className="text-2xl font-serif text-stone-400 mb-2">Studio Empty</h3>
            <p className="max-w-md text-center text-stone-600">
              Enter a prompt in the Motion Lab sidebar to begin rendering cinematic assets using Veo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
