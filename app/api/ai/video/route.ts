import { NextRequest, NextResponse } from 'next/server';
import { requireProjectRole } from '@/lib/authz';
import { getGeminiProvider } from '@/lib/providers/resolve';
import { AIProviderError } from '@/lib/providers/types';
import { uploadGeneratedAsset } from '@/lib/storage';
import { errorResponse, logActivity } from '@/lib/api-response';

// Video generation (Veo) can take minutes. This works out of the box on a
// self-hosted `next start` server. On Vercel, long-running video generation
// needs a Pro/Enterprise plan with an increased function duration limit —
// see README "Known limitations".
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { projectId, prompt, imageBase64, aspectRatio, withSound, resolution } = await req.json();
    if (!projectId || !prompt) {
      return NextResponse.json({ error: 'projectId and prompt are required' }, { status: 400 });
    }

    const { supabase, user, teamId } = await requireProjectRole(projectId, 'editor');
    const provider = await getGeminiProvider(teamId);
    if (!provider.generateVideo) {
      throw new AIProviderError('Video generation is unavailable', 422);
    }

    const dataUrl = await provider.generateVideo({ prompt, imageBase64, aspectRatio, withSound, resolution });
    const { path, signedUrl } = await uploadGeneratedAsset(supabase, teamId, projectId, dataUrl);

    const { data: video, error } = await supabase
      .from('videos')
      .insert({ project_id: projectId, storage_path: path, prompt, has_sound: !!withSound, created_by: user.id })
      .select()
      .single();
    if (error) throw error;

    await logActivity(supabase, {
      teamId,
      actorId: user.id,
      action: 'video.generated',
      targetType: 'video',
      targetId: video.id,
    });

    return NextResponse.json({ url: signedUrl, video });
  } catch (err) {
    return errorResponse(err);
  }
}
