import { NextRequest, NextResponse } from 'next/server';
import { requireProjectRole } from '@/lib/authz';
import { getImageProvider } from '@/lib/providers/resolve';
import { AIProviderError } from '@/lib/providers/types';
import { uploadGeneratedAsset } from '@/lib/storage';
import { errorResponse, logActivity } from '@/lib/api-response';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, prompt, size, referenceImageUrl, aspectRatio, type = 'mockup', promptLabel } = body;

    if (!projectId || !prompt) {
      return NextResponse.json({ error: 'projectId and prompt are required' }, { status: 400 });
    }

    const { supabase, user, teamId } = await requireProjectRole(projectId, 'editor');
    const provider = await getImageProvider(teamId);
    if (!provider.generateImage) {
      throw new AIProviderError('The configured provider does not support image generation', 422);
    }

    const dataUrl = await provider.generateImage({ prompt, size, referenceImageUrl, aspectRatio });
    const { path, signedUrl } = await uploadGeneratedAsset(supabase, teamId, projectId, dataUrl);

    const { data: asset, error } = await supabase
      .from('assets')
      .insert({
        project_id: projectId,
        storage_path: path,
        type,
        prompt: promptLabel ?? prompt,
        original_prompt: prompt,
        created_by: user.id,
      })
      .select()
      .single();
    if (error) throw error;

    await logActivity(supabase, {
      teamId,
      actorId: user.id,
      action: 'asset.generated',
      targetType: 'asset',
      targetId: asset.id,
      metadata: { provider: provider.name, type },
    });

    return NextResponse.json({ url: signedUrl, asset });
  } catch (err) {
    return errorResponse(err);
  }
}
