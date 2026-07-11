import { GoogleGenAI, Type } from '@google/genai';
import type { BrandIdentity } from '@/types';
import type { AIProvider, ImageEditParams, ImageGenParams, VideoGenParams } from './types';
import { AIProviderError } from './types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function retryOperation<T>(operation: () => Promise<T>, retries = 2, delayMs = 5000): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      await delay(delayMs);
      return retryOperation(operation, retries - 1, delayMs * 2);
    }
    throw error;
  }
}

export function createGeminiProvider(apiKey: string): AIProvider {
  const ai = new GoogleGenAI({ apiKey });

  return {
    name: 'gemini',

    async generateImage({ prompt, referenceImageUrl, aspectRatio = '1:1' }: ImageGenParams): Promise<string> {
      const parts: any[] = [{ text: prompt }];

      if (referenceImageUrl) {
        let base64Data = referenceImageUrl.split(',')[1];
        if (!base64Data && !referenceImageUrl.includes(',')) base64Data = referenceImageUrl;

        let mimeType = 'image/png';
        const match = referenceImageUrl.match(/^data:(.+);base64,/);
        if (match) mimeType = match[1];

        parts.unshift({ inlineData: { data: base64Data, mimeType } });
      }

      const config: any = { imageConfig: { aspectRatio } };
      const model = 'gemini-2.5-flash-image';

      const response = await ai.models.generateContent({ model, contents: { parts }, config });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
      throw new AIProviderError('Gemini returned no image data', 502);
    },

    async editImage({ image, prompt }: ImageEditParams): Promise<string> {
      const base64Data = image.split(',')[1];
      let mimeType = 'image/png';
      const match = image.match(/^data:(.+);base64,/);
      if (match) mimeType = match[1];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ inlineData: { data: base64Data, mimeType } }, { text: prompt }] },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
      throw new AIProviderError('Gemini returned no image data from edit', 502);
    },

    async generateBrandText(description: string): Promise<BrandIdentity> {
      const prompt = `Generate a brand identity for: ${description}. Return JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              businessName: { type: Type.STRING },
              description: { type: Type.STRING },
              colorPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
              typography: {
                type: Type.OBJECT,
                properties: { heading: { type: Type.STRING }, body: { type: Type.STRING } },
              },
              brandVoice: { type: Type.STRING },
              tagline: { type: Type.STRING },
              targetAudience: { type: Type.STRING },
            },
          },
        },
      });

      return JSON.parse(response.text || '{}');
    },

    async optimizeLogoPrompt(description: string, style?: string): Promise<string> {
      const prompt = `Optimize this business description for a logo design prompt${style ? ` with style ${style}` : ''}: ${description}. Return only the prompt string.`;
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
      return response.text || description;
    },

    async enhanceDescription(description: string): Promise<string> {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Enhance this business description to be more descriptive and marketing-oriented: ${description}`,
      });
      return response.text || description;
    },

    async describeFromWebsite({ title, text, url }: { title: string; text: string; url: string }): Promise<string> {
      const prompt = `You are helping fill in a business description for a brand identity generator. Based on the following website content, write a concise (2-4 sentence) business description covering what the business does, its vibe/positioning, and target audience. Write it as a standalone description, not as commentary about the website.\n\nURL: ${url}\nTitle: ${title}\nContent: ${text}`;
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
      return response.text || '';
    },

    async optimizeVideoPrompt(prompt: string): Promise<string> {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Enhance this video generation prompt to be cinematic and detailed: ${prompt}`,
      });
      return response.text || prompt;
    },

    async generateVideo({
      prompt,
      imageBase64,
      aspectRatio = '16:9',
      withSound = false,
      resolution = '720p',
    }: VideoGenParams): Promise<string> {
      return retryOperation(async () => {
        let mimeType = 'image/png';
        let base64Data: string | null = null;

        if (imageBase64) {
          const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            mimeType = matches[1];
            base64Data = matches[2];
          } else if (imageBase64.includes('base64,')) {
            base64Data = imageBase64.split('base64,')[1];
            if (imageBase64.startsWith('data:image/jpeg')) mimeType = 'image/jpeg';
          }
        }

        const finalPrompt = withSound
          ? `${prompt} Include realistic, high-fidelity sound effects and audio atmosphere.`
          : prompt;

        const requestPayload: any = {
          model: 'veo-3.1-fast-generate-preview',
          prompt: finalPrompt,
          config: { numberOfVideos: 1, resolution, aspectRatio },
        };

        if (base64Data) {
          requestPayload.image = { imageBytes: base64Data, mimeType };
        }

        let operation = await ai.models.generateVideos(requestPayload);

        while (!operation.done) {
          await delay(10000);
          operation = await ai.operations.getVideosOperation({ operation });
          if (operation.error) {
            throw new AIProviderError(`Video generation error: ${operation.error.message || 'Unknown error'}`, 502);
          }
        }

        if (operation.error) {
          throw new AIProviderError(`Video generation error: ${operation.error.message}`, 502);
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!videoUri) throw new AIProviderError('Video generation returned no URI', 502);

        const downloadUrl = new URL(videoUri);
        downloadUrl.searchParams.append('key', apiKey);

        const response = await fetch(downloadUrl.toString());
        if (!response.ok) throw new AIProviderError(`Failed to download generated video: ${response.statusText}`, 502);

        const buffer = Buffer.from(await response.arrayBuffer());
        return `data:video/mp4;base64,${buffer.toString('base64')}`;
      }, 2, 5000);
    },
  };
}
