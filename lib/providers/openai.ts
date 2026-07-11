import OpenAI, { toFile } from 'openai';
import type { AIProvider, ImageEditParams, ImageGenParams } from './types';
import { AIProviderError } from './types';

const IMAGE_MODEL = 'gpt-image-2';

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
  };
}

function wrapOpenAIError(err: unknown): AIProviderError {
  if (err instanceof AIProviderError) return err;
  const message = err instanceof Error ? err.message : 'Unknown OpenAI error';
  return new AIProviderError(`OpenAI image generation failed: ${message}`, 502);
}
