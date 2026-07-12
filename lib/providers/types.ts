import type { BrandIdentity } from '@/types';

export type AiProvider = 'openai' | 'gemini';

export class AIProviderError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export interface ImageGenParams {
  prompt: string;
  size?: string;
  referenceImageUrl?: string | null;
  aspectRatio?: string;
}

export interface ImageEditParams {
  image: string; // data URL
  prompt: string;
}

export interface VideoGenParams {
  prompt: string;
  imageBase64?: string | null;
  aspectRatio?: '16:9' | '9:16';
  withSound?: boolean;
  resolution?: '720p' | '1080p';
}

/**
 * A provider only implements the capabilities it actually supports (e.g. OpenAI
 * has no video model). Route handlers call resolve.ts to get the right provider
 * for a given capability + team, and it throws AIProviderError if none is
 * configured or the resolved provider doesn't support that capability.
 */
export interface AIProvider {
  name: AiProvider;
  generateImage?(params: ImageGenParams): Promise<string>;
  editImage?(params: ImageEditParams): Promise<string>;
  generateBrandText?(description: string): Promise<BrandIdentity>;
  optimizeLogoPrompt?(description: string, style?: string): Promise<string>;
  enhanceDescription?(description: string): Promise<string>;
  optimizeVideoPrompt?(prompt: string): Promise<string>;
  generateVideo?(params: VideoGenParams): Promise<string>;
  describeFromWebsite?(params: { title: string; text: string; url: string }): Promise<string>;
}
