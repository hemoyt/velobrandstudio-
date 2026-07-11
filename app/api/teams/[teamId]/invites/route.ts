import { NextRequest, NextResponse } from 'next/server';
import { requireTeamRole } from '@/lib/authz';
import { errorResponse, logActivity } from '@/lib/api-response';
import { sendInviteEmail } from '@/lib/email';
import type { TeamRole } from '@/lib/supabase/database.types';

const VALID_ROLES: TeamRole[] = ['admin', 'editor', 'viewer']; // inviting as 'owner' isn't allowed

export async function GET(_req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    const { supabase } = await requireTeamRole(teamId, 'admin');
    const { data, error } = await supabase
      .from('invites')
      .select('*')
      .eq('team_id', teamId)
      .is('accepted_at', null)
      .order('expires_at', { ascending: true });
    if (error) throw error;
    return NextResponse.json({ invites: data });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    const { supabase, user } = await requireTeamRole(teamId, 'admin');
    const { email, role = 'editor' } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: `role must be one of ${VALID_ROLES.join(', ')}` }, { status: 400 });
    }

    const { data: team } = await supabase.from('teams').select('name').eq('id', teamId).single();

    const { data: invite, error } = await supabase
      .from('invites')
      .insert({ team_id: teamId, email: email.toLowerCase().trim(), role, invited_by: user.id })
      .select()
      .single();
    if (error) throw error;

    const origin = req.nextUrl.origin;
    const inviteUrl = `${origin}/invite/${invite.token}`;
    const { sent } = await sendInviteEmail({
      to: invite.email,
      teamName: team?.name ?? 'a team',
      inviteUrl,
      invitedByEmail: user.email ?? 'A teammate',
    });

    await logActivity(supabase, {
      teamId,
      actorId: user.id,
      action: 'invite.created',
      targetType: 'invite',
      targetId: invite.id,
      metadata: { email: invite.email, role },
    });

    return NextResponse.json({ invite, inviteUrl, emailSent: sent }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
