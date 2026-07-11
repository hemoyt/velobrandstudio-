import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireProjectRole } from '@/lib/authz';
import { errorResponse, logActivity } from '@/lib/api-response';

// Enables (or rotates) a public, unguessable share link for a project's read-only view.
export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const { supabase, user, teamId } = await requireProjectRole(projectId, 'admin');

    const share_token = randomUUID();
    const { data: project, error } = await supabase
      .from('projects')
      .update({ share_token })
      .eq('id', projectId)
      .select('share_token')
      .single();
    if (error) throw error;

    await logActivity(supabase, { teamId, actorId: user.id, action: 'project.share_enabled', targetType: 'project', targetId: projectId });

    return NextResponse.json({ shareUrl: `${req.nextUrl.origin}/share/${project.share_token}` });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const { supabase, user, teamId } = await requireProjectRole(projectId, 'admin');

    const { error } = await supabase.from('projects').update({ share_token: null }).eq('id', projectId);
    if (error) throw error;

    await logActivity(supabase, { teamId, actorId: user.id, action: 'project.share_disabled', targetType: 'project', targetId: projectId });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
