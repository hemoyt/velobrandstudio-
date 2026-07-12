import OpenAI, { toFile } from 'openai';
import type { BrandIdentity } from '@/types';
import type { AIProvider, ImageEditParams, ImageGenParams } from './types';
import { AIProviderError } from './types';
import { brandIdentityInstruction } from './brand-prompt';

const IMAGE_MODEL = 'gpt-image-2';
const TEXT_MODEL = 'gpt-4o-mini';

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mimeType: string } {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    return { buffer: Buffer.from(dataUrl, 'base64'), mimeType: 'image/png' };
  }
  return { buffer: Buffer.from(match[2], 'base64'), mimeType: match[1] };
}

/** Nearest size GPT Image 2 accepts for a given aspect ratio + our '1K'/'2K'/'4K' size labels. */
function resolveDimensions(aspectRatio: string | undefined, size: string | undefined): string {
  const base = size === '2K' ? 1536 : size === '4K' ? 2048 : 1024;
  if (aspectRatio === '16:9' || aspectRatio === '4:3') return `${Math.round((base * 16) / 9)}x${base}`;
  if (aspectRatio === '9:16' || aspectRatio === '3:4') return `${base}x${Math.round((base * 16) / 9)}`;
  return `${base}x${base}`;
}

export function createOpenAIProvider(apiKey: string): AIProvider {
  const client = new OpenAI({ apiKey });

  return {
    name: 'openai',

    async generateImage({ prompt, size, referenceImageUrl, aspectRatio }: ImageGenParams): Promise<string> {
      try {
        if (referenceImageUrl) {
          const { buffer, mimeType } = dataUrlToBuffer(referenceImageUrl);
          const file = await toFile(buffer, `reference.${mimeType.split('/')[1] || 'png'}`, { type: mimeType });
          const response = await client.images.edit({
            model: IMAGE_MODEL,
            image: file,
            prompt,
            size: resolveDimensions(aspectRatio, size) as OpenAI.Images.ImageEditParams['size'],
          });
          const b64 = response.data?.[0]?.b64_json;
          if (!b64) throw new AIProviderError('OpenAI returned no image data');
          return `data:image/png;base64,${b64}`;
        }

        const response = await client.images.generate({
          model: IMAGE_MODEL,
          prompt,
          size: resolveDimensions(aspectRatio, size) as OpenAI.Images.ImageGenerateParams['size'],
        });
        const b64 = response.data?.[0]?.b64_json;
        if (!b64) throw new AIProviderError('OpenAI returned no image data');
        return `data:image/png;base64,${b64}`;
      } catch (err) {
        throw wrapOpenAIError(err);
      }
    },

    async editImage({ image, prompt }: ImageEditParams): Promise<string> {
      try {
        const { buffer, mimeType } = dataUrlToBuffer(image);
        const file = await toFile(buffer, `image.${mimeType.split('/')[1] || 'png'}`, { type: mimeType });
        const response = await client.images.edit({
          model: IMAGE_MODEL,
          image: file,
          prompt,
        });
        const b64 = response.data?.[0]?.b64_json;
        if (!b64) throw new AIProviderError('OpenAI returned no image data');
        return `data:image/png;base64,${b64}`;
      } catch (err) {
        throw wrapOpenAIError(err);
      }
    },

    // Text capabilities exist here as a fallback so the studio works
    // end-to-end with only an OpenAI key (Gemini is preferred for text).

    async generateBrandText(description: string): Promise<BrandIdentity> {
      const text = await complete(client, brandIdentityInstruction(description), true);
      return JSON.parse(text) as BrandIdentity;
    },

    async optimizeLogoPrompt(description: string, style?: string): Promise<string> {
      return complete(
        client,
        `Optimize this business description into a concise logo design prompt${style ? ` in the style: ${style}` : ''}. Return only the prompt string, nothing else.\n\n${description}`,
      );
    },

    async enhanceDescription(description: string): Promise<string> {
      return complete(
        client,
        `Rewrite this business description to be more descriptive and marketing-oriented. Return only the rewritten description.\n\n${description}`,
      );
    },

    async optimizeVideoPrompt(prompt: string): Promise<string> {
      return complete(
        client,
        `Enhance this video generation prompt to be cinematic and detailed (camera movement, lighting, mood). Return only the enhanced prompt.\n\n${prompt}`,
      );
    },

    async describeFromWebsite({ title, text, url }): Promise<string> {
      return complete(
        client,
        `Based on the following website content, write a concise (2-4 sentence) standalone business description covering what the business does, its vibe/positioning, and target audience.\n\nURL: ${url}\nTitle: ${title}\nContent: ${text}`,
      );
    },
  };
}

async function complete(client: OpenAI, prompt: string, json = false): Promise<string> {
  try {
    const response = await client.chat.completions.create({
      model: TEXT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      ...(json ? { response_format: { type: 'json_object' as const } } : {}),
    });
    const text = response.choices[0]?.message?.content;
    if (!text) throw new AIProviderError('OpenAI returned no text');
    return text;
  } catch (err) {
    if (err instanceof AIProviderError) throw err;
    const message = err instanceof Error ? err.message : 'Unknown OpenAI error';
    throw new AIProviderError(`OpenAI text generation failed: ${message}`, 502);
  }
}

function wrapOpenAIError(err: unknown): AIProviderError {
  if (err instanceof AIProviderError) return err;
  const message = err instanceof Error ? err.message : 'Unknown OpenAI error';
  return new AIProviderError(`OpenAI image generation failed: ${message}`, 502);
}
