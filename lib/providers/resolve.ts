import { getSettings } from '@/lib/local/store';
import { createOpenAIProvider } from './openai';
import { createGeminiProvider } from './gemini';
import type { AIProvider } from './types';
import { AIProviderError } from './types';

// API keys come straight from the local Settings file (~/.velobrand) — the
// user pastes them into the in-app Settings page. Nothing here is
// multi-tenant: this is a single-user local tool.

const NO_KEY_MESSAGE =
  'No AI provider configured yet. Open Settings and add your OpenAI or Gemini API key.';

/** Prefers OpenAI (GPT Image 2) for image generation/editing; falls back to Gemini. */
export async function getImageProvider(): Promise<AIProvider> {
  const settings = await getSettings();
  if (settings.openaiApiKey) return createOpenAIProvider(settings.openaiApiKey);
  if (settings.geminiApiKey) return createGeminiProvider(settings.geminiApiKey);
  throw new AIProviderError(NO_KEY_MESSAGE, 422);
}

/**
 * Brand-identity text and prompt helpers. Prefers Gemini, but falls back to
 * OpenAI so the studio works end-to-end with a single key of either kind.
 */
export async function getTextProvider(): Promise<AIProvider> {
  const settings = await getSettings();
  if (settings.geminiApiKey) return createGeminiProvider(settings.geminiApiKey);
  if (settings.openaiApiKey) return createOpenAIProvider(settings.openaiApiKey);
  throw new AIProviderError(NO_KEY_MESSAGE, 422);
}

/** Video generation runs on Gemini only (Veo) — OpenAI has no video model. */
export async function getVideoProvider(): Promise<AIProvider> {
  const settings = await getSettings();
  if (settings.geminiApiKey) return createGeminiProvider(settings.geminiApiKey);
  throw new AIProviderError(
    'Video generation needs a Gemini API key (it runs on Veo). Add one in Settings.',
    422,
  );
}
