import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getProject, updateProject, type StoredAsset } from '@/lib/local/store';
import { saveDesignFile, fileUrl } from '@/lib/local/files';
import { getImageProvider } from '@/lib/providers/resolve';
import { AIProviderError } from '@/lib/providers/types';
import { errorResponse } from '@/lib/api-response';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, prompt, size, referenceImageUrl, aspectRatio, type = 'mockup', promptLabel } = body;

    if (!projectId || !prompt) {
      return NextResponse.json({ error: 'projectId and prompt are required' }, { status: 400 });
    }

    const project = await getProject(projectId);
    const provider = await getImageProvider();
    if (!provider.generateImage) {
      throw new AIProviderError('The configured provider does not support image generation', 422);
    }

    const dataUrl = await provider.generateImage({ prompt, size, referenceImageUrl, aspectRatio });
    const label = promptLabel ?? prompt;
    const file = await saveDesignFile(project, type, label, dataUrl);

    const asset: StoredAsset = {
      id: randomUUID(),
      type,
      prompt: label,
      originalPrompt: prompt,
      file,
      createdAt: new Date().toISOString(),
    };
    await updateProject(projectId, (p) => {
      p.assets.push(asset);
    });

    return NextResponse.json({
      url: fileUrl(file),
      asset: { id: asset.id, type: asset.type, prompt: asset.prompt, original_prompt: asset.originalPrompt },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
