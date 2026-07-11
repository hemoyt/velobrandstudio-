import { NextRequest, NextResponse } from 'next/server';
import { requireProjectRole } from '@/lib/authz';
import { errorResponse, logActivity } from '@/lib/api-response';
import type { Database, ProjectStatus } from '@/lib/supabase/database.types';

const VALID_STATUSES: ProjectStatus[] = ['DRAFT', 'IN_REVIEW', 'APPROVED', 'ARCHIVED'];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const { supabase, user, teamId } = await requireProjectRole(projectId, 'editor');
    const body = await req.json();

    const update: Database['public']['Tables']['projects']['Update'] = {};
    if (typeof body.clientName === 'string') update.client_name = body.clientName;
    if (typeof body.industry === 'string') update.industry = body.industry;
    if (typeof body.brief === 'string') update.brief = body.brief;
    if (typeof body.selectedLogoAssetId === 'string' || body.selectedLogoAssetId === null) {
      update.selected_logo_asset_id = body.selectedLogoAssetId;
    }
    if (body.status) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: `status must be one of ${VALID_STATUSES.join(', ')}` }, { status: 400 });
      }
      update.status = body.status;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data: project, error } = await supabase
      .from('projects')
      .update(update)
      .eq('id', projectId)
      .select()
      .single();
    if (error) throw error;

    await logActivity(supabase, {
      teamId,
      actorId: user.id,
      action: 'project.updated',
      targetType: 'project',
      targetId: projectId,
      metadata: update,
    });

    return NextResponse.json({ project });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const { supabase, user, teamId } = await requireProjectRole(projectId, 'admin');
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (error) throw error;

    await logActivity(supabase, { teamId, actorId: user.id, action: 'project.deleted', targetType: 'project', targetId: projectId });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
