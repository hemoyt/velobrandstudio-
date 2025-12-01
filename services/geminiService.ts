import { GoogleGenAI, Type } from "@google/genai";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryOperation<T>(operation: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T> {
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

export const generateImage = async (
  prompt: string, 
  model: string = 'gemini-2.5-flash-image', 
  size: string = '1K',
  referenceImageUrl?: string | null,
  aspectRatio: string = '1:1'
): Promise<string> => {
    const ai = getAIClient();
    
    const parts: any[] = [{ text: prompt }];
    
    // If we have a reference image
    if (referenceImageUrl) {
        let base64Data = referenceImageUrl.split(',')[1];
        if (!base64Data && !referenceImageUrl.includes(',')) base64Data = referenceImageUrl;
        
        let mimeType = 'image/png';
        const match = referenceImageUrl.match(/^data:(.+);base64,/);
        if (match) mimeType = match[1];

        parts.unshift({
            inlineData: {
                data: base64Data,
                mimeType: mimeType
            }
        });
    }

    const config: any = {
        imageConfig: {
            aspectRatio: aspectRatio,
        }
    };

    if (model === 'gemini-3-pro-image-preview') {
        config.imageConfig.imageSize = size;
    }

    const response = await ai.models.generateContent({
        model: model,
        contents: { parts },
        config: config
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    throw new Error("No image generated");
};

export const editImage = async (baseImage: string, prompt: string): Promise<string> => {
    const ai = getAIClient();
    let base64Data = baseImage.split(',')[1];
    let mimeType = 'image/png';
    const match = baseImage.match(/^data:(.+);base64,/);
    if (match) mimeType = match[1];

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: mimeType
                    }
                },
                { text: prompt }
            ]
        }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    throw new Error("No image generated from edit");
};

export const generateBrandText = async (description: string): Promise<any> => {
    const ai = getAIClient();
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
                        properties: {
                            heading: { type: Type.STRING },
                            body: { type: Type.STRING }
                        }
                    },
                    brandVoice: { type: Type.STRING },
                    tagline: { type: Type.STRING },
                    targetAudience: { type: Type.STRING }
                }
            }
        }
    });
    
    return JSON.parse(response.text || '{}');
};

export const optimizePrompt = async (description: string, style?: string): Promise<string> => {
    const ai = getAIClient();
    const prompt = `Optimize this business description for a logo design prompt${style ? ` with style ${style}` : ''}: ${description}. Return only the prompt string.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return response.text || description;
};

export const enhanceDescription = async (description: string): Promise<string> => {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Enhance this business description to be more descriptive and marketing-oriented: ${description}`
    });
    return response.text || description;
};

export const optimizeVideoPrompt = async (prompt: string): Promise<string> => {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Enhance this video generation prompt to be cinematic and detailed: ${prompt}`
    });
    return response.text || prompt;
};

export const generateVideo = async (
  prompt: string,
  imageBase64: string | null,
  aspectRatio: '16:9' | '9:16' = '16:9',
  withSound: boolean = false,
  resolution: '720p' | '1080p' = '720p'
): Promise<string> => {
  return retryOperation(async () => {
    const ai = getAIClient();
    
    let mimeType = 'image/png';
    let base64Data = null;

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
      config: {
        numberOfVideos: 1,
        resolution: resolution,
        aspectRatio: aspectRatio
      }
    };

    if (base64Data) {
      requestPayload.image = {
        imageBytes: base64Data,
        mimeType: mimeType, 
      };
    }

    let operation = await ai.models.generateVideos(requestPayload);

    while (!operation.done) {
      await delay(10000); 
      operation = await ai.operations.getVideosOperation({operation: operation});
      
      if (operation.error) {
         throw new Error(`Video Generation Error: ${operation.error.message || 'Unknown error during processing'}`);
      }
    }

    if (operation.error) {
        throw new Error(`Video Generation Error: ${operation.error.message}`);
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) {
      throw new Error("Video generation failed or returned no URI");
    }

    const downloadUrl = new URL(videoUri);
    downloadUrl.searchParams.append('key', process.env.API_KEY || '');

    const response = await fetch(downloadUrl.toString());
    if (!response.ok) {
       throw new Error(`Failed to download generated video: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }, 2, 5000);
};

export const exportBrandKitPDF = (brandIdentity: any, assets: any[]) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export PDF');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Brand Kit - ${brandIdentity.businessName || 'Brand'}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
          h1 { font-size: 36px; margin-bottom: 10px; border-bottom: 3px solid #000; padding-bottom: 20px; }
          .desc { font-size: 18px; color: #666; margin-bottom: 40px; }
          h2 { font-size: 24px; margin-top: 40px; margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
          h3 { font-size: 18px; margin-top: 20px; margin-bottom: 10px; color: #555; text-transform: uppercase; letter-spacing: 1px; }
          .section { margin-bottom: 40px; }
          .color-palette { display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 10px; }
          .color-swatch { width: 80px; height: 80px; border-radius: 8px; border: 1px solid #eee; display: flex; align-items: flex-end; justify-content: center; font-size: 10px; padding-bottom: 5px; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.3); }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; }
          .asset-card { border: 1px solid #eee; border-radius: 12px; overflow: hidden; break-inside: avoid; page-break-inside: avoid; }
          .asset-card img { width: 100%; height: auto; display: block; }
          .asset-info { padding: 15px; background: #f9f9f9; }
          .asset-type { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #999; font-weight: bold; }
          .asset-prompt { font-size: 14px; font-weight: 500; margin-top: 5px; }
          .typography-sample { padding: 20px; background: #f9f9f9; border-radius: 8px; margin-bottom: 10px; }
          .font-heading { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
          .font-body { font-size: 16px; }
          @media print {
            body { padding: 0; }
            .asset-card { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>${brandIdentity.businessName || 'Brand Identity'}</h1>
        <p class="desc">${brandIdentity.description || ''}</p>
        
        <div class="section">
          <h2>Strategy Core</h2>
          <p><strong>Tagline:</strong> ${brandIdentity.tagline}</p>
          <p><strong>Brand Voice:</strong> ${brandIdentity.brandVoice}</p>
          <p><strong>Target Audience:</strong> ${brandIdentity.targetAudience}</p>
        </div>

        <div class="section">
          <h2>Visual System</h2>
          
          <h3>Color Palette</h3>
          <div class="color-palette">
            ${brandIdentity.colorPalette?.map((c: string) => 
              `<div class="color-swatch" style="background-color: ${c}">${c}</div>`
            ).join('') || ''}
          </div>

          <h3>Typography</h3>
          <div class="typography-sample">
            <div class="font-heading" style="font-family: sans-serif">${brandIdentity.typography?.heading || 'Heading Font'}</div>
            <div class="font-body" style="font-family: serif">${brandIdentity.typography?.body || 'Body Font'}</div>
          </div>
          <p><strong>Heading:</strong> ${brandIdentity.typography?.heading}</p>
          <p><strong>Body:</strong> ${brandIdentity.typography?.body}</p>
        </div>

        <div class="section">
          <h2>Generated Assets</h2>
          <div class="grid">
            ${assets.map((asset: any) => `
              <div class="asset-card">
                <img src="${asset.url}" />
                <div class="asset-info">
                  <div class="asset-type">${asset.type}</div>
                  <div class="asset-prompt">${asset.prompt}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <script>
            setTimeout(() => {
                window.print();
            }, 1000);
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
