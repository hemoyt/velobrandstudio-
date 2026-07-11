import { NextRequest, NextResponse } from 'next/server';
import { requireTeamRole } from '@/lib/authz';
import { errorResponse } from '@/lib/api-response';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    const { supabase } = await requireTeamRole(teamId, 'viewer');

    const { data: members, error } = await supabase
      .from('team_members')
      .select('team_id, user_id, role, joined_at')
      .eq('team_id', teamId)
      .order('joined_at', { ascending: true });
    if (error) throw error;

    const userIds = members.map((m) => m.user_id);
    const { data: profiles } = userIds.length
      ? await supabase.from('profiles').select('id, email, display_name').in('id', userIds)
      : { data: [] };
    const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

    return NextResponse.json({
      members: members.map((m) => ({ ...m, profile: profileById.get(m.user_id) ?? null })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
