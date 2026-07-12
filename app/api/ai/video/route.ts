import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getProject, updateProject, type StoredVideo } from '@/lib/local/store';
import { saveDesignFile, fileUrl } from '@/lib/local/files';
import { getVideoProvider } from '@/lib/providers/resolve';
import { AIProviderError } from '@/lib/providers/types';
import { errorResponse } from '@/lib/api-response';

// Video generation (Veo) can take minutes. Running locally with `next dev`
// or `next start` there is no request timeout to worry about.
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { projectId, prompt, imageBase64, aspectRatio, withSound, resolution } = await req.json();
    if (!projectId || !prompt) {
      return NextResponse.json({ error: 'projectId and prompt are required' }, { status: 400 });
    }

    const project = await getProject(projectId);
    const provider = await getVideoProvider();
    if (!provider.generateVideo) {
      throw new AIProviderError('Video generation is unavailable', 422);
    }

    const dataUrl = await provider.generateVideo({ prompt, imageBase64, aspectRatio, withSound, resolution });
    const file = await saveDesignFile(project, 'video', prompt.slice(0, 40), dataUrl);

    const video: StoredVideo = {
      id: randomUUID(),
      prompt,
      file,
      hasSound: !!withSound,
      createdAt: new Date().toISOString(),
    };
    await updateProject(projectId, (p) => {
      p.videos.push(video);
    });

    return NextResponse.json({ url: fileUrl(file), video });
  } catch (err) {
    return errorResponse(err);
  }
}
