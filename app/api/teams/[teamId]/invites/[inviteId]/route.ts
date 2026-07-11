import { NextRequest, NextResponse } from 'next/server';
import { requireTeamRole } from '@/lib/authz';
import { errorResponse, logActivity } from '@/lib/api-response';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string; inviteId: string }> },
) {
  try {
    const { teamId, inviteId } = await params;
    const { supabase, user } = await requireTeamRole(teamId, 'admin');

    const { error } = await supabase.from('invites').delete().eq('id', inviteId).eq('team_id', teamId);
    if (error) throw error;

    await logActivity(supabase, { teamId, actorId: user.id, action: 'invite.revoked', targetType: 'invite', targetId: inviteId });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
