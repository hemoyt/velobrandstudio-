import { getSettings } from '@/lib/local/store';
import { createOpenAIProvider } from './openai';
import { createGeminiProvider } from './gemini';
import { createOpenRouterProvider } from './openrouter';
import type { AIProvider } from './types';
import { AIProviderError } from './types';

// API keys come straight from the local Settings file (~/.velobrand) — the
// user pastes them into the in-app Settings page. Nothing here is
// multi-tenant: this is a single-user local tool.

const NO_KEY_MESSAGE =
  'No AI provider configured yet. Open Settings and add an OpenAI, Gemini, or OpenRouter API key.';

async function openRouterFallback(): Promise<AIProvider | null> {
  const settings = await getSettings();
  if (!settings.openrouterApiKey) return null;
  return createOpenRouterProvider(settings.openrouterApiKey, {
    textModel: settings.openrouterTextModel || undefined,
    imageModel: settings.openrouterImageModel || undefined,
  });
}

/**
 * Prefers OpenAI (GPT Image 2) for image generation/editing, then Gemini,
 * then OpenRouter last — OpenRouter only supports image output on a narrow
 * set of models (picked in Settings), so it's the flexibility fallback, not
 * the default.
 */
export async function getImageProvider(): Promise<AIProvider> {
  const settings = await getSettings();
  if (settings.openaiApiKey) return createOpenAIProvider(settings.openaiApiKey);
  if (settings.geminiApiKey) return createGeminiProvider(settings.geminiApiKey);
  const openrouter = await openRouterFallback();
  if (openrouter) return openrouter;
  throw new AIProviderError(NO_KEY_MESSAGE, 422);
}

/**
 * Brand-identity text and prompt helpers. Prefers Gemini, falls back to
 * OpenAI, then OpenRouter — which also gives access to any other model
 * (Claude, Llama, DeepSeek, ...) by typing its slug into Settings.
 */
export async function getTextProvider(): Promise<AIProvider> {
  const settings = await getSettings();
  if (settings.geminiApiKey) return createGeminiProvider(settings.geminiApiKey);
  if (settings.openaiApiKey) return createOpenAIProvider(settings.openaiApiKey);
  const openrouter = await openRouterFallback();
  if (openrouter) return openrouter;
  throw new AIProviderError(NO_KEY_MESSAGE, 422);
}

/** Video generation runs on Gemini only (Veo) — neither OpenAI nor OpenRouter offer a video model. */
export async function getVideoProvider(): Promise<AIProvider> {
  const settings = await getSettings();
  if (settings.geminiApiKey) return createGeminiProvider(settings.geminiApiKey);
  throw new AIProviderError(
    'Video generation needs a Gemini API key (it runs on Veo) — OpenAI and OpenRouter have no video model. Add a Gemini key in Settings.',
    422,
  );
}
