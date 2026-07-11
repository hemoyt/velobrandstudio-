'use client';

// Thin client-side wrappers around the server-only /api/ai/* routes. No
// provider SDK and no API key ever touches the browser — every call here
// goes through a route handler that decrypts the team's stored key
// server-side (see lib/providers/).

import type { BrandIdentity } from '@/types';

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.error || `Request to ${url} failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export interface GeneratedAssetResult {
  url: string;
  asset: { id: string; type: string; prompt: string; original_prompt: string | null };
}

export const generateImageAction = (
  projectId: string,
  prompt: string,
  opts: {
    size?: string;
    referenceImageUrl?: string | null;
    aspectRatio?: string;
    type?: string;
    promptLabel?: string;
  } = {},
): Promise<GeneratedAssetResult> => postJSON<GeneratedAssetResult>('/api/ai/image', { projectId, prompt, ...opts });

export const editImageAction = (projectId: string, image: string, prompt: string): Promise<string> =>
  postJSON<{ url: string }>('/api/ai/edit', { projectId, image, prompt }).then((r) => r.url);

export const uploadAssetAction = (
  projectId: string,
  dataUrl: string,
  opts: { type?: string; label?: string } = {},
): Promise<GeneratedAssetResult> => postJSON<GeneratedAssetResult>('/api/assets/upload', { projectId, dataUrl, ...opts });

export const generateBrandTextAction = (projectId: string, description: string): Promise<BrandIdentity> =>
  postJSON<BrandIdentity>('/api/ai/text', { projectId, description });

export const optimizePromptAction = (projectId: string, description: string, style?: string): Promise<string> =>
  postJSON<{ text: string }>('/api/ai/prompt', { projectId, kind: 'optimize-logo-prompt', text: description, style }).then(
    (r) => r.text,
  );

export const importWebsiteAction = (projectId: string, url: string): Promise<string> =>
  postJSON<{ description: string }>('/api/ai/import-website', { projectId, url }).then((r) => r.description);

export const enhanceDescriptionAction = (projectId: string, description: string): Promise<string> =>
  postJSON<{ text: string }>('/api/ai/prompt', { projectId, kind: 'enhance-description', text: description }).then(
    (r) => r.text,
  );

export const optimizeVideoPromptAction = (projectId: string, prompt: string): Promise<string> =>
  postJSON<{ text: string }>('/api/ai/prompt', { projectId, kind: 'optimize-video-prompt', text: prompt }).then(
    (r) => r.text,
  );

export const generateVideoAction = (
  projectId: string,
  prompt: string,
  opts: {
    imageBase64?: string | null;
    aspectRatio?: '16:9' | '9:16';
    withSound?: boolean;
    resolution?: '720p' | '1080p';
  } = {},
): Promise<string> => postJSON<{ url: string }>('/api/ai/video', { projectId, prompt, ...opts }).then((r) => r.url);
