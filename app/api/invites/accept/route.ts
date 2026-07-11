import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/authz';
import { errorResponse, logActivity } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await requireUser();
    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: 'token is required' }, { status: 400 });

    const { data: teamId, error } = await supabase.rpc('accept_invite', { p_token: token });
    if (error) throw error;

    await logActivity(supabase, { teamId, actorId: user.id, action: 'invite.accepted', targetType: 'team', targetId: teamId });

    return NextResponse.json({ teamId });
  } catch (err) {
    return errorResponse(err);
  }
}
