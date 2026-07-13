import OpenAI from 'openai';
import type { BrandIdentity } from '@/types';
import type { AIProvider, ImageEditParams, ImageGenParams } from './types';
import { AIProviderError } from './types';
import { brandIdentityInstruction, regenerateFieldInstruction, type RegenerableField } from './brand-prompt';

// OpenRouter is a single OpenAI-compatible endpoint in front of hundreds of
// models from many vendors (Anthropic, Google, Meta, DeepSeek, xAI, ...), so
// the OpenAI SDK works against it unchanged — just a different baseURL and
// a model string the user can swap freely. That swap-ability is the whole
// point of adding OpenRouter: it's the "flexibility" provider, not a
// dedicated image/video model like the other two.
//
// It has NO video generation API. Image generation only works on the small
// set of multimodal chat models OpenRouter has enabled image output for
// (e.g. Google's Gemini image-preview model) — it returns the image inline
// in the chat response rather than through a dedicated images endpoint.

const BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_TEXT_MODEL = 'openai/gpt-4o-mini';
const DEFAULT_IMAGE_MODEL = 'google/gemini-2.5-flash-image-preview';

function client(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey,
    baseURL: BASE_URL,
    defaultHeaders: {
      'HTTP-Referer': 'https://github.com/hemoyt/velobrandstudio-',
      'X-Title': 'VeloBrand Studio',
    },
  });
}

function firstImageUrl(message: unknown): string | null {
  const images = (message as { images?: { image_url?: { url?: string } }[] } | undefined)?.images;
  return images?.[0]?.image_url?.url ?? null;
}

export function createOpenRouterProvider(
  apiKey: string,
  opts: { textModel?: string; imageModel?: string } = {},
): AIProvider {
  const ai = client(apiKey);
  const textModel = opts.textModel || DEFAULT_TEXT_MODEL;
  const imageModel = opts.imageModel || DEFAULT_IMAGE_MODEL;

  return {
    name: 'openrouter',

    async generateImage({ prompt, referenceImageUrl }: ImageGenParams): Promise<string> {
      try {
        const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [{ type: 'text', text: prompt }];
        if (referenceImageUrl) content.push({ type: 'image_url', image_url: { url: referenceImageUrl } });

        const response = await ai.chat.completions.create({
          model: imageModel,
          messages: [{ role: 'user', content }],
          // Not in the SDK's types yet — OpenRouter-specific field.
          ...({ modalities: ['image', 'text'] } as object),
        });

        const url = firstImageUrl(response.choices?.[0]?.message);
        if (!url) {
          throw new AIProviderError(
            `OpenRouter returned no image — "${imageModel}" may not support image output. Try google/gemini-2.5-flash-image-preview.`,
            502,
          );
        }
        return url;
      } catch (err) {
        throw wrapOpenRouterError(err);
      }
    },

    async editImage({ image, prompt }: ImageEditParams): Promise<string> {
      try {
        const response = await ai.chat.completions.create({
          model: imageModel,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'image_url', image_url: { url: image } },
                { type: 'text', text: prompt },
              ],
            },
          ],
          ...({ modalities: ['image', 'text'] } as object),
        });

        const url = firstImageUrl(response.choices?.[0]?.message);
        if (!url) throw new AIProviderError('OpenRouter returned no image data from edit', 502);
        return url;
      } catch (err) {
        throw wrapOpenRouterError(err);
      }
    },

    async generateBrandText(description: string): Promise<BrandIdentity> {
      const text = await complete(ai, textModel, brandIdentityInstruction(description), true);
      return JSON.parse(text) as BrandIdentity;
    },

    async regenerateIdentityField(field: RegenerableField, description: string, identity: BrandIdentity): Promise<unknown> {
      const text = await complete(ai, textModel, regenerateFieldInstruction(field, description, identity), true);
      return JSON.parse(text).value;
    },

    async optimizeLogoPrompt(description: string, style?: string): Promise<string> {
      return complete(
        ai,
        textModel,
        `Optimize this business description into a concise logo design prompt${style ? ` in the style: ${style}` : ''}. Return only the prompt string, nothing else.\n\n${description}`,
      );
    },

    async enhanceDescription(description: string): Promise<string> {
      return complete(
        ai,
        textModel,
        `Rewrite this business description to be more descriptive and marketing-oriented. Return only the rewritten description.\n\n${description}`,
      );
    },

    async optimizeVideoPrompt(prompt: string): Promise<string> {
      return complete(
        ai,
        textModel,
        `Enhance this video generation prompt to be cinematic and detailed (camera movement, lighting, mood). Return only the enhanced prompt.\n\n${prompt}`,
      );
    },

    async describeFromWebsite({ title, text, url }): Promise<string> {
      return complete(
        ai,
        textModel,
        `Based on the following website content, write a concise (2-4 sentence) standalone business description covering what the business does, its vibe/positioning, and target audience.\n\nURL: ${url}\nTitle: ${title}\nContent: ${text}`,
      );
    },
  };
}

async function complete(ai: OpenAI, model: string, prompt: string, json = false): Promise<string> {
  try {
    const response = await ai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      ...(json ? { response_format: { type: 'json_object' as const } } : {}),
    });
    const text = response.choices[0]?.message?.content;
    if (!text) throw new AIProviderError('OpenRouter returned no text');
    return text;
  } catch (err) {
    if (err instanceof AIProviderError) throw err;
    const message = err instanceof Error ? err.message : 'Unknown OpenRouter error';
    throw new AIProviderError(`OpenRouter text generation failed (model: ${model}): ${message}`, 502);
  }
}

/** Lightweight live check that an OpenRouter key actually works. Throws on failure. */
export async function verifyOpenRouterKey(apiKey: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/key`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new AIProviderError(body?.error?.message || `OpenRouter rejected the key (${res.status})`, 401);
  }
}

function wrapOpenRouterError(err: unknown): AIProviderError {
  if (err instanceof AIProviderError) return err;
  const message = err instanceof Error ? err.message : 'Unknown OpenRouter error';
  return new AIProviderError(`OpenRouter image generation failed: ${message}`, 502);
}
