import { NextRequest, NextResponse } from 'next/server';
import { requireProjectRole } from '@/lib/authz';
import { getGeminiProvider } from '@/lib/providers/resolve';
import { AIProviderError } from '@/lib/providers/types';
import { errorResponse, logActivity } from '@/lib/api-response';
import { mapBrandIdentityRow } from '@/lib/mappers';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { projectId, description } = await req.json();
    if (!projectId || !description) {
      return NextResponse.json({ error: 'projectId and description are required' }, { status: 400 });
    }

    const { supabase, user, teamId } = await requireProjectRole(projectId, 'editor');
    const provider = await getGeminiProvider(teamId);
    if (!provider.generateBrandText) {
      throw new AIProviderError('Brand text generation is unavailable', 422);
    }

    const identity = await provider.generateBrandText(description);

    const { data, error } = await supabase
      .from('brand_identities')
      .upsert({
        project_id: projectId,
        business_name: identity.businessName,
        description: identity.description,
        color_palette: identity.colorPalette ?? [],
        typography: identity.typography ?? {},
        brand_voice: identity.brandVoice,
        tagline: identity.tagline,
        target_audience: identity.targetAudience,
      })
      .select()
      .single();
    if (error) throw error;

    await logActivity(supabase, {
      teamId,
      actorId: user.id,
      action: 'brand_identity.generated',
      targetType: 'project',
      targetId: projectId,
    });

    return NextResponse.json(mapBrandIdentityRow(data));
  } catch (err) {
    return errorResponse(err);
  }
}
