import { createClient } from '@/lib/supabase/server';
import type { TeamRole } from '@/lib/supabase/database.types';

const RANK: Record<TeamRole, number> = { viewer: 1, editor: 2, admin: 3, owner: 4 };

export class AuthzError extends Error {
  status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.status = status;
  }
}

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthzError('Not authenticated', 401);
  return { supabase, user };
}

/** Confirms the current user has at least `minRole` on the team that owns `projectId`. */
export async function requireProjectRole(projectId: string, minRole: TeamRole) {
  const { supabase, user } = await requireUser();

  const { data: project, error } = await supabase
    .from('projects')
    .select('id, team_id')
    .eq('id', projectId)
    .maybeSingle();
  if (error) throw error;
  if (!project) throw new AuthzError('Project not found or access denied', 404);

  const { role } = await requireTeamRoleFor(supabase, user.id, project.team_id, minRole);
  return { supabase, user, teamId: project.team_id, role };
}

/** Confirms the current user has at least `minRole` on `teamId` directly. */
export async function requireTeamRole(teamId: string, minRole: TeamRole) {
  const { supabase, user } = await requireUser();
  const { role } = await requireTeamRoleFor(supabase, user.id, teamId, minRole);
  return { supabase, user, role };
}

async function requireTeamRoleFor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  teamId: string,
  minRole: TeamRole,
) {
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership || RANK[membership.role] < RANK[minRole]) {
    throw new AuthzError(`Requires ${minRole} role or higher on this team`, membership ? 403 : 404);
  }

  return { role: membership.role };
}
