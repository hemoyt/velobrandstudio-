import { NextRequest, NextResponse } from 'next/server';
import { requireTeamRole } from '@/lib/authz';
import { errorResponse, logActivity } from '@/lib/api-response';
import type { TeamRole } from '@/lib/supabase/database.types';

const VALID_ROLES: TeamRole[] = ['owner', 'admin', 'editor', 'viewer'];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ teamId: string; userId: string }> }) {
  try {
    const { teamId, userId } = await params;
    const { supabase, user } = await requireTeamRole(teamId, 'admin');
    const { role } = await req.json();

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: `role must be one of ${VALID_ROLES.join(', ')}` }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('team_members')
      .update({ role })
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;

    await logActivity(supabase, {
      teamId,
      actorId: user.id,
      action: 'member.role_changed',
      targetType: 'team_member',
      targetId: userId,
      metadata: { role },
    });

    return NextResponse.json({ member: data });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ teamId: string; userId: string }> }) {
  try {
    const { teamId, userId } = await params;
    const { supabase, user } = await requireTeamRole(teamId, 'admin');

    const { error } = await supabase.from('team_members').delete().eq('team_id', teamId).eq('user_id', userId);
    if (error) throw error;

    await logActivity(supabase, {
      teamId,
      actorId: user.id,
      action: 'member.removed',
      targetType: 'team_member',
      targetId: userId,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
