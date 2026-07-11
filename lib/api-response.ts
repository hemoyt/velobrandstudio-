import { NextResponse } from 'next/server';
import { AuthzError } from '@/lib/authz';
import { AIProviderError } from '@/lib/providers/types';

export function errorResponse(err: unknown): NextResponse {
  if (err instanceof AuthzError || err instanceof AIProviderError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error(err);
  const message = err instanceof Error ? err.message : 'Unexpected server error';
  return NextResponse.json({ error: message }, { status: 500 });
}

/** Logs an activity_log row for the acting user. Never throws — best-effort only. */
export async function logActivity(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  params: {
    teamId: string;
    actorId: string;
    action: string;
    targetType?: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
  },
) {
  try {
    await supabase.from('activity_log').insert({
      team_id: params.teamId,
      actor_id: params.actorId,
      action: params.action,
      target_type: params.targetType ?? null,
      target_id: params.targetId ?? null,
      metadata: params.metadata ?? null,
    });
  } catch (err) {
    console.error('Failed to log activity', err);
  }
}
