import { NextRequest, NextResponse } from 'next/server';
import { requireProjectRole } from '@/lib/authz';
import { uploadGeneratedAsset } from '@/lib/storage';
import { errorResponse, logActivity } from '@/lib/api-response';

// For user-uploaded assets (e.g. bringing your own logo) rather than AI-generated ones.
export async function POST(req: NextRequest) {
  try {
    const { projectId, dataUrl, type = 'logo', label } = await req.json();
    if (!projectId || !dataUrl) {
      return NextResponse.json({ error: 'projectId and dataUrl are required' }, { status: 400 });
    }

    const { supabase, user, teamId } = await requireProjectRole(projectId, 'editor');
    const { path, signedUrl } = await uploadGeneratedAsset(supabase, teamId, projectId, dataUrl);

    const { data: asset, error } = await supabase
      .from('assets')
      .insert({ project_id: projectId, storage_path: path, type, prompt: label ?? 'Uploaded asset', created_by: user.id })
      .select()
      .single();
    if (error) throw error;

    await logActivity(supabase, { teamId, actorId: user.id, action: 'asset.uploaded', targetType: 'asset', targetId: asset.id });

    return NextResponse.json({ url: signedUrl, asset });
  } catch (err) {
    return errorResponse(err);
  }
}
