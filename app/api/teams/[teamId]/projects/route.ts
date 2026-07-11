import { NextRequest, NextResponse } from 'next/server';
import { requireTeamRole } from '@/lib/authz';
import { errorResponse, logActivity } from '@/lib/api-response';
import { IndustryType } from '@/types';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    const { supabase } = await requireTeamRole(teamId, 'viewer');
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('team_id', teamId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ projects: data });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    const { supabase, user } = await requireTeamRole(teamId, 'editor');
    const { clientName, industry } = await req.json();

    if (!clientName || typeof clientName !== 'string' || !clientName.trim()) {
      return NextResponse.json({ error: 'clientName is required' }, { status: 400 });
    }

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        team_id: teamId,
        client_name: clientName.trim(),
        industry: Object.values(IndustryType).includes(industry) ? industry : IndustryType.GENERAL,
        created_by: user.id,
      })
      .select()
      .single();
    if (error) throw error;

    await logActivity(supabase, {
      teamId,
      actorId: user.id,
      action: 'project.created',
      targetType: 'project',
      targetId: project.id,
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
